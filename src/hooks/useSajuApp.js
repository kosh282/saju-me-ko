import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../analytics'
import { getUserLabel, signOut } from '../auth'
import { hasApiKey, NEW_PROFILE_ID } from '../constants'
import { buildBasicChartPrompt } from '../prompts'
import {
  accountToForm,
  fetchMyAccountProfile,
  upsertMyAccountProfile,
} from '../profiles'
import {
  emptySajuProfile,
  fetchMySajuProfiles,
  isSajuProfileComplete,
  sajuProfileToForm,
  saveSajuProfile,
  validateSajuProfileForm,
} from '../sajuProfiles'
import {
  createSajuReading,
  deleteSajuReading,
  fetchSajuReadings,
  updateSajuReading,
} from '../sajuReadings'
import { supabase } from '../supabase'

export function useSajuApp() {
  const formTopRef = useRef(null)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const [accountName, setAccountName] = useState('')
  const [accountLoaded, setAccountLoaded] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)

  const [sajuProfiles, setSajuProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(NEW_PROFILE_ID)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')
  const [savingSajuProfile, setSavingSajuProfile] = useState(false)
  const [profileFormError, setProfileFormError] = useState('')

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
  const uiLocked =
    loading ||
    deletingId !== null ||
    savingAccount ||
    savingSajuProfile ||
    signingOut
  const genderLabel =
    gender === 'male' ? '남자' : gender === 'female' ? '여자' : '미선택'
  const calendarLabel = calendarType === 'lunar' ? '음력' : '양력'
  const currentSajuForm = {
    name,
    birth_date: birthDate,
    birth_time: birthTime,
    gender,
    calendar_type: calendarType,
  }
  const hasCompleteSajuProfile = isSajuProfileComplete(currentSajuForm)
  const accountFormValues = { name: accountName }
  const pendingDeleteItem = history.find((item) => item.id === pendingDeleteId)
  const isNewSajuProfile = activeProfileId === NEW_PROFILE_ID
  const activeProfileLabel = isNewSajuProfile
    ? '새 프로필'
    : name.trim() ||
      sajuProfiles.find((p) => p.id === activeProfileId)?.name ||
      '사주 프로필'
  const displayName = accountName || getUserLabel(user)

  function applySajuForm(form) {
    setName(form.name || '')
    setBirthDate(form.birth_date || '')
    setBirthTime(form.birth_time || '')
    setGender(form.gender || '')
    setCalendarType(form.calendar_type || 'solar')
    setProfileFormError('')
  }

  function currentForm() {
    return { name, birthDate, birthTime, gender, calendarType }
  }

  function selectSajuProfile(profileId) {
    if (uiLocked) return

    if (profileId === NEW_PROFILE_ID) {
      trackEvent('select_saju_profile', { profile: 'new' })
      setActiveProfileId(NEW_PROFILE_ID)
      applySajuForm(emptySajuProfile())
      clearResultOnly()
      return
    }

    const profile = sajuProfiles.find((item) => item.id === profileId)
    if (!profile) return

    trackEvent('select_saju_profile', { profile_id: profile.id })
    setActiveProfileId(profile.id)
    applySajuForm(sajuProfileToForm(profile))
    clearResultOnly()
  }

  function syncHistoryWithSajuProfile(profile) {
    setHistory((prev) =>
      prev.map((item) =>
        item.profile_id === profile.id
          ? {
              ...item,
              name: profile.name,
              birth_date: profile.birth_date,
              birth_time: profile.birth_time,
              gender: profile.gender,
              calendar_type: profile.calendar_type,
            }
          : item,
      ),
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)

      if (event === 'SIGNED_IN') {
        trackEvent('login', { method: 'google' })
      }
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
      setAccountLoaded(false)
      setAccountName('')
      setAccountModalOpen(false)
      setSajuProfiles([])
      setActiveProfileId(NEW_PROFILE_ID)
      applySajuForm(emptySajuProfile())
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
      setAccountLoaded(false)

      try {
        const [account, profiles, rows] = await Promise.all([
          fetchMyAccountProfile(),
          fetchMySajuProfiles(),
          fetchSajuReadings(),
        ])

        if (cancelled) return

        const accountForm = accountToForm(account, user)
        setAccountName(accountForm.name)
        if (!account) {
          await upsertMyAccountProfile(accountForm, user)
        }

        setSajuProfiles(profiles)
        setHistory(rows)

        if (profiles.length > 0) {
          setActiveProfileId(profiles[0].id)
          applySajuForm(sajuProfileToForm(profiles[0]))
        } else {
          setActiveProfileId(NEW_PROFILE_ID)
          applySajuForm(emptySajuProfile())
        }

        setAccountLoaded(true)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setHistoryError(err?.message || '저장 데이터를 불러오지 못했습니다.')
          setAccountName(getUserLabel(user))
          setAccountLoaded(true)
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
    trackEvent('select_history', { reading_id: item.id })
    setSelectedId(item.id)
    setResult(item.result_text || '')
    setError('')

    if (item.profile_id) {
      const profile = sajuProfiles.find((p) => p.id === item.profile_id)
      if (profile) {
        setActiveProfileId(profile.id)
        applySajuForm(sajuProfileToForm(profile))
      } else {
        setActiveProfileId(item.profile_id)
        applySajuForm({
          name: item.name || '',
          birth_date: item.birth_date || '',
          birth_time: item.birth_time || '',
          gender: item.gender || '',
          calendar_type: item.calendar_type || 'solar',
        })
      }
    }
  }

  function handleNewSaju() {
    if (uiLocked) return
    trackEvent('new_saju')
    clearResultOnly()
    setSidebarOpen(false)

    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function openAccountEditor() {
    if (uiLocked) return
    trackEvent('open_account')
    setAccountModalOpen(true)
  }

  function requestDelete(id) {
    if (uiLocked) return
    trackEvent('delete_request', { reading_id: id })
    setPendingDeleteId(id)
  }

  async function handleSignOut() {
    if (uiLocked) return
    trackEvent('sign_out')
    setSigningOut(true)
    setError('')

    try {
      await signOut()
      clearResultOnly()
      applySajuForm(emptySajuProfile())
      setSajuProfiles([])
      setHistory([])
      setAccountLoaded(false)
      setAccountName('')
      setAccountModalOpen(false)
    } catch (err) {
      console.error(err)
      setError(err?.message || '로그아웃에 실패했습니다.')
    } finally {
      setSigningOut(false)
    }
  }

  async function handleSaveAccount(form) {
    setSavingAccount(true)
    setError('')

    try {
      const profile = await upsertMyAccountProfile(form, user)
      setAccountName(profile.name || form.name)
      setAccountModalOpen(false)
      trackEvent('save_account')
    } finally {
      setSavingAccount(false)
    }
  }

  async function handleSaveSajuProfile() {
    if (uiLocked) return

    const validationError = validateSajuProfileForm(currentForm())
    if (validationError) {
      setProfileFormError(validationError)
      return
    }

    setSavingSajuProfile(true)
    setProfileFormError('')
    setError('')

    try {
      const saved = await saveSajuProfile(
        isNewSajuProfile ? null : activeProfileId,
        currentForm(),
      )

      setSajuProfiles((prev) => {
        const others = prev.filter((item) => item.id !== saved.id)
        return [saved, ...others]
      })
      setActiveProfileId(saved.id)
      applySajuForm(sajuProfileToForm(saved))
      syncHistoryWithSajuProfile(saved)
      trackEvent('save_saju_profile', {
        is_new: isNewSajuProfile,
        profile_id: saved.id,
      })
    } catch (err) {
      console.error(err)
      setProfileFormError(err?.message || '사주 프로필 저장에 실패했습니다.')
    } finally {
      setSavingSajuProfile(false)
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
      trackEvent('delete_reading', { reading_id: id })

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

    const validationError = validateSajuProfileForm(currentForm())
    if (validationError) {
      setProfileFormError(validationError)
      return
    }

    if (uiLocked && !loading) return

    const mode = isEditing ? 'reanalyze' : 'new'
    trackEvent('saju_submit', { mode })

    setLoading(true)
    setProfileFormError('')

    if (!isEditing) {
      setResult('')
    }

    try {
      if (!hasApiKey) {
        throw new Error(
          'API 키가 설정되지 않았습니다. Netlify 환경변수 VITE_GEMINI_API_KEY를 등록한 뒤 다시 배포하세요.',
        )
      }

      const { askGemini } = await import('../gemini')
      const prompt = buildBasicChartPrompt({
        name: name || '미입력',
        gender: gender || '미입력',
        calendar: calendarLabel,
        birth: birthDate || '미입력',
        time: birthTime || '시간미상',
      })

      const text = await askGemini(prompt)
      setResult(text)

      const payload = {
        ...currentForm(),
        resultText: text,
        profileId: isNewSajuProfile ? null : activeProfileId,
      }

      if (isEditing) {
        const updated = await updateSajuReading(selectedId, payload)
        setHistory((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        )
        if (updated.profile_id) {
          const refreshed = await fetchMySajuProfiles()
          setSajuProfiles(refreshed)
          setActiveProfileId(updated.profile_id)
          applySajuForm({
            name: updated.name,
            birth_date: updated.birth_date,
            birth_time: updated.birth_time || '',
            gender: updated.gender || '',
            calendar_type: updated.calendar_type || 'solar',
          })
        }
      } else {
        const saved = await createSajuReading(payload)
        setHistory((prev) => [saved, ...prev])
        setSelectedId(saved.id)

        const refreshed = await fetchMySajuProfiles()
        setSajuProfiles(refreshed)
        setActiveProfileId(saved.profile_id)
        applySajuForm({
          name: saved.name,
          birth_date: saved.birth_date,
          birth_time: saved.birth_time || '',
          gender: saved.gender || '',
          calendar_type: saved.calendar_type || 'solar',
        })
      }

      trackEvent('saju_success', { mode })
    } catch (err) {
      console.error(err)
      trackEvent('saju_error', {
        mode,
        message: err?.message || 'unknown',
      })
      setError(err?.message || 'Gemini API 호출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return {
    formTopRef,
    user,
    authLoading,
    signingOut,
    accountLoaded,
    accountModalOpen,
    savingAccount,
    accountFormValues,
    displayName,
    sajuProfiles,
    activeProfileId,
    activeProfileLabel,
    name,
    birthDate,
    birthTime,
    gender,
    calendarType,
    genderLabel,
    calendarLabel,
    savingSajuProfile,
    profileFormError,
    hasCompleteSajuProfile,
    result,
    loading,
    deletingId,
    pendingDeleteId,
    pendingDeleteItem,
    error,
    history,
    historyLoading,
    historyError,
    selectedId,
    sidebarVisible,
    isEditing,
    uiLocked,
    hasApiKey,
    setName,
    setBirthDate,
    setBirthTime,
    setGender,
    setCalendarType,
    setSidebarOpen,
    setAccountModalOpen,
    setPendingDeleteId,
    selectSajuProfile,
    handleSelectHistory,
    handleNewSaju,
    openAccountEditor,
    requestDelete,
    handleSignOut,
    handleSaveAccount,
    handleSaveSajuProfile,
    confirmDelete,
    handleSubmit,
  }
}
