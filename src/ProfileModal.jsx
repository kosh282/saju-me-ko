import { useEffect, useId, useRef, useState } from 'react'
import { emptyProfile, validateProfileForm } from './profiles'
import { MyeongdoFigure } from './Myeongdo'

function ChoiceButtons({ label, options, value, onChange, name, required = false }) {
  return (
    <div className="field">
      <span className="field-label" id={`${name}-label`}>
        {label}
        {required && <span className="required-mark">필수</span>}
      </span>
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

export default function ProfileModal({
  open,
  mode = 'onboarding',
  initialValues,
  saving = false,
  onSave,
  onClose,
}) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const isOnboarding = mode === 'onboarding'

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    const values = initialValues || emptyProfile()
    setName(values.name || '')
    setBirthDate(values.birth_date || '')
    setBirthTime(values.birth_time || '')
    setGender(values.gender || '')
    setCalendarType(values.calendar_type || 'solar')
    setError('')

    const timer = window.setTimeout(() => nameRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open, initialValues])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e) {
      if (e.key === 'Escape' && !isOnboarding && !saving) {
        onClose?.()
        return
      }

      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, isOnboarding, saving, onClose])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()

    const form = { name, birthDate, birthTime, gender, calendarType }
    const validationError = validateProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      await onSave(form)
    } catch (err) {
      console.error(err)
      setError(err?.message || '프로필 저장에 실패했습니다.')
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!isOnboarding && !saving) onClose?.()
      }}
    >
      <div
        ref={dialogRef}
        className="modal-dialog scroll-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-copy">
            <p className="modal-eyebrow">
              {isOnboarding ? '명도의 안내' : '프로필'}
            </p>
            <h2 id={titleId} className="modal-title">
              {isOnboarding ? '내 출생 정보 입력' : '프로필 수정'}
            </h2>
          </div>

          {!isOnboarding && (
            <button
              type="button"
              className="modal-close-btn"
              aria-label="닫기"
              disabled={saving}
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-scroll">
            <div className="modal-guide">
              <MyeongdoFigure pose="guide" size="md" alt="" />
              <div className="modal-guide-copy">
                <p className="modal-guide-title">
                  {isOnboarding
                    ? '사주를 보려면 정보가 필요해요'
                    : '정보를 고쳐 드릴게요'}
                </p>
                <p className="modal-guide-desc">
                  {isOnboarding
                    ? '필수 항목만 입력하면 다음부터 자동으로 불러옵니다.'
                    : '변경한 내용은 다음 해석부터 바로 반영됩니다.'}
                </p>
              </div>
            </div>

            <div className="modal-fields">
              <div className="field">
                <label htmlFor="profile-name">
                  이름 <span className="required-mark">필수</span>
                </label>
                <input
                  id="profile-name"
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  autoComplete="name"
                  enterKeyHint="next"
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="profile-birthDate">
                    생년월일 <span className="required-mark">필수</span>
                  </label>
                  <input
                    id="profile-birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="profile-birthTime">
                    태어난 시간
                    <span className="optional-mark">선택</span>
                  </label>
                  <div className="field-with-action">
                    <input
                      id="profile-birthTime"
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                    />
                    {birthTime && (
                      <button
                        type="button"
                        className="field-clear-btn"
                        onClick={() => setBirthTime('')}
                      >
                        지우기
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="field-row">
                <ChoiceButtons
                  name="profile-gender"
                  label="성별"
                  required
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: 'male', label: '남자' },
                    { value: 'female', label: '여자' },
                  ]}
                />

                <ChoiceButtons
                  name="profile-calendar"
                  label="양력 / 음력"
                  required
                  value={calendarType}
                  onChange={setCalendarType}
                  options={[
                    { value: 'solar', label: '양력' },
                    { value: 'lunar', label: '음력' },
                  ]}
                />
              </div>
            </div>

            {error && <p className="modal-error">{error}</p>}
          </div>

          <div className="modal-actions">
            {!isOnboarding && (
              <button
                type="button"
                className="secondary-btn"
                disabled={saving}
                onClick={onClose}
              >
                취소
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving
                ? '저장 중...'
                : isOnboarding
                  ? '저장하고 시작하기'
                  : '프로필 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
