import { supabase } from './supabase'
import { requireUser } from './auth'

const READING_COLUMNS =
  'id, name, birth_date, birth_time, gender, calendar_type, result_text, created_at'

/** Read — 내 사주 목록 조회 */
export async function fetchSajuReadings() {
  await requireUser()

  const { data, error } = await supabase
    .from('saju_readings')
    .select(READING_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Create — 새 사주 저장 (user_id 자동 포함) */
export async function createSajuReading(payload) {
  const user = await requireUser()

  const { data, error } = await supabase
    .from('saju_readings')
    .insert({ ...payload, user_id: user.id })
    .select(READING_COLUMNS)
    .single()

  if (error) throw error
  return data
}

/** Update — 내 사주 수정 */
export async function updateSajuReading(id, payload) {
  await requireUser()

  const { data, error } = await supabase
    .from('saju_readings')
    .update(payload)
    .eq('id', id)
    .select(READING_COLUMNS)
    .single()

  if (error) throw error
  return data
}

/** Delete — 내 사주 삭제 */
export async function deleteSajuReading(id) {
  await requireUser()

  const { error } = await supabase.from('saju_readings').delete().eq('id', id)

  if (error) throw error
}
