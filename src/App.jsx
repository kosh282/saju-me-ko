import { useEffect, useRef, useState } from 'react'
import { getUserLabel, signOut } from './auth'
import { supabase } from './supabase'
import { buildBasicChartPrompt } from './prompts'
import ResultPanel from './ResultPanel'
import HistorySidebar from './HistorySidebar'
import LoginPage from './LoginPage'
import {
  createSajuReading,
  deleteSajuReading,
  fetchSajuReadings,
  updateSajuReading,
} from './sajuReadings'
import './App.css'

const hasApiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY)

function ChoiceButtons({ label, hint, options, value, onChange, name }) {
  return (
    <div className="field">
      <span className="field-label" id={`${name}-label`}>
        {label}
      </span>
      <p className="hint">{hint}</p>
      <div
        className="choice-buttons"
        role="group"
        aria-labelledby={`${name}-label`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-btn ${value === option.value ? 'active' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function buildPayload(name, birthDate, birthTime, gender, calendarType, resultText) {
  return {
    name: name || '미입력',
    birth_date: birthDate || null,
    birth_time: birthTime || null,
    gender: gender || null,
    calendar_type: calendarType,
    result_text: resultText,
  }
}

function App() {
  const formTopRef = useRef(null)
  const nameInputRef = useRef(null)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingInput, setSavingInput] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const isEditing = Boolean(selectedId)
  const genderLabel =
    gender === 'male' ? '남자' : gender === 'female' ? '여자' : '미선택'
  const calendarLabel = calendarType === 'lunar' ? '음력' : '양력'

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
      return
    }

    let cancelled = false

    async function loadHistory() {
      setHistoryLoading(true)
      setHistoryError('')
      try {
        const rows = await fetchSajuReadings()
        if (!cancelled) setHistory(rows)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setHistoryError(err?.message || '저장 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [user])

  function resetForm() {
    setSelectedId(null)
    setName('')
    setBirthDate('')
    setBirthTime('')
    setGender('')
    setCalendarType('solar')
    setResult('')
    setError('')
    setLoading(false)
  }

  function handleSelectHistory(item) {
    setSelectedId(item.id)
    setName(item.name || '')
    setBirthDate(item.birth_date || '')
    setBirthTime(item.birth_time || '')
    setGender(item.gender || '')
    setCalendarType(item.calendar_type || 'solar')
    setResult(item.result_text || '')
    setError('')
  }

  function handleNewSaju() {
    resetForm()

    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      nameInputRef.current?.focus()
    })
  }

  async function handleSignOut() {
    setSigningOut(true)
    setError('')

    try {
      await signOut()
      resetForm()
      setHistory([])
    } catch (err) {
      console.error(err)
      setError(err?.message || '로그아웃에 실패했습니다.')
    } finally {
      setSigningOut(false)
    }
  }

  async function handleSaveInputOnly() {
    if (!selectedId || !result) return

    setSavingInput(true)
    setError('')

    try {
      const updated = await updateSajuReading(
        selectedId,
        buildPayload(name, birthDate, birthTime, gender, calendarType, result),
      )

      setHistory((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (err) {
      console.error(err)
      setError(err?.message || '입력 정보 저장에 실패했습니다.')
    } finally {
      setSavingInput(false)
    }
  }

  async function handleDelete(id) {
    const target = history.find((item) => item.id === id)
    const label = target?.name || '이름 없음'

    if (!window.confirm(`"${label}" 기록을 삭제할까요?`)) return

    setDeletingId(id)
    setError('')

    try {
      await deleteSajuReading(id)
      setHistory((prev) => prev.filter((item) => item.id !== id))

      if (selectedId === id) {
        handleNewSaju()
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

      const payload = buildPayload(
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
        text,
      )

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
        <p>로그인 상태 확인 중…</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app-shell">
      <HistorySidebar
        items={history}
        loading={historyLoading}
        selectedId={selectedId}
        onSelect={handleSelectHistory}
        onNewSaju={handleNewSaju}
        onDelete={handleDelete}
        deletingId={deletingId}
        error={historyError}
      />

      <div className="page" ref={formTopRef}>
        <div className="auth-bar">
          <p className="auth-user">
            <span className="auth-user-label">로그인</span>
            {getUserLabel(user)}
          </p>
          <button
            type="button"
            className="auth-logout-btn"
            disabled={signingOut}
            onClick={handleSignOut}
          >
            {signingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
        </div>

        <header className="hero">
          <div className="hero-top">
            <p className="brand">saju-me-ko</p>
            {(selectedId || result) && (
              <button
                type="button"
                className="new-saju-btn"
                onClick={handleNewSaju}
              >
                새 사주 만들기
              </button>
            )}
          </div>
          <h1>{isEditing ? '사주 수정' : '사주 입력'}</h1>
          <p className="hero-desc">
            {isEditing
              ? '입력을 바꾼 뒤 저장하거나, 다시 해석할 수 있습니다.'
              : '출생 정보를 입력해 주세요.'}
          </p>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">이름</label>
            <p className="hint">본명을 한글로 입력합니다.</p>
            <input
              id="name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label htmlFor="birthDate">생년월일</label>
            <p className="hint">태어난 날짜를 선택합니다.</p>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="birthTime">태어난 시간</label>
            <p className="hint">모를 경우 비워 두어도 됩니다.</p>
            <input
              id="birthTime"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
            />
          </div>

          <div className="field-row">
            <ChoiceButtons
              name="gender"
              label="성별"
              hint="사주 해석에 사용됩니다."
              value={gender}
              onChange={setGender}
              options={[
                { value: 'male', label: '남자' },
                { value: 'female', label: '여자' },
              ]}
            />

            <ChoiceButtons
              name="calendar"
              label="양력 / 음력"
              hint="달력 기준을 고릅니다."
              value={calendarType}
              onChange={setCalendarType}
              options={[
                { value: 'solar', label: '양력' },
                { value: 'lunar', label: '음력' },
              ]}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? '해석 중...'
                : isEditing
                  ? '다시 해석'
                  : '사주 보기'}
            </button>

            {isEditing && result && (
              <button
                type="button"
                className="secondary-btn"
                disabled={savingInput || loading}
                onClick={handleSaveInputOnly}
              >
                {savingInput ? '저장 중...' : '입력만 저장'}
              </button>
            )}
          </div>

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
          onNewSaju={handleNewSaju}
          onDelete={isEditing ? () => handleDelete(selectedId) : null}
          deleting={deletingId === selectedId}
        />
      </div>
    </div>
  )
}

export default App
