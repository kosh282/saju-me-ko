import { NEW_PROFILE_ID } from '../../constants'
import { formatBirthTime, formatKoreanDate } from '../../format'
import { IconSeal } from '../ui/icons'
import ChoiceButtons from './ChoiceButtons'

export default function SajuProfileCard({
  sajuProfiles,
  activeProfileId,
  activeProfileLabel,
  name,
  birthDate,
  birthTime,
  gender,
  calendarType,
  genderLabel,
  calendarLabel,
  hasCompleteSajuProfile,
  profileFormError,
  savingSajuProfile,
  uiLocked,
  onSelectProfile,
  onSaveProfile,
  onNameChange,
  onBirthDateChange,
  onBirthTimeChange,
  onGenderChange,
  onCalendarTypeChange,
}) {
  const isNewSajuProfile = activeProfileId === NEW_PROFILE_ID

  return (
    <section className="profile-card scroll-panel" aria-label="사주 프로필">
      <div className="profile-card-top">
        <div className="profile-card-heading">
          <span className="section-icon section-icon--seal" aria-hidden="true">
            <IconSeal />
          </span>
          <div>
            <p className="profile-card-label">사주 해석 프로필</p>
            <h2 className="profile-card-name">{activeProfileLabel}</h2>
          </div>
        </div>
        <button
          type="button"
          className="profile-edit-btn"
          disabled={uiLocked}
          onClick={onSaveProfile}
        >
          {savingSajuProfile ? '저장 중…' : '프로필 저장'}
        </button>
      </div>

      <div
        className="saju-profile-tabs"
        role="tablist"
        aria-label="사주 프로필 목록"
      >
        {sajuProfiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            role="tab"
            aria-selected={activeProfileId === profile.id}
            className={`saju-profile-tab ${activeProfileId === profile.id ? 'active' : ''}`}
            disabled={uiLocked}
            onClick={() => onSelectProfile(profile.id)}
          >
            {profile.name?.trim() || '이름 없음'}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={isNewSajuProfile}
          className={`saju-profile-tab saju-profile-tab--new ${isNewSajuProfile ? 'active' : ''}`}
          disabled={uiLocked}
          onClick={() => onSelectProfile(NEW_PROFILE_ID)}
        >
          + 새 프로필
        </button>
      </div>

      <div className="saju-profile-form">
        <div className="field">
          <label htmlFor="saju-name">
            이름 <span className="required-mark">필수</span>
          </label>
          <input
            id="saju-name"
            type="text"
            value={name}
            disabled={uiLocked}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="예: 홍길동"
            autoComplete="name"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="saju-birthDate">
              생년월일 <span className="required-mark">필수</span>
            </label>
            <input
              id="saju-birthDate"
              type="date"
              value={birthDate}
              disabled={uiLocked}
              onChange={(e) => onBirthDateChange(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="saju-birthTime">
              태어난 시간
              <span className="optional-mark">선택</span>
            </label>
            <div className="field-with-action">
              <input
                id="saju-birthTime"
                type="time"
                value={birthTime}
                disabled={uiLocked}
                onChange={(e) => onBirthTimeChange(e.target.value)}
              />
              {birthTime && (
                <button
                  type="button"
                  className="field-clear-btn"
                  disabled={uiLocked}
                  onClick={() => onBirthTimeChange('')}
                >
                  지우기
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="field-row">
          <ChoiceButtons
            name="saju-gender"
            label="성별"
            value={gender}
            disabled={uiLocked}
            onChange={onGenderChange}
            options={[
              { value: 'male', label: '남자' },
              { value: 'female', label: '여자' },
            ]}
          />

          <ChoiceButtons
            name="saju-calendar"
            label="양력 / 음력"
            value={calendarType}
            disabled={uiLocked}
            onChange={onCalendarTypeChange}
            options={[
              { value: 'solar', label: '양력' },
              { value: 'lunar', label: '음력' },
            ]}
          />
        </div>

        {hasCompleteSajuProfile && (
          <p className="saju-profile-preview">
            {formatKoreanDate(birthDate)}
            {birthTime ? ` · ${formatBirthTime(birthTime)}` : ''} · {genderLabel}{' '}
            · {calendarLabel}
          </p>
        )}

        {profileFormError && (
          <p className="modal-error">{profileFormError}</p>
        )}
      </div>
    </section>
  )
}
