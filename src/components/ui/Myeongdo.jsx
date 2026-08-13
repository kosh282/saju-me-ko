export const MYEONGDO = {
  welcome: '/assets/myeongdo-welcome.webp?v=4',
  guide: '/assets/myeongdo-guide.webp?v=4',
  analyzing: '/assets/myeongdo-analyzing.webp?v=4',
  empty: '/assets/myeongdo-empty.webp?v=4',
}

export function MyeongdoFigure({
  pose = 'welcome',
  alt = '명도',
  className = '',
  size = 'md',
}) {
  const src = MYEONGDO[pose] || MYEONGDO.welcome

  return (
    <figure className={`myeongdo myeongdo--${size} ${className}`.trim()}>
      <img src={src} alt={alt} className="myeongdo-img" draggable={false} />
    </figure>
  )
}

export function MyeongdoSpeech({
  pose = 'guide',
  title,
  children,
  className = '',
  size = 'md',
}) {
  return (
    <div className={`myeongdo-speech ${className}`.trim()}>
      <MyeongdoFigure pose={pose} size={size} alt="" />
      <div className="myeongdo-bubble">
        {title && <p className="myeongdo-bubble-title">{title}</p>}
        <div className="myeongdo-bubble-body">{children}</div>
      </div>
    </div>
  )
}
