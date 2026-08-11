import { useState } from 'react'
import { buildBasicChartPrompt } from './prompts'
import ResultPanel from './ResultPanel'
import './App.css'

const hasApiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY)

function ChoiceButtons({ label, hint, options, value, onChange, name }) {
  return (
    <div className="field">
      <span className="field-label" id={`${name}-label`}>
        {label}
      </span>
      <p className="hint">{hint}</p>
      <div
        className="choice-buttons"
        role="group"
        aria-labelledby={`${name}-label`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-btn ${value === option.value ? 'active' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const genderLabel =
    gender === 'male' ? '남자' : gender === 'female' ? '여자' : '미선택'
  const calendarLabel = calendarType === 'lunar' ? '음력' : '양력'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult('')
    setLoading(true)

    try {
      if (!hasApiKey) {
        throw new Error(
          'API 키가 설정되지 않았습니다. Netlify 환경변수 VITE_GEMINI_API_KEY를 등록한 뒤 다시 배포하세요.',
        )
      }

      const { askGemini } = await import('./gemini')
      const prompt = buildBasicChartPrompt({
        name: name || '미입력',
        gender: gender || '미입력',
        calendar: calendarLabel,
        birth: birthDate || '미입력',
        time: birthTime || '시간미상',
      })

      const text = await askGemini(prompt)
      setResult(text)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Gemini API 호출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="brand">saju-me-ko</p>
        <h1>사주 입력</h1>
        <p className="hero-desc">출생 정보를 입력해 주세요.</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">이름</label>
          <p className="hint">본명을 한글로 입력합니다.</p>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="birthDate">생년월일</label>
          <p className="hint">태어난 날짜를 선택합니다.</p>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="birthTime">태어난 시간</label>
          <p className="hint">모를 경우 비워 두어도 됩니다.</p>
          <input
            id="birthTime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
          />
        </div>

        <div className="field-row">
          <ChoiceButtons
            name="gender"
            label="성별"
            hint="사주 해석에 사용됩니다."
            value={gender}
            onChange={setGender}
            options={[
              { value: 'male', label: '남자' },
              { value: 'female', label: '여자' },
            ]}
          />

          <ChoiceButtons
            name="calendar"
            label="양력 / 음력"
            hint="달력 기준을 고릅니다."
            value={calendarType}
            onChange={setCalendarType}
            options={[
              { value: 'solar', label: '양력' },
              { value: 'lunar', label: '음력' },
            ]}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '해석 중...' : '사주 보기'}
        </button>

        {!hasApiKey && (
          <p className="env-warning">
            API 키가 빌드에 포함되지 않았습니다. Netlify 환경변수에{' '}
            <code>VITE_GEMINI_API_KEY</code>를 등록한 뒤 재배포하세요.
          </p>
        )}
      </form>

      <ResultPanel
        loading={loading}
        error={error}
        result={result}
        name={name}
        genderLabel={genderLabel}
        calendarLabel={calendarLabel}
        birthDate={birthDate}
        birthTime={birthTime}
      />
    </div>
  )
}

export default App
