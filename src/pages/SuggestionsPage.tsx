import { useMemo, useState } from 'react'
import type { Skill, UserSkillLevel, Position, LearningMaterial } from '../domain/types'

type Props = {
  skills: Skill[]
  userLevels: UserSkillLevel[]
  materials: LearningMaterial[]
  positions: Position[]
}

export default function SuggestionsPage({ skills, userLevels, materials, positions }: Props) {
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set())
  const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s] as const)), [skills])
  const levelBySkillId = useMemo(() => new Map(userLevels.map((l) => [l.skillId, l.level] as const)), [userLevels])

  // Predict position matches using the provided userLevels
  const positionMatches = useMemo(() => {
    return positions.map((position) => {
      let totalWeight = 0
      let achievedWeight = 0
      const missingSkills: { skillId: string; name: string; currentLevel: number; requiredLevel: number }[] = []

      for (const req of position.requirements) {
        const weight = req.priority === 'required' ? 2 : 1
        totalWeight += weight
        const currentLevel = levelBySkillId.get(req.skillId) || 0

        if (currentLevel >= req.minLevel) {
          achievedWeight += weight
        } else {
          missingSkills.push({
            skillId: req.skillId,
            name: skillById.get(req.skillId)?.name || req.skillId,
            currentLevel,
            requiredLevel: req.minLevel,
          })
        }
      }

      const coveragePercent = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0

      return { position, coveragePercent, missingSkills }
    })
    .filter(m => m.coveragePercent > 0)
    .sort((a, b) => b.coveragePercent - a.coveragePercent)
    .slice(0, 3) // Top 3 positions
  }, [positions, levelBySkillId, skillById])

  // Suggest Materials based on skills
  const suggestedMaterials = useMemo(() => {
    // Collect target skills
    const targetSkillIds = new Set<string>()

    // 1. Skills the user is currently learning
    userLevels.forEach((l) => {
      if (l.level > 0 && l.level < 5) {
        targetSkillIds.add(l.skillId)
      }
    })

    // 2. Missing skills from top matched positions
    positionMatches.forEach((pm) => {
      pm.missingSkills.forEach((ms) => {
        targetSkillIds.add(ms.skillId)
      })
    })

    if (targetSkillIds.size === 0) return []

    // Score materials
    const scoredMaterials = materials.map((material) => {
      let score = 0
      const matchedSkills: { name: string; targetAction: 'position' | 'levelUp' }[] = []

      material.skillIds.forEach((skillId) => {
        if (targetSkillIds.has(skillId)) {
          score += 1

          // Determine why we recommended it (extra points if missing for position)
          const isMissingForPosition = positionMatches.some(pm => 
            pm.missingSkills.some(ms => ms.skillId === skillId)
          )

          if (isMissingForPosition) score += 2

          matchedSkills.push({
            name: skillById.get(skillId)?.name || skillId,
            targetAction: isMissingForPosition ? 'position' : 'levelUp',
          })
        }
      })

      return { material, score, matchedSkills }
    })

    return scoredMaterials
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 materials
  }, [materials, userLevels, positionMatches, skillById])



  return (
    <div className="page" style={{ animation: 'fadeSlideUp 0.3s ease-out forwards' }}>
      <header className="pageHeader">
        <h2 className="pageTitle">Предложения</h2>
        <p className="pageSubtitle">Автоматични препоръки базирани на твоите умения.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section className="panel">
          <div className="panelHeader">
            <h3>Подходящи материали</h3>
          </div>
          <div className="panelBody">
            <p className="muted" style={{ marginBottom: '16px' }}>
              Тези материали ще ти помогнат да развиеш необходимите умения за позициите, към които се стремиш.
            </p>
            {suggestedMaterials.length > 0 ? (
              <div className="list">
                {suggestedMaterials.map(({ material, matchedSkills }, idx) => (
                  <div key={material.id || idx} className="row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14.5px' }}>{material.title}</strong>
                      <span className="materialType" style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--r-full)',
                        background: 'rgba(var(--color-primary),0.08)', textTransform: 'uppercase',
                        color: 'rgb(var(--color-primary))', fontWeight: 700, letterSpacing: '0.04em'
                      }}>
                        {material.type}
                      </span>
                    </div>
                    {material.description && <div className="muted small">{material.description}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {matchedSkills.map((ms, i) => (
                        <span key={i} className={`chipSmall ${ms.targetAction === 'position' ? 'chipActive' : ''}`} style={{ fontSize: '11px', width: 'auto', padding: '4px 10px' }}>
                          {ms.name} {ms.targetAction === 'position' ? '(Нужно за позиция)' : ''}
                        </span>
                      ))}
                    </div>
                    {material.url && (
                      <div style={{ marginTop: '4px' }}>
                        <a href={material.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(var(--color-primary))', textDecoration: 'none', fontSize: '12.5px' }}>
                          Към материала &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)' }}>
                 Нямаме подходящи материали в момента. Добави нови умения или разгледай други секции!
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <h3>Подходящи позиции</h3>
          </div>
          <div className="panelBody">
            <p className="muted" style={{ marginBottom: '16px' }}>
               Роли, които най-добре отговарят на текущия ти профил. Продължавай напред!
            </p>
            {positionMatches.length > 0 ? (
              <div className="list">
                {positionMatches.map(({ position, coveragePercent, missingSkills }, idx) => (
                  <div key={position.id || idx} className="row" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '16px' }}>{position.name}</strong>
                      <div className="badge" style={{ 
                        background: coveragePercent >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                        color: coveragePercent >= 80 ? 'var(--c-green-500)' : 'var(--c-orange-500)',
                      }}>
                        {coveragePercent}% съвпадение
                      </div>
                    </div>
                    {position.description && <div className="muted small">{position.description}</div>}
                    
                    {missingSkills.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span className="muted small" style={{ display: 'block', marginBottom: '8px' }}>Какво можеш да подобриш:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(expandedPositions.has(position.id) ? missingSkills : missingSkills.slice(0, 3)).map((ms, i) => (
                            <span key={i} className="chipSmall" style={{ fontSize: '11px', background: 'var(--c-bg-page)', width: 'auto', padding: '4px 10px' }}>
                              {ms.name} ({ms.currentLevel}/{ms.requiredLevel})
                            </span>
                          ))}
                          {!expandedPositions.has(position.id) && missingSkills.length > 3 && (
                            <button
                              className="chipSmall"
                              style={{ fontSize: '11px', background: 'var(--c-bg-page)', width: 'auto', padding: '4px 10px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.2)' }}
                              onClick={() => {
                                const next = new Set(expandedPositions)
                                next.add(position.id)
                                setExpandedPositions(next)
                              }}
                            >
                              + още {missingSkills.length - 3}...
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ padding: '24px', textAlign: 'center', background: 'var(--c-bg-hover)', borderRadius: 'var(--radius-md)' }}>
                Добави умения в таб "Умения", за да открием подходящи позиции за теб.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
