import { useEffect, useRef, useState } from 'react'
import { getUserLabel, signOut } from './auth'
import { supabase } from './supabase'
import { buildBasicChartPrompt } from './prompts'
import ResultPanel from './ResultPanel'
import HistorySidebar from './HistorySidebar'
import LoginPage from './LoginPage'
import ProfileModal from './ProfileModal'
import ConfirmModal from './ConfirmModal'
import { IconPillars, IconSeal } from './icons'
import { MyeongdoFigure, MyeongdoSpeech } from './Myeongdo'
import { formatBirthTime, formatKoreanDate } from './format'
import {
  emptyProfile,
  fetchMyProfile,
  isProfileComplete,
  profileToForm,
  upsertMyProfile,
} from './profiles'
import {
  createSajuReading,
  deleteSajuReading,
  fetchSajuReadings,
  updateSajuReading,
} from './sajuReadings'
import './App.css'

const hasApiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY)

function App() {
  const formTopRef = useRef(null)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false)

  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileModalMode, setProfileModalMode] = useState('onboarding')
  const [savingProfile, setSavingProfile] = useState(false)

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [error, setError] = useState('')

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)

  const isEditing = Boolean(selectedId)
  const sidebarVisible = !isMobileLayout || sidebarOpen
  const uiLocked = loading || deletingId !== null || savingProfile || signingOut
  const genderLabel =
    gender === 'male' ? '남자' : gender === 'female' ? '여자' : '미선택'
  const calendarLabel = calendarType === 'lunar' ? '음력' : '양력'
  const profileFormValues = {
    name,
    birth_date: birthDate,
    birth_time: birthTime,
    gender,
    calendar_type: calendarType,
  }
  const pendingDeleteItem = history.find((item) => item.id === pendingDeleteId)

  function applyProfileForm(form) {
    setName(form.name)
    setBirthDate(form.birth_date)
    setBirthTime(form.birth_time)
    setGender(form.gender)
    setCalendarType(form.calendar_type)
  }

  function currentForm() {
    return { name, birthDate, birthTime, gender, calendarType }
  }

  function syncHistoryWithProfile(profile) {
    setHistory((prev) =>
      prev.map((item) => ({
        ...item,
        name: profile.name,
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        gender: profile.gender,
        calendar_type: profile.calendar_type,
      })),
    )
  }

  useEffect(() => {
    let cancelled = false

    async function initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!cancelled) {
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setHistory([])
      setHistoryLoading(false)
      setHistoryError('')
      setProfileLoaded(false)
      setHasCompleteProfile(false)
      setProfileModalOpen(false)
      applyProfileForm(emptyProfile())
      setSelectedId(null)
      setResult('')
      setSidebarOpen(false)
      setPendingDeleteId(null)
      return
    }

    let cancelled = false

    async function loadUserData() {
      setHistoryLoading(true)
      setHistoryError('')
      setProfileLoaded(false)

      try {
        const [profile, rows] = await Promise.all([
          fetchMyProfile(),
          fetchSajuReadings(),
        ])

        if (cancelled) return

        const form = profileToForm(profile)
        applyProfileForm(form)
        setHistory(rows)

        const complete = isProfileComplete(profile)
        setHasCompleteProfile(complete)
        setProfileLoaded(true)

        if (!complete) {
          setProfileModalMode('onboarding')
          setProfileModalOpen(true)
        } else {
          setProfileModalOpen(false)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setHistoryError(err?.message || '저장 데이터를 불러오지 못했습니다.')
          setProfileLoaded(true)
          setProfileModalMode('onboarding')
          setProfileModalOpen(true)
        }
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    loadUserData()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    function syncLayout() {
      const mobile = window.innerWidth <= 860
      setIsMobileLayout(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    syncLayout()
    window.addEventListener('resize', syncLayout)
    return () => window.removeEventListener('resize', syncLayout)
  }, [])

  function clearResultOnly() {
    setSelectedId(null)
    setResult('')
    setError('')
    setLoading(false)
  }

  function handleSelectHistory(item) {
    if (uiLocked) return
    setSelectedId(item.id)
    setResult(item.result_text || '')
    setError('')
  }

  function handleNewSaju() {
    if (uiLocked) return
    clearResultOnly()
    setSidebarOpen(false)

    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function openProfileEditor() {
    if (uiLocked) return
    setProfileModalMode('edit')
    setProfileModalOpen(true)
  }

  function requestDelete(id) {
    if (uiLocked) return
    setPendingDeleteId(id)
  }

  async function handleSignOut() {
    if (uiLocked) return
    setSigningOut(true)
    setError('')

    try {
      await signOut()
      clearResultOnly()
      applyProfileForm(emptyProfile())
      setHistory([])
      setProfileLoaded(false)
      setHasCompleteProfile(false)
      setProfileModalOpen(false)
    } catch (err) {
      console.error(err)
      setError(err?.message || '로그아웃에 실패했습니다.')
    } finally {
      setSigningOut(false)
    }
  }

  async function handleSaveProfile(form) {
    setSavingProfile(true)
    setError('')

    try {
      const profile = await upsertMyProfile(form)
      const nextForm = profileToForm(profile)
      applyProfileForm(nextForm)
      syncHistoryWithProfile(profile)
      setHasCompleteProfile(isProfileComplete(profile))
      setProfileModalOpen(false)
    } finally {
      setSavingProfile(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return

    const id = pendingDeleteId
    setDeletingId(id)
    setError('')

    try {
      await deleteSajuReading(id)
      setHistory((prev) => prev.filter((item) => item.id !== id))
      setPendingDeleteId(null)

      if (selectedId === id) {
        clearResultOnly()
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || '삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!hasCompleteProfile) {
      setProfileModalMode('onboarding')
      setProfileModalOpen(true)
      return
    }

    if (uiLocked && !loading) return

    setLoading(true)

    if (!isEditing) {
      setResult('')
    }

    try {
      if (!hasApiKey) {
        throw new Error(
          'API 키가 설정되지 않았습니다. Netlify 환경변수 VITE_GEMINI_API_KEY를 등록한 뒤 다시 배포하세요.',
        )
      }

      const { askGemini } = await import('./gemini')
      const prompt = buildBasicChartPrompt({
        name: name || '미입력',
        gender: gender || '미입력',
        calendar: calendarLabel,
        birth: birthDate || '미입력',
        time: birthTime || '시간미상',
      })

      const text = await askGemini(prompt)
      setResult(text)

      const payload = { ...currentForm(), resultText: text }

      if (isEditing) {
        const updated = await updateSajuReading(selectedId, payload)
        setHistory((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        )
      } else {
        const saved = await createSajuReading(payload)
        setHistory((prev) => [saved, ...prev])
        setSelectedId(saved.id)
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Gemini API 호출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="auth-loading">
        <MyeongdoFigure pose="analyzing" size="lg" alt="" />
        <p>명도가 로그인 상태를 확인하는 중…</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className={`app-shell ${loading ? 'is-busy' : ''}`}>
      <HistorySidebar
        items={history}
        loading={historyLoading}
        selectedId={selectedId}
        onSelect={handleSelectHistory}
        onNewSaju={handleNewSaju}
        onDelete={requestDelete}
        deletingId={deletingId}
        error={historyError}
        open={sidebarVisible}
        onClose={() => setSidebarOpen(false)}
        disabled={uiLocked}
      />

      <div className="main-stage">
        <div className="page" ref={formTopRef}>
          <div className="auth-bar scroll-panel">
            <div className="auth-bar-left">
              <button
                type="button"
                className="sidebar-open-btn"
                aria-label="해석 기록 열기"
                disabled={uiLocked}
                onClick={() => setSidebarOpen(true)}
              >
                기록
              </button>
              <p className="auth-user">
                <span className="auth-user-label">로그인</span>
                {getUserLabel(user)}
              </p>
            </div>
            <div className="auth-bar-actions">
              <button
                type="button"
                className="auth-profile-btn"
                disabled={!profileLoaded || uiLocked}
                onClick={openProfileEditor}
              >
                프로필 수정
              </button>
              <button
                type="button"
                className="auth-logout-btn"
                disabled={uiLocked}
                onClick={handleSignOut}
              >
                {signingOut ? '로그아웃 중…' : '로그아웃'}
              </button>
            </div>
          </div>

          <header className="hero">
            <div className="hero-top">
              <div className="brand-lockup">
                <MyeongdoFigure pose="welcome" size="sm" alt="" />
                <div>
                  <p className="brand-kicker">AI 사주 가이드</p>
                  <p className="brand">명도</p>
                  <p className="brand-sub">saju-me-ko</p>
                </div>
              </div>
            </div>
            <h1>{isEditing ? '저장된 해석 보기' : '내 사주 보기'}</h1>
            <p className="hero-desc">
              {hasCompleteProfile
                ? '저장된 프로필로 바로 해석하거나, 이전 기록을 확인할 수 있습니다.'
                : '먼저 출생 정보를 입력하면 사주 해석을 시작할 수 있습니다.'}
            </p>
          </header>

          <section
            className="profile-card scroll-panel"
            aria-label="내 프로필"
          >
            <div className="profile-card-top">
              <div className="profile-card-heading">
                <span
                  className="section-icon section-icon--seal"
                  aria-hidden="true"
                >
                  <IconSeal />
                </span>
                <div>
                  <p className="profile-card-label">내 사주 프로필</p>
                  <h2 className="profile-card-name">
                    {hasCompleteProfile ? name : '프로필 미등록'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                className="profile-edit-btn"
                disabled={uiLocked}
                onClick={
                  hasCompleteProfile
                    ? openProfileEditor
                    : () => {
                        setProfileModalMode('onboarding')
                        setProfileModalOpen(true)
                      }
                }
              >
                {hasCompleteProfile ? '수정' : '입력하기'}
              </button>
            </div>

            {hasCompleteProfile ? (
              <dl className="profile-meta">
                <div>
                  <dt>생년월일</dt>
                  <dd>{formatKoreanDate(birthDate) || '-'}</dd>
                </div>
                <div>
                  <dt>태어난 시간</dt>
                  <dd>{formatBirthTime(birthTime)}</dd>
                </div>
                <div>
                  <dt>성별</dt>
                  <dd>{genderLabel}</dd>
                </div>
                <div>
                  <dt>달력</dt>
                  <dd>{calendarLabel}</dd>
                </div>
              </dl>
            ) : (
              <MyeongdoSpeech pose="guide" size="lg" title="프로필이 비어 있어요">
                이름, 생년월일, 성별, 양력/음력은 필수입니다.
              </MyeongdoSpeech>
            )}
          </section>

          <form
            className="reading-panel scroll-panel"
            onSubmit={handleSubmit}
          >
            <div className="reading-panel-copy">
              <div className="reading-panel-heading">
                <span className="section-icon" aria-hidden="true">
                  <IconPillars />
                </span>
                <div>
                  <h2>{isEditing ? '이 기록 다시 해석' : '사주 해석 시작'}</h2>
                  <p>
                    {hasCompleteProfile
                      ? '사주명식 기준으로 현재 프로필을 해석합니다.'
                      : '프로필을 먼저 저장한 뒤 해석을 시작할 수 있습니다.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !hasCompleteProfile || deletingId !== null}
            >
              {loading
                ? '해석 중...'
                : isEditing
                  ? '다시 해석'
                  : '사주 보기'}
            </button>

            {!hasApiKey && (
              <p className="env-warning">
                API 키가 빌드에 포함되지 않았습니다. Netlify 환경변수에{' '}
                <code>VITE_GEMINI_API_KEY</code>를 등록한 뒤 재배포하세요.
              </p>
            )}
          </form>

          <ResultPanel
            loading={loading}
            error={error}
            result={result}
            name={name}
            genderLabel={genderLabel}
            calendarLabel={calendarLabel}
            birthDate={birthDate}
            birthTime={birthTime}
            fromHistory={isEditing}
            selectionKey={selectedId || 'live'}
            onDelete={isEditing ? () => requestDelete(selectedId) : null}
            deleting={deletingId === selectedId}
            disabled={uiLocked}
          />
        </div>
      </div>

      {loading && (
        <div className="busy-overlay" aria-hidden="true">
          <div className="busy-overlay-card">
            <MyeongdoFigure pose="analyzing" size="md" alt="" />
            <p>해석하는 동안 잠시만 기다려 주세요</p>
          </div>
        </div>
      )}

      <ProfileModal
        open={profileModalOpen}
        mode={profileModalMode}
        initialValues={profileFormValues}
        saving={savingProfile}
        onSave={handleSaveProfile}
        onClose={() => {
          if (profileModalMode === 'edit') setProfileModalOpen(false)
        }}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteId)}
        title="해석 기록을 삭제할까요?"
        description={
          pendingDeleteItem
            ? `"${pendingDeleteItem.name?.trim() || '이름 없음'}" 기록이 영구적으로 삭제됩니다.`
            : '선택한 기록이 영구적으로 삭제됩니다.'
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        danger
        busy={deletingId === pendingDeleteId}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deletingId) setPendingDeleteId(null)
        }}
      />
    </div>
  )
}

export default App
