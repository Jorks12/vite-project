export type SkillCategory = {
  id: string
  name: string
}

export type Skill = {
  id: string
  name: string
  categoryId: string
  description?: string
}

export type MaterialType = 'lesson' | 'article' | 'video' | 'task'

export type LearningMaterial = {
  id: string
  title: string
  type: MaterialType
  url?: string
  description?: string
  skillIds: string[]
  level: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export type UserSkillLevel = {
  skillId: string
  level: 0 | 1 | 2 | 3 | 4 | 5
  updatedAt: string
}

// Feature 4: Material Status
export type MaterialStatus = 'none' | 'read' | 'later' | 'favorite'

export type UserMaterialStatus = {
  materialId: string
  status: MaterialStatus
  updatedAt: string
}

// Feature 6: Endorsement System
export type EndorsementStatus = 'unconfirmed' | 'pending' | 'confirmed' | 'returned'

export type SkillEndorsement = {
  id: string
  skillId: string
  status: EndorsementStatus
  mentorName?: string
  comment?: string
  whatChecked?: string
  improvements?: string
  nextSteps?: string
  createdAt: string
  updatedAt: string
}

// User roles for authentication
export type UserRole = 'admin' | 'mentor' | 'student'

// Feature 5: User profiles for search
export type UserProfile = {
  id: string
  name: string
  role: UserRole
  bio?: string
  skills: { skillId: string; level: number; endorsementCount: number }[]
  isActive: boolean
}

// Feature 7: Evidence for Skills
export type EvidenceType = 'github' | 'demo' | 'file' | 'portfolio'

export type SkillEvidence = {
  id: string
  skillId: string
  type: EvidenceType
  title: string
  url?: string
  fileName?: string
  fileType?: string
  description?: string
  createdAt: string
  isValidated: boolean
  validatedBy?: string
  validatedAt?: string
}

// Feature 8: Position Matching
export type PositionRequirement = {
  skillId: string
  minLevel: 1 | 2 | 3 | 4 | 5
  priority: 'required' | 'optional'
}

export type Position = {
  id: string
  name: string
  description?: string
  requirements: PositionRequirement[]
}

export type PositionMatch = {
  positionId: string
  coveragePercent: number
  missingSkills: { skillId: string; currentLevel: number; requiredLevel: number }[]
  matchedSkills: { skillId: string; level: number }[]
}

// Feature 9: Progress Tracking
export type ProgressEventType =
  | 'skill_added'
  | 'level_up'
  | 'level_down'
  | 'evidence_added'
  | 'endorsement_received'
  | 'project_added'
  | 'certificate_added'

export type ProgressEvent = {
  id: string
  type: ProgressEventType
  skillId?: string
  description: string
  oldValue?: number
  newValue?: number
  createdAt: string
}
