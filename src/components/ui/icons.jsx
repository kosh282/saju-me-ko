export function IconScroll({ className = 'ui-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h10a2 2 0 0 1 2 2v1H5V5a2 2 0 0 1 2-2Zm12 5v9a2 2 0 0 1-2 2v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-1a2 2 0 0 1-2-2V8h14ZM9 11h6v1.5H9V11Zm0 3h6v1.5H9V14Z"
      />
    </svg>
  )
}

export function IconSeal({ className = 'ui-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        fill="currentColor"
        d="M12 8.2c.7 0 1.3.4 1.6 1l1.7 3.5c.2.5 0 1.1-.5 1.3-.5.2-1.1 0-1.3-.5L12.8 11h-1.6l-.7 2.5c-.2.5-.8.7-1.3.5-.5-.2-.7-.8-.5-1.3L11 9.2c.3-.6.9-1 1.6-1Z"
      />
    </svg>
  )
}

export function IconPillars({ className = 'ui-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h3.2v14H4V5Zm6.4 0H13.6v14h-3.2V5Zm6.4 0H20v14h-3.2V5ZM3 19.5h18V21H3v-1.5Z"
      />
    </svg>
  )
}
