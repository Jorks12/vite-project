import type {
  LearningMaterial,
  MaterialStatus,
  Position,
  PositionMatch,
  ProgressEvent,
  ProgressEventType,
  Skill,
  SkillCategory,
  SkillEndorsement,
  SkillEvidence,
  UserMaterialStatus,
  UserProfile,
  UserSkillLevel,
} from '../domain/types'
import { getDB } from './db'
import { seedCategories, seedMaterials, seedSkills } from './seed'

type StoreNames = 'categories' | 'skills' | 'materials' | 'userSkillLevels' | 'materialStatuses' | 'endorsements' | 'userProfiles' | 'evidences' | 'positions' | 'progressEvents' | 'feedback'

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`
}

// Seed data for positions
const seedPositions: Position[] = [
  {
    id: 'pos_junior_fe',
    name: 'Junior Frontend Developer',
    description: 'Начална позиция за frontend разработка',
    requirements: [
      { skillId: 'skill_html_css', minLevel: 3, priority: 'required' },
      { skillId: 'skill_js', minLevel: 3, priority: 'required' },
      { skillId: 'skill_react', minLevel: 2, priority: 'required' },
      { skillId: 'skill_ts', minLevel: 2, priority: 'optional' },
      { skillId: 'skill_git', minLevel: 2, priority: 'required' },
    ],
  },
  {
    id: 'pos_qa_intern',
    name: 'QA Intern',
    description: 'Позиция за тестване на софтуер',
    requirements: [
      { skillId: 'skill_html_css', minLevel: 1, priority: 'optional' },
      { skillId: 'skill_js', minLevel: 1, priority: 'optional' },
      { skillId: 'skill_sql', minLevel: 2, priority: 'required' },
      { skillId: 'skill_git', minLevel: 2, priority: 'required' },
      { skillId: 'skill_communication', minLevel: 3, priority: 'required' },
    ],
  },
  {
    id: 'pos_backend_trainee',
    name: 'Backend Trainee',
    description: 'Стажант backend разработчик',
    requirements: [
      { skillId: 'skill_node', minLevel: 2, priority: 'required' },
      { skillId: 'skill_rest', minLevel: 2, priority: 'required' },
      { skillId: 'skill_sql', minLevel: 2, priority: 'required' },
      { skillId: 'skill_http', minLevel: 2, priority: 'required' },
      { skillId: 'skill_git', minLevel: 2, priority: 'required' },
    ],
  },
  {
    id: 'pos_devops_eng',
    name: 'DevOps Engineer',
    description: 'Инженер по автоматизация и инфраструктура',
    requirements: [
      { skillId: 'skill_docker', minLevel: 3, priority: 'required' },
      { skillId: 'skill_kubernetes', minLevel: 2, priority: 'optional' },
      { skillId: 'skill_aws', minLevel: 2, priority: 'required' },
      { skillId: 'skill_cicd', minLevel: 3, priority: 'required' },
      { skillId: 'skill_git', minLevel: 3, priority: 'required' },
    ],
  },
  {
    id: 'pos_fullstack',
    name: 'Full-Stack Developer',
    description: 'Разработчик на цялостни уеб приложения (Frontend + Backend)',
    requirements: [
      { skillId: 'skill_html_css', minLevel: 3, priority: 'required' },
      { skillId: 'skill_react', minLevel: 3, priority: 'required' },
      { skillId: 'skill_node', minLevel: 3, priority: 'required' },
      { skillId: 'skill_sql', minLevel: 2, priority: 'required' },
      { skillId: 'skill_git', minLevel: 3, priority: 'required' },
    ],
  },
  {
    id: 'pos_mobile_dev',
    name: 'Mobile App Developer',
    description: 'Разработчик на мобилни приложения с React Native',
    requirements: [
      { skillId: 'skill_react_native', minLevel: 3, priority: 'required' },
      { skillId: 'skill_js', minLevel: 3, priority: 'required' },
      { skillId: 'skill_ts', minLevel: 2, priority: 'optional' },
      { skillId: 'skill_git', minLevel: 2, priority: 'required' },
    ],
  },
  {
    id: 'pos_python_backend',
    name: 'Python Backend Developer',
    description: 'Backend разработчик с основен фокус върху Python и бази данни',
    requirements: [
      { skillId: 'skill_python', minLevel: 3, priority: 'required' },
      { skillId: 'skill_sql', minLevel: 3, priority: 'required' },
      { skillId: 'skill_postgresql', minLevel: 2, priority: 'optional' },
      { skillId: 'skill_rest', minLevel: 3, priority: 'required' },
      { skillId: 'skill_git', minLevel: 2, priority: 'required' },
    ],
  },
  {
    id: 'pos_frontend_specialist',
    name: 'Frontend Specialist',
    description: 'Експерт по уеб интерфейси и напреднали CSS техники',
    requirements: [
      { skillId: 'skill_html_css', minLevel: 4, priority: 'required' },
      { skillId: 'skill_css_advanced', minLevel: 3, priority: 'required' },
      { skillId: 'skill_js', minLevel: 4, priority: 'required' },
      { skillId: 'skill_react', minLevel: 3, priority: 'optional' },
      { skillId: 'skill_vue', minLevel: 2, priority: 'optional' },
    ],
  },
]

const seedUserProfiles: UserProfile[] = [
  {
    id: 'user_1',
    name: 'Иван Петров',
    role: 'student',
    bio: 'Frontend разработчик, уча React и TypeScript',
    skills: [
      { skillId: 'skill_react', level: 3, endorsementCount: 2 },
      { skillId: 'skill_js', level: 4, endorsementCount: 1 },
      { skillId: 'skill_ts', level: 2, endorsementCount: 0 },
    ],
    isActive: true,
  },
  {
    id: 'user_2',
    name: 'Мария Георгиева',
    role: 'student',
    bio: 'Backend специалист, Node.js и SQL',
    skills: [
      { skillId: 'skill_node', level: 4, endorsementCount: 3 },
      { skillId: 'skill_sql', level: 3, endorsementCount: 2 },
      { skillId: 'skill_rest', level: 3, endorsementCount: 1 },
    ],
    isActive: true,
  },
  {
    id: 'user_3',
    name: 'Георги Димитров',
    role: 'mentor',
    bio: 'Senior Developer с 10+ години опит',
    skills: [
      { skillId: 'skill_react', level: 5, endorsementCount: 10 },
      { skillId: 'skill_node', level: 5, endorsementCount: 8 },
      { skillId: 'skill_ts', level: 5, endorsementCount: 7 },
    ],
    isActive: true,
  },
  {
    id: 'user_4',
    name: 'Елена Стоянова',
    role: 'student',
    bio: 'Начинаещ в програмирането, уча HTML/CSS',
    skills: [
      { skillId: 'skill_html_css', level: 2, endorsementCount: 0 },
      { skillId: 'skill_git', level: 1, endorsementCount: 0 },
    ],
    isActive: false,
  },
  {
    id: 'user_5',
    name: 'Александър Николов',
    role: 'mentor',
    bio: 'DevOps инженер, AWS и Kubernetes специалист с 8 години опит',
    skills: [
      { skillId: 'skill_docker', level: 5, endorsementCount: 12 },
      { skillId: 'skill_kubernetes', level: 5, endorsementCount: 9 },
      { skillId: 'skill_aws', level: 5, endorsementCount: 11 },
      { skillId: 'skill_cicd', level: 4, endorsementCount: 6 },
      { skillId: 'skill_git', level: 5, endorsementCount: 5 },
    ],
    isActive: true,
  },
  {
    id: 'user_6',
    name: 'Десислава Тодорова',
    role: 'mentor',
    bio: 'QA Lead, автоматизирано тестване и TDD',
    skills: [
      { skillId: 'skill_unit_testing', level: 5, endorsementCount: 8 },
      { skillId: 'skill_e2e_testing', level: 5, endorsementCount: 7 },
      { skillId: 'skill_tdd', level: 4, endorsementCount: 5 },
      { skillId: 'skill_js', level: 4, endorsementCount: 3 },
      { skillId: 'skill_python', level: 3, endorsementCount: 2 },
    ],
    isActive: true,
  },
  {
    id: 'user_7',
    name: 'Николай Василев',
    role: 'mentor',
    bio: 'Full-stack архитект, React & Node.js, GraphQL експерт',
    skills: [
      { skillId: 'skill_react', level: 5, endorsementCount: 14 },
      { skillId: 'skill_node', level: 5, endorsementCount: 12 },
      { skillId: 'skill_graphql', level: 5, endorsementCount: 9 },
      { skillId: 'skill_ts', level: 5, endorsementCount: 8 },
      { skillId: 'skill_postgresql', level: 4, endorsementCount: 6 },
      { skillId: 'skill_docker', level: 4, endorsementCount: 4 },
    ],
    isActive: true,
  },
  {
    id: 'user_8',
    name: 'Калина Маринова',
    role: 'student',
    bio: 'Frontend ентусиаст, уча Vue.js и CSS анимации',
    skills: [
      { skillId: 'skill_vue', level: 3, endorsementCount: 1 },
      { skillId: 'skill_html_css', level: 4, endorsementCount: 2 },
      { skillId: 'skill_css_advanced', level: 3, endorsementCount: 1 },
      { skillId: 'skill_js', level: 3, endorsementCount: 0 },
    ],
    isActive: true,
  },
  {
    id: 'user_9',
    name: 'Стефан Колев',
    role: 'student',
    bio: 'Java разработчик, учя Spring Boot и microservices',
    skills: [
      { skillId: 'skill_java', level: 4, endorsementCount: 2 },
      { skillId: 'skill_sql', level: 3, endorsementCount: 1 },
      { skillId: 'skill_rest', level: 3, endorsementCount: 1 },
      { skillId: 'skill_git', level: 3, endorsementCount: 0 },
      { skillId: 'skill_docker', level: 2, endorsementCount: 0 },
    ],
    isActive: true,
  },
  {
    id: 'user_10',
    name: 'Виктория Атанасова',
    role: 'student',
    bio: 'Data Science начинаещ, Python и SQL',
    skills: [
      { skillId: 'skill_python', level: 3, endorsementCount: 1 },
      { skillId: 'skill_sql', level: 2, endorsementCount: 0 },
      { skillId: 'skill_mongodb', level: 2, endorsementCount: 0 },
    ],
    isActive: true,
  },
  {
    id: 'user_11',
    name: 'Димитър Христов',
    role: 'student',
    bio: 'Mobile developer, React Native и Flutter',
    skills: [
      { skillId: 'skill_react_native', level: 3, endorsementCount: 2 },
      { skillId: 'skill_flutter', level: 2, endorsementCount: 1 },
      { skillId: 'skill_ts', level: 3, endorsementCount: 1 },
      { skillId: 'skill_react', level: 3, endorsementCount: 0 },
    ],
    isActive: true,
  },
  {
    id: 'user_12',
    name: 'Анна Бонева',
    role: 'student',
    bio: 'C# разработчик, .NET и Angular',
    skills: [
      { skillId: 'skill_csharp', level: 3, endorsementCount: 1 },
      { skillId: 'skill_angular', level: 2, endorsementCount: 0 },
      { skillId: 'skill_sql', level: 3, endorsementCount: 1 },
      { skillId: 'skill_unit_testing', level: 2, endorsementCount: 0 },
      { skillId: 'skill_git', level: 3, endorsementCount: 0 },
    ],
    isActive: true,
  },
]

// Helper: put many items into a store
async function putMany(
  storeName: StoreNames,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[],
) {
  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  for (const item of items) {
    tx.store.put(item)
  }
  await tx.done
}

export async function ensureSeeded() {
  const db = await getDB()

  const catCount = await db.count('categories')
  if (catCount === 0) await putMany('categories', seedCategories)

  const skillCount = await db.count('skills')
  if (skillCount === 0) await putMany('skills', seedSkills)

  const matCount = await db.count('materials')
  if (matCount === 0) await putMany('materials', seedMaterials)

  const posCount = await db.count('positions')
  if (posCount === 0) await putMany('positions', seedPositions)

  const profileCount = await db.count('userProfiles')
  if (profileCount === 0) await putMany('userProfiles', seedUserProfiles)
}

// ── Getters ──────────────────────────────────────────────────

export async function getCategories(): Promise<SkillCategory[]> {
  const db = await getDB()
  return db.getAll('categories')
}

export async function getSkills(): Promise<Skill[]> {
  const db = await getDB()
  return db.getAll('skills')
}

export type SkillDraft = Omit<Skill, 'id'>

export async function addSkill(draft: SkillDraft): Promise<Skill> {
  const db = await getDB()
  const skill: Skill = {
    ...draft,
    id: makeId('skill'),
  }
  await db.put('skills', skill)
  return skill
}

export async function deleteSkill(id: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('skills', id)
  if (!existing) return false
  await db.delete('skills', id)
  return true
}

export async function getMaterials(): Promise<LearningMaterial[]> {
  const db = await getDB()
  return db.getAll('materials')
}

export async function getUserSkillLevels(): Promise<UserSkillLevel[]> {
  const db = await getDB()
  return db.getAll('userSkillLevels')
}

export async function getUserSkillLevel(skillId: string): Promise<UserSkillLevel | undefined> {
  const db = await getDB()
  return db.get('userSkillLevels', skillId)
}

export async function getEndorsements(): Promise<SkillEndorsement[]> {
  const db = await getDB()
  return db.getAll('endorsements')
}

export async function getUserProfiles(): Promise<UserProfile[]> {
  const db = await getDB()
  return db.getAll('userProfiles')
}

export async function updateUserRole(userId: string, role: string): Promise<UserProfile | null> {
  const db = await getDB()
  const existing = await db.get('userProfiles', userId)
  if (!existing) return null
  const updated = { ...existing, role: role as UserProfile['role'] }
  await db.put('userProfiles', updated)
  return updated
}

export type UserProfileDraft = Omit<UserProfile, 'id'>

export async function addUserProfile(draft: UserProfileDraft): Promise<UserProfile> {
  const db = await getDB()
  const profile: UserProfile = {
    ...draft,
    id: makeId('user'),
  }
  await db.put('userProfiles', profile)
  return profile
}

export async function deleteUserProfile(id: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('userProfiles', id)
  if (!existing) return false
  await db.delete('userProfiles', id)
  return true
}

export async function getEvidences(): Promise<SkillEvidence[]> {
  const db = await getDB()
  return db.getAll('evidences')
}

export async function getPositions(): Promise<Position[]> {
  const db = await getDB()
  return db.getAll('positions')
}

export type PositionDraft = Omit<Position, 'id'>

export async function addPosition(draft: PositionDraft): Promise<Position> {
  const db = await getDB()
  const position: Position = {
    ...draft,
    id: makeId('pos'),
  }
  await db.put('positions', position)
  return position
}

export async function deletePosition(id: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('positions', id)
  if (!existing) return false
  await db.delete('positions', id)
  return true
}

export async function getProgressEvents(): Promise<ProgressEvent[]> {
  const db = await getDB()
  return db.getAll('progressEvents')
}

export async function getMaterialStatuses(): Promise<UserMaterialStatus[]> {
  const db = await getDB()
  return db.getAll('materialStatuses')
}

// ── Progress event recording ─────────────────────────────────

async function recordProgressEvent(
  type: ProgressEventType,
  description: string,
  skillId?: string,
  oldValue?: number,
  newValue?: number,
) {
  const db = await getDB()
  const event: ProgressEvent = {
    id: makeId('prog'),
    type,
    skillId,
    description,
    oldValue,
    newValue,
    createdAt: new Date().toISOString(),
  }
  await db.put('progressEvents', event)
}

// ── User Skill Levels ────────────────────────────────────────

export async function upsertUserSkillLevel(skillId: string, level: UserSkillLevel['level']) {
  const db = await getDB()
  const updatedAt = new Date().toISOString()
  const existing = await db.get('userSkillLevels', skillId)

  const skills = await getSkills()
  const skill = skills.find((s) => s.id === skillId)
  const skillName = skill?.name || skillId

  if (existing) {
    const oldLevel = existing.level
    await db.put('userSkillLevels', { ...existing, level, updatedAt })
    if (level > oldLevel) {
      await recordProgressEvent('level_up', `Ниво на "${skillName}" повишено от ${oldLevel} на ${level}`, skillId, oldLevel, level)
    } else if (level < oldLevel) {
      await recordProgressEvent('level_down', `Ниво на "${skillName}" понижено от ${oldLevel} на ${level}`, skillId, oldLevel, level)
    }
  } else {
    await db.put('userSkillLevels', { skillId, level, updatedAt })
    if (level > 0) {
      await recordProgressEvent('skill_added', `Добавено умение "${skillName}" с ниво ${level}`, skillId, 0, level)
    }
  }
}

// ── Materials ────────────────────────────────────────────────

export type MaterialDraft = Omit<LearningMaterial, 'id' | 'createdAt' | 'updatedAt'>

export async function addMaterial(draft: MaterialDraft): Promise<LearningMaterial> {
  const db = await getDB()
  const now = new Date().toISOString()
  const material: LearningMaterial = {
    ...draft,
    id: makeId('mat'),
    createdAt: now,
    updatedAt: now,
  }
  await db.put('materials', material)
  return material
}

export async function updateMaterial(
  id: string,
  patch: Partial<Omit<LearningMaterial, 'id' | 'createdAt'>>,
): Promise<LearningMaterial | null> {
  const db = await getDB()
  const existing = await db.get('materials', id)
  if (!existing) return null
  const updated: LearningMaterial = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.put('materials', updated)
  return updated
}

export async function deleteMaterial(id: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('materials', id)
  if (!existing) return false
  await db.delete('materials', id)
  return true
}

// ── Material Statuses ────────────────────────────────────────

export async function setMaterialStatus(materialId: string, status: MaterialStatus) {
  const db = await getDB()
  const updatedAt = new Date().toISOString()
  await db.put('materialStatuses', { materialId, status, updatedAt })
}

// ── Endorsements ─────────────────────────────────────────────

export async function requestEndorsement(skillId: string): Promise<SkillEndorsement> {
  const db = await getDB()
  const now = new Date().toISOString()
  const endorsement: SkillEndorsement = {
    id: makeId('end'),
    skillId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  await db.put('endorsements', endorsement)
  return endorsement
}

export async function updateEndorsement(
  id: string,
  patch: Partial<Pick<SkillEndorsement, 'status' | 'mentorName' | 'comment' | 'whatChecked' | 'improvements' | 'nextSteps'>>,
): Promise<SkillEndorsement | null> {
  const db = await getDB()
  const existing = await db.get('endorsements', id)
  if (!existing) return null
  const updated: SkillEndorsement = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.put('endorsements', updated)

  // Record progress event if confirmed
  if (patch.status === 'confirmed') {
    const skills = await getSkills()
    const skill = skills.find((s) => s.id === existing.skillId)
    await recordProgressEvent('endorsement_received', `Получено потвърждение за "${skill?.name || existing.skillId}"`, existing.skillId)
  }

  return updated
}

// ── Evidence ─────────────────────────────────────────────────

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export type EvidenceDraft = Omit<SkillEvidence, 'id' | 'createdAt' | 'isValidated' | 'validatedBy' | 'validatedAt'>

export async function addEvidence(draft: EvidenceDraft): Promise<SkillEvidence> {
  const db = await getDB()
  const now = new Date().toISOString()
  const evidence: SkillEvidence = {
    ...draft,
    id: makeId('evd'),
    createdAt: now,
    isValidated: false,
  }
  await db.put('evidences', evidence)

  const skills = await getSkills()
  const skill = skills.find((s) => s.id === draft.skillId)
  await recordProgressEvent('evidence_added', `Добавено доказателство "${draft.title}" за "${skill?.name || draft.skillId}"`, draft.skillId)

  return evidence
}

export async function deleteEvidence(id: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('evidences', id)
  if (!existing) return false
  await db.delete('evidences', id)
  return true
}

export async function validateEvidence(id: string, mentorName: string, isValid: boolean): Promise<SkillEvidence | null> {
  const db = await getDB()
  const existing = await db.get('evidences', id)
  if (!existing) return null
  const updated: SkillEvidence = {
    ...existing,
    isValidated: isValid,
    validatedBy: mentorName,
    validatedAt: new Date().toISOString(),
  }
  await db.put('evidences', updated)
  return updated
}

// ── Positions ────────────────────────────────────────────────

export async function calculatePositionMatch(positionId: string, userLevels: UserSkillLevel[]): Promise<PositionMatch> {
  const positions = await getPositions()
  const position = positions.find((p) => p.id === positionId)

  if (!position) {
    return { positionId, coveragePercent: 0, missingSkills: [], matchedSkills: [] }
  }

  const userLevelMap = new Map(userLevels.map((ul) => [ul.skillId, ul.level]))
  const missingSkills: PositionMatch['missingSkills'] = []
  const matchedSkills: PositionMatch['matchedSkills'] = []
  let totalWeight = 0
  let achievedWeight = 0

  for (const req of position.requirements) {
    const weight = req.priority === 'required' ? 2 : 1
    totalWeight += weight
    const currentLevel = userLevelMap.get(req.skillId) || 0

    if (currentLevel >= req.minLevel) {
      achievedWeight += weight
      matchedSkills.push({ skillId: req.skillId, level: currentLevel })
    } else {
      missingSkills.push({
        skillId: req.skillId,
        currentLevel,
        requiredLevel: req.minLevel,
      })
    }
  }

  const coveragePercent = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0

  return { positionId, coveragePercent, missingSkills, matchedSkills }
}

// ── Progress Events ──────────────────────────────────────────

export async function addProgressEvent(type: ProgressEventType, description: string, skillId?: string): Promise<ProgressEvent> {
  const event: ProgressEvent = {
    id: makeId('prog'),
    type,
    skillId,
    description,
    createdAt: new Date().toISOString(),
  }
  const db = await getDB()
  await db.put('progressEvents', event)
  return event
}

// ── Feedback (Contact page) ──────────────────────────────────

export type { FeedbackEntry } from './db'

export async function getFeedback(): Promise<import('./db').FeedbackEntry[]> {
  const db = await getDB()
  const all = await db.getAll('feedback')
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function addFeedback(entry: Omit<import('./db').FeedbackEntry, 'id' | 'createdAt'>): Promise<import('./db').FeedbackEntry> {
  const db = await getDB()
  const feedback: import('./db').FeedbackEntry = {
    ...entry,
    id: makeId('fb'),
    createdAt: new Date().toISOString(),
  }
  await db.put('feedback', feedback)
  return feedback
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const db = await getDB()
  const existing = await db.get('feedback', id)
  if (!existing) return false
  await db.delete('feedback', id)
  return true
}

export async function replyToFeedback(id: string, reply: string): Promise<import('./db').FeedbackEntry | null> {
  const db = await getDB()
  const existing = await db.get('feedback', id)
  if (!existing) return null
  const updated: import('./db').FeedbackEntry = {
    ...existing,
    adminReply: reply,
    adminRepliedAt: new Date().toISOString(),
  }
  await db.put('feedback', updated)
  return updated
}

// ── Reset ────────────────────────────────────────────────────

export async function resetAllData() {
  const db = await getDB()

  // Clear all stores
  await db.clear('categories')
  await db.clear('skills')
  await db.clear('materials')
  await db.clear('userSkillLevels')
  await db.clear('materialStatuses')
  await db.clear('endorsements')
  await db.clear('userProfiles')
  await db.clear('evidences')
  await db.clear('positions')
  await db.clear('progressEvents')
  await db.clear('feedback')

  // Re-seed
  await putMany('categories', seedCategories)
  await putMany('skills', seedSkills)
  await putMany('materials', seedMaterials)
  await putMany('positions', seedPositions)
  await putMany('userProfiles', seedUserProfiles)
}
