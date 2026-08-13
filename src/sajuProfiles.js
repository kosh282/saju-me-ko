import { supabase } from './supabase'
import { requireUser } from './auth'

const SAJU_PROFILE_COLUMNS =
  'id, user_id, name, birth_date, birth_time, gender, calendar_type, created_at, updated_at'

export function emptySajuProfile() {
  return {
    name: '',
    birth_date: '',
    birth_time: '',
    gender: '',
    calendar_type: 'solar',
  }
}

export function sajuProfileToForm(profile) {
  if (!profile) return emptySajuProfile()

  return {
    name: profile.name || '',
    birth_date: profile.birth_date || '',
    birth_time: profile.birth_time || '',
    gender: profile.gender || '',
    calendar_type: profile.calendar_type || 'solar',
  }
}

/** 필수: 이름, 생년월일, 성별, 양/음력 (태어난 시간은 선택) */
export function isSajuProfileComplete(profileOrForm) {
  if (!profileOrForm) return false

  const name = (profileOrForm.name || '').trim()
  const birthDate = profileOrForm.birth_date || profileOrForm.birthDate || ''
  const gender = profileOrForm.gender || ''
  const calendarType =
    profileOrForm.calendar_type || profileOrForm.calendarType || ''

  return Boolean(name && birthDate && gender && calendarType)
}

export function validateSajuProfileForm(form) {
  if (!(form.name || '').trim()) return '이름을 입력해 주세요.'
  if (!form.birthDate) return '생년월일을 선택해 주세요.'
  if (!form.gender) return '성별을 선택해 주세요.'
  if (!form.calendarType) return '양력/음력을 선택해 주세요.'
  return ''
}

export function buildSajuProfilePayload({
  name,
  birthDate,
  birthTime,
  gender,
  calendarType,
}) {
  return {
    name: (name || '').trim(),
    birth_date: birthDate || null,
    birth_time: birthTime || null,
    gender: gender || null,
    calendar_type: calendarType || 'solar',
    updated_at: new Date().toISOString(),
  }
}

export async function fetchMySajuProfiles() {
  const user = await requireUser()

  const { data, error } = await supabase
    .from('saju_profiles')
    .select(SAJU_PROFILE_COLUMNS)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createSajuProfile(form) {
  const user = await requireUser()
  const payload = {
    user_id: user.id,
    ...buildSajuProfilePayload(form),
  }

  const { data, error } = await supabase
    .from('saju_profiles')
    .insert(payload)
    .select(SAJU_PROFILE_COLUMNS)
    .single()

  if (error) throw error
  return data
}

export async function updateSajuProfile(id, form) {
  const user = await requireUser()
  const payload = buildSajuProfilePayload(form)

  const { data, error } = await supabase
    .from('saju_profiles')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(SAJU_PROFILE_COLUMNS)
    .single()

  if (error) throw error
  return data
}

/** 있으면 수정, 없으면 생성. id가 없으면 생성 */
export async function saveSajuProfile(id, form) {
  if (id) return updateSajuProfile(id, form)
  return createSajuProfile(form)
}

export async function deleteSajuProfile(id) {
  const user = await requireUser()

  const { error } = await supabase
    .from('saju_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}
