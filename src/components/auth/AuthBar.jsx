export default function AuthBar({
  displayName,
  accountLoaded,
  uiLocked,
  signingOut,
  onOpenSidebar,
  onOpenAccount,
  onSignOut,
}) {
  return (
    <div className="auth-bar scroll-panel">
      <div className="auth-bar-left">
        <button
          type="button"
          className="sidebar-open-btn"
          aria-label="해석 기록 열기"
          disabled={uiLocked}
          onClick={onOpenSidebar}
        >
          기록
        </button>
        <p className="auth-user">
          <span className="auth-user-label">로그인</span>
          {displayName}
        </p>
      </div>
      <div className="auth-bar-actions">
        <button
          type="button"
          className="auth-profile-btn"
          disabled={!accountLoaded || uiLocked}
          onClick={onOpenAccount}
        >
          계정 프로필
        </button>
        <button
          type="button"
          className="auth-logout-btn"
          disabled={uiLocked}
          onClick={onSignOut}
        >
          {signingOut ? '로그아웃 중…' : '로그아웃'}
        </button>
      </div>
    </div>
  )
}
