import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 30)

    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onCancel?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, busy, onCancel])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel?.()
      }}
    >
      <div
        className="confirm-dialog scroll-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="confirm-title">
          {title}
        </h2>
        {description && <p className="confirm-desc">{description}</p>}

        <div className="confirm-actions">
          <button
            ref={cancelRef}
            type="button"
            className="secondary-btn"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`submit-btn ${danger ? 'submit-btn--danger' : ''}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
