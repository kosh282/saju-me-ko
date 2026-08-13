import { supabase } from './supabase'
import { requireUser } from './auth'
import { upsertMyProfile } from './profiles'

const READING_COLUMNS = 'id, result_text, created_at, user_id, profile_id'

function withProfileFields(reading, profile) {
  if (!reading) return reading

  return {
    ...reading,
    name: profile?.name || '미입력',
    birth_date: profile?.birth_date || null,
    birth_time: profile?.birth_time || null,
    gender: profile?.gender || null,
    calendar_type: profile?.calendar_type || 'solar',
  }
}

/**
 * Read — 현재 Google 로그인 유저의 해석만 조회
 * - user_id = auth.users.id
 */
export async function fetchSajuReadings() {
  const user = await requireUser()

  const { data, error } = await supabase
    .from('saju_readings')
    .select(
      `${READING_COLUMNS}, profiles ( name, birth_date, birth_time, gender, calendar_type )`,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const { profiles, ...reading } = row
    return withProfileFields(reading, profiles)
  })
}

/**
 * Create — 해석 결과를 현재 Google 유저 계정에 저장
 * - user_id / profile_id 모두 auth.users.id
 */
export async function createSajuReading({ resultText, ...form }) {
  const user = await requireUser()
  const profile = await upsertMyProfile(form)

  if (profile.id !== user.id) {
    throw new Error('프로필과 로그인 계정이 일치하지 않습니다.')
  }

  const { data, error } = await supabase
    .from('saju_readings')
    .insert({
      result_text: resultText,
      user_id: user.id,
      profile_id: user.id,
    })
    .select(READING_COLUMNS)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return withProfileFields(data, profile)
}

/**
 * Update — 현재 Google 유저의 해당 해석만 수정
 */
export async function updateSajuReading(id, { resultText, ...form }) {
  const user = await requireUser()
  const profile = await upsertMyProfile(form)

  const { data, error } = await supabase
    .from('saju_readings')
    .update({ result_text: resultText })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(READING_COLUMNS)
    .single()

  if (error) throw error
  return withProfileFields(data, profile)
}

/**
 * Delete — 현재 Google 유저의 해당 해석만 삭제
 */
export async function deleteSajuReading(id) {
  const user = await requireUser()

  const { error } = await supabase
    .from('saju_readings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}
