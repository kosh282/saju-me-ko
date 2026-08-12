import { supabase } from './supabase'

/** Google OAuth 로그인 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) throw error
}

/** 로그아웃 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** 현재 로그인 사용자 (없으면 null) */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  return user
}

/** 로그인 필수 — 없으면 에러 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('로그인이 필요합니다.')
  return user
}

export function getUserLabel(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    '사용자'
  )
}
