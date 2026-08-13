import { supabase } from './supabase'
import { requireUser } from './auth'
import { saveSajuProfile, sajuProfileToForm } from './sajuProfiles'

const READING_COLUMNS = 'id, result_text, created_at, user_id, profile_id'

/** 로그인 계정(profiles)과 분리된 사주 프로필만 embed */
const READING_WITH_SAJU_PROFILE = `${READING_COLUMNS}, saju_profiles!saju_readings_profile_user_fkey ( id, name, birth_date, birth_time, gender, calendar_type )`

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
 * Read — 현재 로그인 유저의 해석만 조회
 */
export async function fetchSajuReadings() {
  const user = await requireUser()

  const { data, error } = await supabase
    .from('saju_readings')
    .select(READING_WITH_SAJU_PROFILE)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const { saju_profiles, ...reading } = row
    return withProfileFields(reading, saju_profiles)
  })
}

/**
 * Create — 선택한 사주 프로필에 해석 저장
 */
export async function createSajuReading({
  resultText,
  profileId = null,
  ...form
}) {
  const user = await requireUser()
  const profile = await saveSajuProfile(profileId, form)

  const { data, error } = await supabase
    .from('saju_readings')
    .insert({
      result_text: resultText,
      user_id: user.id,
      profile_id: profile.id,
    })
    .select(READING_COLUMNS)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return withProfileFields(data, profile)
}

/**
 * Update — 해석 본문 갱신 + 연결 사주 프로필 동기화
 */
export async function updateSajuReading(id, { resultText, profileId, ...form }) {
  const user = await requireUser()
  const profile = await saveSajuProfile(profileId, form)

  const { data, error } = await supabase
    .from('saju_readings')
    .update({
      result_text: resultText,
      profile_id: profile.id,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(READING_COLUMNS)
    .single()

  if (error) throw error
  return withProfileFields(data, profile)
}

/**
 * Delete — 현재 유저의 해당 해석만 삭제
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

export { sajuProfileToForm }
