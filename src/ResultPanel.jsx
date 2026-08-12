import { useEffect, useRef, useState } from 'react'
import {
  formatSajuResult,
  parseFortuneLines,
  parseSajuResult,
} from './parseResult'

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
    return (
      <pre className="result-block-text result-block-text--chart">
        {section.content}
      </pre>
    )
  }

  const paragraphs = section.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length > 1) {
    return (
      <div className="result-block-paragraphs">
        {paragraphs.map((p, i) => (
          <p key={i} className="result-block-text">
            {p}
          </p>
        ))}
      </div>
    )
  }

  return <p className="result-block-text">{section.content}</p>
}

const SECTION_TONE = {
  chart: 'chart',
  personality: 'soft',
  career: 'soft',
  relationship: 'soft',
  strength: 'positive',
  weakness: 'caution',
  unique: 'accent',
  fortuneSummary: 'summary',
  general: 'soft',
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
  fromHistory = false,
  selectionKey,
  onNewSaju,
  onDelete,
  deleting = false,
}) {
  const panelRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const sections = parseSajuResult(result)

  const chips = [
    genderLabel !== '미선택' ? genderLabel : null,
    birthDate ? `${calendarLabel} ${birthDate}` : null,
    birthTime || null,
  ].filter(Boolean)

  useEffect(() => {
    if (!loading && result && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, result, selectionKey])

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
      key={selectionKey || 'live'}
      className={`result-panel ${fromHistory ? 'result-panel--history' : ''}`}
      aria-live="polite"
      aria-busy={loading}
    >
      <header className="result-header">
        <div className="result-header-main">
          {fromHistory && <p className="result-badge">저장된 해석</p>}
          <p className="result-eyebrow">사주 해석</p>
          <h2 className="result-title">
            {name ? `${name}님의 사주` : '사주 해석 결과'}
          </h2>

          {chips.length > 0 && (
            <ul className="result-chips">
              {chips.map((chip) => (
                <li key={chip} className="result-chip">
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="result-actions">
          {onNewSaju && (
            <button
              type="button"
              className="new-saju-btn new-saju-btn--panel"
              onClick={onNewSaju}
            >
              새 사주 만들기
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="delete-btn"
              disabled={deleting}
              onClick={onDelete}
            >
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          )}
          {result && (
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? '복사됨' : '복사하기'}
            </button>
          )}
        </div>
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
          {sections.map((section, index) => {
            const tone = SECTION_TONE[section.id] || 'soft'
            return (
              <article
                key={`${section.id}-${index}`}
                className={`result-card result-card--${tone}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="result-card-head">
                  <span className="result-card-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="result-card-title">{section.title}</h3>
                </div>
                <SectionBody section={section} />
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
