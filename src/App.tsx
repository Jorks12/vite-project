import './App.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { LearningMaterial, Position, ProgressEvent, Skill, SkillCategory, SkillEndorsement, SkillEvidence, UserMaterialStatus, UserProfile, UserSkillLevel, UserRole } from './domain/types'
import ContactPage from './pages/ContactPage'
import EndorsementsPage from './pages/EndorsementsPage'
import EvidencePage from './pages/EvidencePage'
import MaterialsPage from './pages/MaterialsPage'
import PositionsPage from './pages/PositionsPage'
import ProgressPage from './pages/ProgressPage'
import RecommendationsPage from './pages/RecommendationsPage'
import SearchPage from './pages/SearchPage'
import SkillsPage from './pages/SkillsPage'
import AuthPage from './pages/AuthPage'
import StatisticsPage from './pages/StatisticsPage'
import SuggestionsPage from './pages/SuggestionsPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import { useAuth } from './context/AuthContext'
import { logActivity } from './lib/activityLogger'
import {
  addEvidence,
  addMaterial,
  addPosition,
  addSkill,
  addUserProfile,
  calculatePositionMatch,
  deleteEvidence,
  deleteMaterial,
  deletePosition,
  deleteSkill,
  deleteUserProfile,
  ensureSeeded,
  getCategories,
  getEndorsements,
  getEvidences,
  getMaterials,
  getMaterialStatuses,
  getPositions,
  getProgressEvents,
  getSkills,
  getUserProfiles,
  getUserSkillLevels,
  requestEndorsement,
  resetAllData,
  setMaterialStatus,
  updateEndorsement,
  updateUserRole,
  upsertUserSkillLevel,
  validateEvidence,
} from './data/storage'

type TabId = 'skills' | 'materials' | 'recs' | 'suggestions' | 'search' | 'endorsements' | 'evidence' | 'positions' | 'progress' | 'stats' | 'contact' | 'about' | 'privacy' | 'terms'

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: 'skills', icon: '', label: 'Умения' },
  { id: 'materials', icon: '', label: 'Материали' },
  { id: 'recs', icon: '', label: 'Препоръчани' },
  { id: 'suggestions', icon: '', label: 'Предложения' },
  { id: 'search', icon: '', label: 'Търсене' },
  { id: 'endorsements', icon: '', label: 'Потвърждения' },
  { id: 'evidence', icon: '', label: 'Доказателства' },
  { id: 'positions', icon: '', label: 'Позиции' },
  { id: 'progress', icon: '', label: 'Прогрес' },
  { id: 'stats', icon: '', label: 'Статистика' },
  { id: 'contact', icon: '', label: 'Контакти' },
]

const ROLE_LABELS: Record<UserRole, { label: string; icon: string }> = {
  admin: { label: 'Администратор', icon: '' },
  mentor: { label: 'Ментор', icon: '' },
  student: { label: 'Ученик', icon: '' },
}

// Tabs visible per role
const TABS_BY_ROLE: Record<UserRole, Set<TabId>> = {
  student: new Set(['skills', 'materials', 'recs', 'suggestions', 'evidence', 'positions', 'progress', 'contact']),
  mentor: new Set(['skills', 'materials', 'recs', 'suggestions', 'search', 'endorsements', 'evidence', 'positions', 'progress', 'contact']),
  admin: new Set(['stats', 'skills', 'materials', 'recs', 'search', 'endorsements', 'evidence', 'positions', 'progress', 'contact']),
}

