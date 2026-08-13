/** 생년월일 YYYY-MM-DD → 한국어 표기 */
export function formatKoreanDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** 해석 생성 시각 → 일자만 */
export function formatReadingDate(value) {
  if (!value) return '날짜 미상'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '날짜 미상'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatBirthTime(value) {
  if (!value) return '시간 미상'
  return value
}
