import { MyeongdoFigure } from '../ui/Myeongdo'

export default function AuthLoading() {
  return (
    <div className="auth-loading">
      <MyeongdoFigure pose="analyzing" size="lg" alt="" />
      <p>명도가 로그인 상태를 확인하는 중…</p>
    </div>
  )
}
