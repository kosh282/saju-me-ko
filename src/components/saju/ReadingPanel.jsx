import { IconPillars } from '../ui/icons'

export default function ReadingPanel({
  isEditing,
  hasCompleteSajuProfile,
  activeProfileLabel,
  hasApiKey,
  loading,
  deletingId,
  onSubmit,
}) {
  return (
    <form className="reading-panel scroll-panel" onSubmit={onSubmit}>
      <div className="reading-panel-copy">
        <div className="reading-panel-heading">
          <span className="section-icon" aria-hidden="true">
            <IconPillars />
          </span>
          <div>
            <h2>{isEditing ? '이 기록 다시 해석' : '사주 해석 시작'}</h2>
            <p>
              {hasCompleteSajuProfile
                ? `"${activeProfileLabel}" 프로필로 사주를 해석합니다.`
                : '위에서 사주 프로필을 입력한 뒤 해석을 시작하세요.'}
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="submit-btn"
        disabled={loading || !hasCompleteSajuProfile || deletingId !== null}
      >
        {loading ? '해석 중...' : isEditing ? '다시 해석' : '사주 보기'}
      </button>

      {!hasApiKey && (
        <p className="env-warning">
          API 키가 빌드에 포함되지 않았습니다. Netlify 환경변수에{' '}
          <code>VITE_GEMINI_API_KEY</code>를 등록한 뒤 재배포하세요.
        </p>
      )}
    </form>
  )
}
