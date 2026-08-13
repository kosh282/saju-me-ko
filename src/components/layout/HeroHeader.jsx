import { MyeongdoFigure } from '../ui/Myeongdo'

export default function HeroHeader({ isEditing }) {
  return (
    <header className="hero">
      <div className="hero-top">
        <div className="brand-lockup">
          <MyeongdoFigure pose="welcome" size="sm" alt="" />
          <div>
            <p className="brand-kicker">AI 사주 가이드</p>
            <p className="brand">명도</p>
            <p className="brand-sub">saju-me-ko</p>
          </div>
        </div>
      </div>
      <h1>{isEditing ? '저장된 해석 보기' : '내 사주 보기'}</h1>
      <p className="hero-desc">
        사주 프로필을 여러 개 두고, 메인에서 바로 수정한 뒤 해석할 수 있습니다.
      </p>
    </header>
  )
}
