import { useEffect, useRef, useState } from 'react'
import { formatSajuResult, parseFortuneLines, parseSajuResult } from './parseResult'

function ResultSkeleton() {
  return (
    <div className="result-skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line--medium" />
    </div>
  )
}

function SectionBody({ section }) {
  if (section.id === 'fortuneSummary') {
    const lines = parseFortuneLines(section.content)

    return (
      <ul className="fortune-summary">
        {lines.map((line, i) => (
          <li key={i} className="fortune-summary-item">
            {line.label && (
              <span className="fortune-summary-label">{line.label}</span>
            )}
            <span className="fortune-summary-text">{line.text}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (section.id === 'chart') {
    return <pre className="result-block-text result-block-text--chart">{section.content}</pre>
  }

  return <p className="result-block-text">{section.content}</p>
}

export default function ResultPanel({
  loading,
  error,
  result,
  name,
  genderLabel,
  calendarLabel,
  birthDate,
  birthTime,
}) {
  const panelRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const sections = parseSajuResult(result)

  const summaryParts = [
    name || '이름 미입력',
    genderLabel,
    `${calendarLabel} ${birthDate || '날짜 미입력'}`,
    birthTime ? `${birthTime}` : '시간 미상',
  ]

  useEffect(() => {
    if (!loading && result && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, result])

  async function handleCopy() {
    if (!sections.length) return
    await navigator.clipboard.writeText(formatSajuResult(sections))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!loading && !error && !result) return null

  return (
    <section
      ref={panelRef}
      className="result-panel"
      aria-live="polite"
      aria-busy={loading}
    >
      <header className="result-header">
        <div>
          <p className="result-eyebrow">사주 해석</p>
          <h2 className="result-title">
            {name ? `${name}님의 사주` : '사주 해석 결과'}
          </h2>
          <p className="result-meta">{summaryParts.join(' · ')}</p>
        </div>

        {result && (
          <button type="button" className="copy-btn" onClick={handleCopy}>
            {copied ? '복사됨' : '복사하기'}
          </button>
        )}
      </header>

      {loading && (
        <div className="result-loading">
          <p className="result-loading-text">명식을 세우고 해석 중입니다…</p>
          <ResultSkeleton />
        </div>
      )}

      {error && <p className="error result-error">{error}</p>}

      {!loading && result && (
        <div className="result-body">
          {sections.map((section, index) => (
            <section
              key={section.id}
              className={`result-block ${index < sections.length - 1 ? 'result-block--divider' : ''} ${section.id === 'fortuneSummary' ? 'result-block--summary' : ''}`}
            >
              <h3 className="result-block-title">{section.title}</h3>
              <SectionBody section={section} />
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
