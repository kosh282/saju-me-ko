import { formatBirthTime, formatKoreanDate, formatReadingDate } from '../../format'
import { IconScroll } from '../ui/icons'
import { MyeongdoSpeech } from '../ui/Myeongdo'

function formatItemName(item) {
  return item.name?.trim() || '이름 없음'
}

function formatMeta(item) {
  const gender =
    item.gender === 'male' ? '남' : item.gender === 'female' ? '여' : '-'
  const calendar = item.calendar_type === 'lunar' ? '음력' : '양력'
  const birth = formatKoreanDate(item.birth_date) || '생년월일 미상'
  const time = item.birth_time ? ` · ${formatBirthTime(item.birth_time)}` : ''
  return `${gender} · ${calendar} · ${birth}${time}`
}

export default function HistorySidebar({
  items,
  loading,
  selectedId,
  onSelect,
  onNewSaju,
  onDelete,
  deletingId,
  error,
  open = true,
  onClose,
  disabled = false,
}) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`sidebar scroll-panel ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
      >
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <span className="section-icon" aria-hidden="true">
              <IconScroll />
            </span>
            <div>
              <h2 className="sidebar-title">해석 기록</h2>
              <p className="sidebar-desc">이름·출생 정보와 해석일</p>
            </div>
            <button
              type="button"
              className="sidebar-close-btn"
              aria-label="기록 닫기"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <button
            type="button"
            className="new-saju-btn new-saju-btn--sidebar"
            disabled={disabled}
            onClick={() => {
              onNewSaju()
              onClose?.()
            }}
          >
            새 사주 만들기
          </button>
        </div>

        {loading && <p className="sidebar-status">불러오는 중…</p>}
        {error && <p className="sidebar-error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="sidebar-empty">
            <MyeongdoSpeech pose="empty" size="md" title="아직 기록이 없어요">
              사주 보기를 누르면 여기에 해석이 쌓입니다.
            </MyeongdoSpeech>
          </div>
        )}

        <ul className="sidebar-list">
          {items.map((item) => {
            const label = formatItemName(item)
            const readingDate = formatReadingDate(item.created_at)

            return (
              <li key={item.id} className="sidebar-list-item">
                <button
                  type="button"
                  className={`sidebar-item ${selectedId === item.id ? 'active' : ''}`}
                  disabled={disabled}
                  onClick={() => {
                    onSelect(item)
                    onClose?.()
                  }}
                >
                  <span className="sidebar-item-name">{label}</span>
                  <span className="sidebar-item-date">해석일 · {readingDate}</span>
                  <span className="sidebar-item-meta">{formatMeta(item)}</span>
                </button>
                <button
                  type="button"
                  className="sidebar-delete-btn"
                  aria-label={`${label} 기록 삭제`}
                  disabled={disabled || deletingId === item.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.id)
                  }}
                >
                  {deletingId === item.id ? '…' : '삭제'}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </>
  )
}
