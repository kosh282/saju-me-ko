import { SAJU_SECTIONS } from './prompts'

const SECTION_BY_TITLE = Object.fromEntries(
  SAJU_SECTIONS.map((s) => [s.title, s]),
)

/** 제목 문자열을 표준 섹션 id로 매칭 */
function matchSectionTitle(rawTitle) {
  const title = rawTitle.trim().replace(/[:：]\s*$/, '')

  if (SECTION_BY_TITLE[title]) return SECTION_BY_TITLE[title]

  const aliases = [
    { id: 'chart', pattern: /명식|년주|사주\s*명식/ },
    { id: 'personality', pattern: /성격|기질|재능/ },
    { id: 'career', pattern: /재물|일운|커리어|직업|일\s*과/ },
    { id: 'relationship', pattern: /연애|관계|대인/ },
    { id: 'strength', pattern: /돋보|강점|장점|특징/ },
    { id: 'weakness', pattern: /약점|단점/ },
    { id: 'unique', pattern: /특이/ },
    { id: 'fortuneSummary', pattern: /운세|한줄\s*요약|요약/ },
  ]

  const found = aliases.find((a) => a.pattern.test(title))
  return found ? SAJU_SECTIONS.find((s) => s.id === found.id) : null
}

function cleanContent(text) {
  return text
    .replace(/^\[SECTION:[^\]]+\]\s*/i, '')
    .replace(/^[\d]+[\)\.]+\s*/, '')
    .replace(/^#{1,3}\s*/, '')
    .replace(/^\*\*(.+?)\*\*\s*/, '$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** [SECTION:제목] 형식 파싱 */
function parseBySectionMarkers(text) {
  const regex = /\[SECTION:([^\]]+)\]\s*\n?([\s\S]*?)(?=\[SECTION:|$)/gi
  const found = [...text.matchAll(regex)]

  if (found.length === 0) return null

  const map = new Map()

  for (const [, rawTitle, rawContent] of found) {
    const section = matchSectionTitle(rawTitle)
    if (!section) continue

    const content = cleanContent(rawContent)
    if (!content) continue

    map.set(section.id, { ...section, content })
  }

  return map.size > 0 ? map : null
}

/** ## 제목 형식 파싱 */
function parseByMarkdownHeaders(text) {
  if (!/^##\s+/m.test(text)) return null

  const parts = text.split(/^##\s+/m).filter(Boolean)
  const map = new Map()

  for (const part of parts) {
    const newline = part.indexOf('\n')
    const rawTitle = newline === -1 ? part : part.slice(0, newline)
    const rawContent = newline === -1 ? '' : part.slice(newline + 1)
    const section = matchSectionTitle(rawTitle)

    if (!section) continue

    const content = cleanContent(rawContent)
    if (!content) continue

    map.set(section.id, { ...section, content })
  }

  return map.size > 0 ? map : null
}

/** 키워드 기반 fallback 파싱 */
function parseByKeywords(text) {
  const blocks = text.split(/\n{2,}/).map(cleanContent).filter(Boolean)
  const map = new Map()

  const detectId = (block) => {
    const head = block.slice(0, 100)
    if (/명식|년주|월주|일주|시주|오행/.test(head)) return 'chart'
    if (/재물|일운|커리어|직업/.test(head)) return 'career'
    if (/연애|관계|대인/.test(head)) return 'relationship'
    if (/약점|단점/.test(head)) return 'weakness'
    if (/특이|독특/.test(head)) return 'unique'
    if (/돋보|강점|장점/.test(head)) return 'strength'
    if (/운세|한줄\s*요약|재물운|연애운|건강운|올해운/.test(head)) return 'fortuneSummary'
    if (/성격|기질|재능/.test(head)) return 'personality'
    return null
  }

  for (const block of blocks) {
    const id = detectId(block)
    if (!id) continue

    const section = SAJU_SECTIONS.find((s) => s.id === id)
    const prev = map.get(id)

    map.set(id, {
      ...section,
      content: prev ? `${prev.content}\n\n${block}` : block,
    })
  }

  return map.size > 0 ? map : null
}

/** 섹션 map을 고정 순서 배열로 정렬 */
function toOrderedSections(map) {
  return SAJU_SECTIONS.map((meta) => map.get(meta.id)).filter(Boolean)
}

export function parseSajuResult(text) {
  if (!text?.trim()) return []

  const map =
    parseBySectionMarkers(text) ??
    parseByMarkdownHeaders(text) ??
    parseByKeywords(text)

  if (map) {
    const ordered = toOrderedSections(map)
    if (ordered.length > 0) return ordered
  }

  return [
    {
      id: 'general',
      title: '사주 해석',
      content: text.trim(),
    },
  ]
}

/** 운세 한줄 요약 → 라벨/본문 분리 */
export function parseFortuneLines(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?[운]|.+?요약)\s*[:：]\s*(.+)$/)
      if (match) {
        return { label: match[1].trim(), text: match[2].trim() }
      }
      return { label: null, text: line }
    })
}

/** 복사용 — 섹션별로 깔끔한 텍스트 */
export function formatSajuResult(sections) {
  if (!sections.length) return ''

  return sections
    .map(({ title, content }) => `${title}\n${content}`)
    .join('\n\n')
}
