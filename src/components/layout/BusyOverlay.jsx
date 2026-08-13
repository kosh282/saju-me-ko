import { MyeongdoFigure } from '../ui/Myeongdo'

export default function BusyOverlay() {
  return (
    <div className="busy-overlay" aria-hidden="true">
      <div className="busy-overlay-card">
        <MyeongdoFigure pose="analyzing" size="md" alt="" />
        <p>해석하는 동안 잠시만 기다려 주세요</p>
      </div>
    </div>
  )
}
