import AuthBar from './components/auth/AuthBar'
import AuthLoading from './components/auth/AuthLoading'
import LoginPage from './components/auth/LoginPage'
import ProfileModal from './components/auth/ProfileModal'
import HistorySidebar from './components/history/HistorySidebar'
import BusyOverlay from './components/layout/BusyOverlay'
import HeroHeader from './components/layout/HeroHeader'
import ReadingPanel from './components/saju/ReadingPanel'
import SajuProfileCard from './components/saju/SajuProfileCard'
import ResultPanel from './components/result/ResultPanel'
import ConfirmModal from './components/ui/ConfirmModal'
import { useSajuApp } from './hooks/useSajuApp'
import './App.css'

function App() {
  const app = useSajuApp()

  if (app.authLoading) {
    return <AuthLoading />
  }

  if (!app.user) {
    return <LoginPage />
  }

  return (
    <div className={`app-shell ${app.loading ? 'is-busy' : ''}`}>
      <HistorySidebar
        items={app.history}
        loading={app.historyLoading}
        selectedId={app.selectedId}
        onSelect={app.handleSelectHistory}
        onNewSaju={app.handleNewSaju}
        onDelete={app.requestDelete}
        deletingId={app.deletingId}
        error={app.historyError}
        open={app.sidebarVisible}
        onClose={() => app.setSidebarOpen(false)}
        disabled={app.uiLocked}
      />

      <div className="main-stage">
        <div className="page" ref={app.formTopRef}>
          <AuthBar
            displayName={app.displayName}
            accountLoaded={app.accountLoaded}
            uiLocked={app.uiLocked}
            signingOut={app.signingOut}
            onOpenSidebar={() => app.setSidebarOpen(true)}
            onOpenAccount={app.openAccountEditor}
            onSignOut={app.handleSignOut}
          />

          <HeroHeader isEditing={app.isEditing} />

          <SajuProfileCard
            sajuProfiles={app.sajuProfiles}
            activeProfileId={app.activeProfileId}
            activeProfileLabel={app.activeProfileLabel}
            name={app.name}
            birthDate={app.birthDate}
            birthTime={app.birthTime}
            gender={app.gender}
            calendarType={app.calendarType}
            genderLabel={app.genderLabel}
            calendarLabel={app.calendarLabel}
            hasCompleteSajuProfile={app.hasCompleteSajuProfile}
            profileFormError={app.profileFormError}
            savingSajuProfile={app.savingSajuProfile}
            uiLocked={app.uiLocked}
            onSelectProfile={app.selectSajuProfile}
            onSaveProfile={app.handleSaveSajuProfile}
            onNameChange={app.setName}
            onBirthDateChange={app.setBirthDate}
            onBirthTimeChange={app.setBirthTime}
            onGenderChange={app.setGender}
            onCalendarTypeChange={app.setCalendarType}
          />

          <ReadingPanel
            isEditing={app.isEditing}
            hasCompleteSajuProfile={app.hasCompleteSajuProfile}
            activeProfileLabel={app.activeProfileLabel}
            hasApiKey={app.hasApiKey}
            loading={app.loading}
            deletingId={app.deletingId}
            onSubmit={app.handleSubmit}
          />

          <ResultPanel
            loading={app.loading}
            error={app.error}
            result={app.result}
            name={app.name}
            genderLabel={app.genderLabel}
            calendarLabel={app.calendarLabel}
            birthDate={app.birthDate}
            birthTime={app.birthTime}
            fromHistory={app.isEditing}
            selectionKey={app.selectedId || 'live'}
            onDelete={
              app.isEditing ? () => app.requestDelete(app.selectedId) : null
            }
            deleting={app.deletingId === app.selectedId}
            disabled={app.uiLocked}
          />
        </div>
      </div>

      {app.loading && <BusyOverlay />}

      <ProfileModal
        open={app.accountModalOpen}
        initialValues={app.accountFormValues}
        saving={app.savingAccount}
        onSave={app.handleSaveAccount}
        onClose={() => app.setAccountModalOpen(false)}
      />

      <ConfirmModal
        open={Boolean(app.pendingDeleteId)}
        title="해석 기록을 삭제할까요?"
        description={
          app.pendingDeleteItem
            ? `"${app.pendingDeleteItem.name?.trim() || '이름 없음'}" 기록이 영구적으로 삭제됩니다.`
            : '선택한 기록이 영구적으로 삭제됩니다.'
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        danger
        busy={app.deletingId === app.pendingDeleteId}
        onConfirm={app.confirmDelete}
        onCancel={() => {
          if (!app.deletingId) app.setPendingDeleteId(null)
        }}
      />
    </div>
  )
}

export default App
