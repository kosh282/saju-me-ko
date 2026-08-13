export default function ChoiceButtons({
  label,
  options,
  value,
  onChange,
  name,
  disabled,
}) {
  return (
    <div className="field">
      <span className="field-label" id={`${name}-label`}>
        {label}
      </span>
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
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
