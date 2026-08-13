import { useState } from 'react'
import { signInWithGoogle } from './auth'
import { MyeongdoFigure } from './Myeongdo'

function GoogleIcon() {
  return (
    <svg
      className="google-login-icon"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')

    try {
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Google 로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card scroll-panel">
        <MyeongdoFigure
          pose="welcome"
          size="xl"
          className="login-mascot"
          alt="사주 안내 캐릭터 명도"
        />
        <p className="brand-kicker">AI 사주 가이드</p>
        <p className="brand login-brand">명도</p>
        <p className="login-desc">
          출생 정보로 사주를 보고,
          <br />
          나만의 해석 기록을 남겨보세요.
        </p>

        <button
          type="button"
          className="google-login-btn"
          disabled={loading}
          onClick={handleGoogleLogin}
        >
          <span className="google-login-btn-inner">
            <GoogleIcon />
            <span className="google-login-text">
              {loading ? '로그인 중...' : 'Google로 시작하기'}
            </span>
          </span>
        </button>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  )
}
