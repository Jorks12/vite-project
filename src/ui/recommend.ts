import type { LearningMaterial, Skill, UserSkillLevel } from '../domain/types'

export type RecommendedMaterial = {
  material: LearningMaterial
  score: number
  reasons: string[]
}

export function buildRecommendations(args: {
  materials: LearningMaterial[]
  skills: Skill[]
  userLevels: UserSkillLevel[]
}): RecommendedMaterial[] {
  const { materials, skills, userLevels } = args

  const skillById = new Map(skills.map((s) => [s.id, s] as const))
  const levelBySkillId = new Map(userLevels.map((l) => [l.skillId, l.level] as const))

  const scored: RecommendedMaterial[] = materials.map((m) => {
    let bestGap = Infinity
    const reasons: string[] = []

    for (const sid of m.skillIds) {
      const skill = skillById.get(sid)
      const userLevel = levelBySkillId.get(sid) ?? 0
      const gap = Math.max(0, m.level - userLevel)
      if (gap < bestGap) bestGap = gap

      if (skill) {
        if (gap > 0) {
          reasons.push(`${skill.name}: ниво ${userLevel} → препоръчано за ниво ${m.level}`)
        } else {
          reasons.push(`${skill.name}: имаш ниво ${userLevel}`)
        }
      }
    }

    if (!Number.isFinite(bestGap)) bestGap = 5

    const missing = bestGap > 0
    const score = missing ? 100 - bestGap * 10 : 50

    return {
      material: m,
      score,
      reasons,
    }
  })

  return scored
    .filter((x) => {
      return x.material.skillIds.some((sid) => (levelBySkillId.get(sid) ?? 0) < x.material.level)
    })
    .sort((a, b) => b.score - a.score)
}
