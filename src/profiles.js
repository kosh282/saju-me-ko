import { supabase } from './supabase'
import { requireUser } from './auth'

const PROFILE_COLUMNS =
  'id, name, birth_date, birth_time, gender, calendar_type, created_at, updated_at'

export function emptyProfile() {
  return {
    name: '',
    birth_date: '',
    birth_time: '',
    gender: '',
    calendar_type: 'solar',
  }
}

export function profileToForm(profile) {
  if (!profile) return emptyProfile()

  return {
    name: profile.name || '',
    birth_date: profile.birth_date || '',
    birth_time: profile.birth_time || '',
    gender: profile.gender || '',
    calendar_type: profile.calendar_type || 'solar',
  }
}

/** 필수: 이름, 생년월일, 성별, 양/음력 (태어난 시간은 선택) */
export function isProfileComplete(profileOrForm) {
  if (!profileOrForm) return false

  const name = (profileOrForm.name || '').trim()
  const birthDate = profileOrForm.birth_date || profileOrForm.birthDate || ''
  const gender = profileOrForm.gender || ''
  const calendarType =
    profileOrForm.calendar_type || profileOrForm.calendarType || ''

  return Boolean(name && birthDate && gender && calendarType)
}

export function validateProfileForm(form) {
  if (!(form.name || '').trim()) return '이름을 입력해 주세요.'
  if (!form.birthDate) return '생년월일을 선택해 주세요.'
  if (!form.gender) return '성별을 선택해 주세요.'
  if (!form.calendarType) return '양력/음력을 선택해 주세요.'
  return ''
}

export function buildProfilePayload({
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

/**
 * 내 프로필 조회
 * - profiles.id = Google 로그인 유저(auth.users.id)
 */
export async function fetchMyProfile() {
  const user = await requireUser()

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 내 프로필 upsert
 * - 항상 현재 Google 로그인 user.id 행만 생성/수정
 */
export async function upsertMyProfile(form) {
  const user = await requireUser()
  const payload = {
    id: user.id,
    ...buildProfilePayload(form),
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}
