import { supabase } from './supabase'

function formatMeta(item) {
  const gender =
    item.gender === 'male' ? '남' : item.gender === 'female' ? '여' : '-'
  const calendar = item.calendar_type === 'lunar' ? '음력' : '양력'
  const date = item.birth_date || '날짜 미상'
  return `${gender} · ${calendar} ${date}`
}

export default function HistorySidebar({
  items,
  loading,
  selectedId,
  onSelect,
  onNewSaju,
  error,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">저장된 사주</h2>
        <p className="sidebar-desc">이름과 입력·결과를 함께 보관합니다.</p>
        <button
          type="button"
          className="new-saju-btn new-saju-btn--sidebar"
          onClick={onNewSaju}
        >
          새 사주 만들기
        </button>
      </div>

      {loading && <p className="sidebar-status">불러오는 중…</p>}
      {error && <p className="sidebar-error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="sidebar-status">아직 저장된 기록이 없습니다.</p>
      )}

      <ul className="sidebar-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`sidebar-item ${selectedId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <span className="sidebar-item-name">{item.name || '이름 없음'}</span>
              <span className="sidebar-item-meta">{formatMeta(item)}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export async function fetchSajuReadings() {
  const { data, error } = await supabase
    .from('saju_readings')
    .select(
      'id, name, birth_date, birth_time, gender, calendar_type, result_text, created_at',
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function saveSajuReading(payload) {
  const { data, error } = await supabase
    .from('saju_readings')
    .insert(payload)
    .select(
      'id, name, birth_date, birth_time, gender, calendar_type, result_text, created_at',
    )
    .single()

  if (error) throw error
  return data
}
