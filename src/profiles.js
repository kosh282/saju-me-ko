import { supabase } from './supabase'
import { requireUser, getUserLabel } from './auth'

const ACCOUNT_COLUMNS = 'id, name, created_at, updated_at'

export function emptyAccountProfile(user = null) {
  return {
    name: user ? getUserLabel(user) : '',
  }
}

export function accountToForm(profile, user = null) {
  if (!profile) return emptyAccountProfile(user)
  return {
    name: profile.name?.trim() || getUserLabel(user) || '',
  }
}

export function validateAccountForm(form) {
  if (!(form.name || '').trim()) return '표시 이름을 입력해 주세요.'
  return ''
}

/**
 * 로그인 계정 프로필 조회 (auth.users 1:1)
 */
export async function fetchMyAccountProfile() {
  const user = await requireUser()

  const { data, error } = await supabase
    .from('profiles')
    .select(ACCOUNT_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 로그인 계정 프로필 upsert (표시 이름)
 */
export async function upsertMyAccountProfile(form, userHint = null) {
  const user = userHint || (await requireUser())
  const name = (form.name || '').trim() || getUserLabel(user)

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select(ACCOUNT_COLUMNS)
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}
