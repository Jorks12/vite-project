import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export type FeedbackEntry = {
    id: string
    name: string
    email: string
    type: 'bug' | 'feature' | 'question' | 'other'
    subject: string
    message: string
    createdAt: string
    adminReply?: string
    adminRepliedAt?: string
}

export interface SkillMatrixDB extends DBSchema {
    categories: {
        key: string
        value: import('../domain/types').SkillCategory
    }
    skills: {
        key: string
        value: import('../domain/types').Skill
        indexes: { 'by-category': string }
    }
    materials: {
        key: string
        value: import('../domain/types').LearningMaterial
    }
    userSkillLevels: {
        key: string
        value: import('../domain/types').UserSkillLevel
    }
    materialStatuses: {
        key: string
        value: import('../domain/types').UserMaterialStatus
    }
    endorsements: {
        key: string
        value: import('../domain/types').SkillEndorsement
    }
    userProfiles: {
        key: string
        value: import('../domain/types').UserProfile
    }
    evidences: {
        key: string
        value: import('../domain/types').SkillEvidence
    }
    positions: {
        key: string
        value: import('../domain/types').Position
    }
    progressEvents: {
        key: string
        value: import('../domain/types').ProgressEvent
    }
    feedback: {
        key: string
        value: FeedbackEntry
    }
}

let dbPromise: Promise<IDBPDatabase<SkillMatrixDB>> | null = null

export function getDB(): Promise<IDBPDatabase<SkillMatrixDB>> {
    if (!dbPromise) {
        dbPromise = openDB<SkillMatrixDB>('SkillMatrixDB', 2, {
            upgrade(db) {
                // Categories
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' })
                }
                // Skills
                if (!db.objectStoreNames.contains('skills')) {
                    const skillStore = db.createObjectStore('skills', { keyPath: 'id' })
                    skillStore.createIndex('by-category', 'categoryId')
                }
                // Materials
                if (!db.objectStoreNames.contains('materials')) {
                    db.createObjectStore('materials', { keyPath: 'id' })
                }
                // User Skill Levels
                if (!db.objectStoreNames.contains('userSkillLevels')) {
                    db.createObjectStore('userSkillLevels', { keyPath: 'skillId' })
                }
                // Material Statuses
                if (!db.objectStoreNames.contains('materialStatuses')) {
                    db.createObjectStore('materialStatuses', { keyPath: 'materialId' })
                }
                // Endorsements
                if (!db.objectStoreNames.contains('endorsements')) {
                    db.createObjectStore('endorsements', { keyPath: 'id' })
                }
                // User Profiles
                if (!db.objectStoreNames.contains('userProfiles')) {
                    db.createObjectStore('userProfiles', { keyPath: 'id' })
                }
                // Evidences
                if (!db.objectStoreNames.contains('evidences')) {
                    db.createObjectStore('evidences', { keyPath: 'id' })
                }
                // Positions
                if (!db.objectStoreNames.contains('positions')) {
                    db.createObjectStore('positions', { keyPath: 'id' })
                }
                // Progress Events
                if (!db.objectStoreNames.contains('progressEvents')) {
                    db.createObjectStore('progressEvents', { keyPath: 'id' })
                }
                // Feedback
                if (!db.objectStoreNames.contains('feedback')) {
                    db.createObjectStore('feedback', { keyPath: 'id' })
                }
            },
        })
    }
    return dbPromise
}
