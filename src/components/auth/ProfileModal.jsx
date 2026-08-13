import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { emptyAccountProfile, validateAccountForm } from '../../profiles'
import { MyeongdoFigure } from '../ui/Myeongdo'

export default function ProfileModal({
  open,
  initialValues,
  saving = false,
  onSave,
  onClose,
}) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const nameRef = useRef(null)

  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    const values = initialValues || emptyAccountProfile()
    setName(values.name || '')
    setError('')

    const timer = window.setTimeout(() => nameRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open, initialValues])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e) {
      if (e.key === 'Escape' && !saving) {
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
  }, [open, saving, onClose])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()

    const form = { name }
    const validationError = validateAccountForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    try {
      await onSave(form)
    } catch (err) {
      console.error(err)
      setError(err?.message || '계정 프로필 저장에 실패했습니다.')
    }
  }

return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!saving) onClose?.()
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
            <p className="modal-eyebrow">계정</p>
            <h2 id={titleId} className="modal-title">
              로그인 프로필 수정
            </h2>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            aria-label="닫기"
            disabled={saving}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-scroll">
            <div className="modal-guide">
              <MyeongdoFigure pose="guide" size="md" alt="" />
              <div className="modal-guide-copy">
                <p className="modal-guide-title">계정에 보이는 이름이에요</p>
                <p className="modal-guide-desc">
                  사주 해석용 출생 정보는 메인 화면의 사주 프로필에서 따로
                  관리합니다.
                </p>
              </div>
            </div>

            <div className="modal-fields">
              <div className="field">
                <label htmlFor="account-name">
                  표시 이름 <span className="required-mark">필수</span>
                </label>
                <input
                  id="account-name"
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {error && <p className="modal-error">{error}</p>}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              disabled={saving}
              onClick={onClose}
            >
              취소
            </button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? '저장 중...' : '계정 프로필 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