function App() {
  const { user, role, loading: authLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('skills')
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const tabsTrackRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ opacity: 0 })

  // Measure active tab and move the sliding indicator (bottom bar, LinkedIn style)
  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (!el) return
    setIndicatorStyle({
      width: el.offsetWidth,
      transform: `translateX(${el.offsetLeft}px)`,
      opacity: 1,
    })
  }, [activeTab])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [materials, setMaterials] = useState<LearningMaterial[]>([])
  const [userLevels, setUserLevels] = useState<UserSkillLevel[]>([])
  const [materialStatuses, setMaterialStatuses] = useState<UserMaterialStatus[]>([])
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [evidences, setEvidences] = useState<SkillEvidence[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([])
  const [loading, setLoading] = useState(true)

  const reloadAll = useCallback(async () => {
    const [cat, sk, mat, ul, ms, end, up, ev, pos, pe] = await Promise.all([
      getCategories(),
      getSkills(),
      getMaterials(),
      getUserSkillLevels(),
      getMaterialStatuses(),
      getEndorsements(),
      getUserProfiles(),
      getEvidences(),
      getPositions(),
      getProgressEvents(),
    ])
    setCategories(cat)
    setSkills(sk)
    setMaterials(mat)
    setUserLevels(ul)
    setMaterialStatuses(ms)
    setEndorsements(end)
    setUserProfiles(up)
    setEvidences(ev)
    setPositions(pos)
    setProgressEvents(pe)
  }, [])

  useEffect(() => {
    async function init() {
      await ensureSeeded()
      await reloadAll()
      setLoading(false)
      // Log page load if user is authenticated
      if (user) {
        logActivity('page_load', { tab: 'skills' })
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadAll])

  const stats = useMemo(() => {
    const set = new Set(userLevels.filter((x) => x.level > 0).map((x) => x.skillId))
    const pendingCount = endorsements.filter((e) => e.status === 'pending').length
    return {
      skillsSet: set.size,
      materials: materials.length,
      pending: pendingCount,
    }
  }, [materials.length, userLevels, endorsements])

  const visibleTabs = useMemo(() =>
    tabs.filter((t) => TABS_BY_ROLE[role].has(t.id)),
    [role],
  )

  const calculatePositionMatchCb = useCallback(
    (positionId: string) => calculatePositionMatch(positionId, userLevels),
    [userLevels],
  )

  // Show auth page if not logged in
  if (authLoading) {
    return (
      <div className="loadingScreen">
        <div className="loadingSpinner" />
        <p>Проверка на сесията...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (loading) {
    return (
      <div className="loadingScreen">
        <div className="loadingSpinner" />
        <p>Зареждане на базата данни...</p>
      </div>
    )
  }

  return (
    <div className="appShell">
      <header className="header">
        <div className="headerContainer">
          <div className="brand">
            <div className="brandTitle">SkillMatrix</div>
          </div>

          <nav className="tabs">
            <div className="tabsTrack" ref={tabsTrackRef}>
              <div
                className="tabIndicator"
                style={indicatorStyle}
              />
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el }}
                  className={activeTab === t.id ? 'tab tabActive' : 'tab'}
                  onClick={() => {
                    setActiveTab(t.id)
                    logActivity('tab_switch', { tab: t.id })
                  }}
                >
                  <span className="tabIcon">{t.icon}</span>
                  <span className="tabLabel">{t.id === 'contact' && role === 'admin' ? 'Обратна връзка' : t.label}</span>
                  {t.id === 'endorsements' && stats.pending > 0 && (
                    <span className="tabBadge">{stats.pending}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="headerRight">
            <span className="userWelcome" title={user.email ?? ''}>
              {user.email?.split('@')[0]}
            </span>
            <span className={`roleBadge roleBadge--${role}`}>
              {ROLE_LABELS[role].icon} {ROLE_LABELS[role].label}
            </span>
            {role === 'admin' && (
              <button
                className="button"
                onClick={async () => {
                  await resetAllData()
                  await reloadAll()
                }}
              >
                Reset
              </button>
            )}
            <button
              className="logoutBtn"
              onClick={signOut}
            >
              Изход
            </button>
          </div>
        </div>
      </header>

      <div className="mainLayout">
        <aside className="leftSidebar">
          <div className="profileCard">
            <div className="profileBanner">
              <div className="profileAvatar">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="profileInfo">
              <h3 className="profileName">{user.email?.split('@')[0]}</h3>
              <p className="profileRole">{ROLE_LABELS[role].label}</p>
            </div>
            <div className="profileStats">
              <div className="profileStatRow">
                <span className="statLabel">Умения</span>
                <span className="statValue">{stats.skillsSet}</span>
              </div>
              <div className="profileStatRow">
                <span className="statLabel">Материали</span>
                <span className="statValue">{stats.materials}</span>
              </div>
              {stats.pending > 0 && (
                <div className="profileStatRow">
                  <span className="statLabel">Чакащи</span>
                  <span className="statValue statAlert">{stats.pending}</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="content" key={activeTab}>
        {activeTab === 'skills' ? (
          <SkillsPage
            categories={categories}
            skills={skills}
            userLevels={userLevels}
            endorsements={endorsements}
            role={role}
            onSetLevel={async (skillId, level) => {
              await upsertUserSkillLevel(skillId, level)
              setUserLevels(await getUserSkillLevels())
              setProgressEvents(await getProgressEvents())
            }}
            onRequestEndorsement={async (skillId) => {
              await requestEndorsement(skillId)
              setEndorsements(await getEndorsements())
            }}
            onAddSkill={async (draft) => {
              await addSkill(draft)
              setSkills(await getSkills())
            }}
            onDeleteSkill={async (id) => {
              await deleteSkill(id)
              setSkills(await getSkills())
            }}
          />
        ) : null}

        {activeTab === 'materials' ? (
          <MaterialsPage
            skills={skills}
            materials={materials}
            role={role}
            onAdd={async (draft) => {
              await addMaterial(draft)
              setMaterials(await getMaterials())
            }}
            onDelete={async (id) => {
              await deleteMaterial(id)
              setMaterials(await getMaterials())
            }}
          />
        ) : null}

        {activeTab === 'recs' ? (
          <RecommendationsPage
            skills={skills}
            materials={materials}
            userLevels={userLevels}
            materialStatuses={materialStatuses}
            onSetStatus={async (materialId, status) => {
              await setMaterialStatus(materialId, status)
              setMaterialStatuses(await getMaterialStatuses())
            }}
          />
        ) : null}

        {activeTab === 'search' ? (
          <SearchPage
            categories={categories}
            skills={skills}
            userProfiles={userProfiles}
            role={role}
            onUpdateUserRole={async (userId, newRole) => {
              await updateUserRole(userId, newRole)
              setUserProfiles(await getUserProfiles())
            }}
            onAddUser={async (draft) => {
              await addUserProfile(draft)
              setUserProfiles(await getUserProfiles())
            }}
            onDeleteUser={async (id) => {
              await deleteUserProfile(id)
              setUserProfiles(await getUserProfiles())
            }}
          />
        ) : null}

        {activeTab === 'endorsements' ? (
          <EndorsementsPage
            skills={skills}
            endorsements={endorsements}
            onUpdate={async (id, status, comment, whatChecked, improvements, nextSteps) => {
              await updateEndorsement(id, {
                status,
                comment,
                whatChecked,
                improvements,
                nextSteps,
                mentorName: 'Ментор'
              })
              setEndorsements(await getEndorsements())
              setProgressEvents(await getProgressEvents())
            }}
          />
        ) : null}

        {activeTab === 'evidence' ? (
          <EvidencePage
            skills={skills}
            evidences={evidences}
            userLevels={userLevels}
            role={role}
            onAdd={async (draft) => {
              await addEvidence(draft)
              setEvidences(await getEvidences())
              setProgressEvents(await getProgressEvents())
            }}
            onDelete={async (id) => {
              await deleteEvidence(id)
              setEvidences(await getEvidences())
            }}
            onValidate={async (id, mentorName, isValid) => {
              await validateEvidence(id, mentorName, isValid)
              setEvidences(await getEvidences())
            }}
          />
        ) : null}

        {activeTab === 'positions' ? (
          <PositionsPage
            skills={skills}
            positions={positions}
            materials={materials}
            role={role}
            onCalculateMatch={calculatePositionMatchCb}
            onAddPosition={async (draft) => {
              await addPosition(draft)
              setPositions(await getPositions())
            }}
            onDeletePosition={async (id) => {
              await deletePosition(id)
              setPositions(await getPositions())
            }}
          />
        ) : null}

        {activeTab === 'progress' ? (
          <ProgressPage
            skills={skills}
            categories={categories}
            userLevels={userLevels}
            progressEvents={progressEvents}
          />
        ) : null}

        {activeTab === 'stats' ? (
          <StatisticsPage
            users={userProfiles}
            skills={skills}
            materials={materials}
            endorsements={endorsements}
            positions={positions}
          />
        ) : null}

        {activeTab === 'suggestions' ? (
          <SuggestionsPage
            skills={skills}
            userLevels={userLevels}
            materials={materials}
            positions={positions}
          />
        ) : null}

        {activeTab === 'contact' ? <ContactPage /> : null}
        {activeTab === 'about' ? <AboutPage /> : null}
        {activeTab === 'privacy' ? <PrivacyPage /> : null}
        {activeTab === 'terms' ? <TermsPage /> : null}
        </main>

        <aside className="rightSidebar">
          <div className="widgetCard">
            <h3 className="widgetTitle">SkillMatrix News</h3>
            <ul className="widgetNewsList">
              <li>
                <div className="newsTitle">New skills added to Matrix</div>
                <div className="newsTime">Преди 2 ч.</div>
              </li>
              <li>
                <div className="newsTitle">Level up your frontend</div>
                <div className="newsTime">Преди 5 ч.</div>
              </li>
              <li>
                <div className="newsTitle">Mentor tips available</div>
                <div className="newsTime">1 дн. назад</div>
              </li>
            </ul>
          </div>

          <div className="widgetPromo">
            <p className="promoDesc">Get the most out of your skills with <strong>SkillMatrix Premium</strong></p>
            <div className="promoAvatars">
              <div className="promoAvatar promoAvatarMe">{user.email?.charAt(0).toUpperCase()}</div>
              <div className="promoAvatar promoAvatarLogo">in</div>
            </div>
            <p className="promoText">See who's viewing your profile</p>
            <button 
              className="promoBtn"
              onClick={() => alert('Очаквайте скоро: SkillMatrix Premium с допълнителни статистики!')}
            >
              Опитай безплатно
            </button>
          </div>

          <div className="widgetLinks">
            <button onClick={() => setActiveTab('about')}>Относно</button>
            <button onClick={() => setActiveTab('contact')}>{role === 'admin' ? 'Обратна връзка' : 'Помощ'}</button>
            <button onClick={() => setActiveTab('privacy')}>Поверителност</button>
            <button onClick={() => setActiveTab('terms')}>Условия</button>
            <div className="widgetFooter">
              <span className="footerLogo">SkillMatrix</span> © 2026
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
