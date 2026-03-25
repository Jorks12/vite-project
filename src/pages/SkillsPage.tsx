import { useMemo, useState } from 'react'
import type { SkillCategory, Skill, UserSkillLevel, SkillEndorsement, UserRole } from '../domain/types'

type Props = {
  categories: SkillCategory[]
  skills: Skill[]
  userLevels: UserSkillLevel[]
  endorsements: SkillEndorsement[]
  role: UserRole
  onSetLevel: (skillId: string, level: UserSkillLevel['level']) => void
  onRequestEndorsement: (skillId: string) => void
  onAddSkill: (draft: Omit<Skill, 'id'>) => void
  onDeleteSkill: (id: string) => void
}

const endorsementLabels: Record<SkillEndorsement['status'], string> = {
  unconfirmed: '',
  pending: '⏳ Чака',
  confirmed: '✓ Потвърдено',
  returned: '↩ Върнато',
}

const endorsementColors: Record<SkillEndorsement['status'], string> = {
  unconfirmed: '',
  pending: 'badgeWarning',
  confirmed: 'badgeSuccess',
  returned: 'badgeDanger',
}

export default function SkillsPage({
  categories,
  skills,
  userLevels,
  endorsements,
  role,
  onSetLevel,
  onRequestEndorsement,
  onAddSkill,
  onDeleteSkill,
}: Props) {
  const canEditLevels = role === 'student' || role === 'admin'
  const canRequestEndorsement = role === 'student' || role === 'admin'
  const canManageSkills = role === 'admin' || role === 'mentor'

  const [isAdding, setIsAdding] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState(categories[0]?.id || '')
  const [newSkillDesc, setNewSkillDesc] = useState('')

  const levelBySkillId = useMemo(() => {
    return new Map(userLevels.map((l) => [l.skillId, l.level] as const))
  }, [userLevels])

  const endorsementBySkillId = useMemo(() => {
    return new Map(endorsements.map((e) => [e.skillId, e] as const))
  }, [endorsements])

  const skillsByCategoryId = useMemo(() => {
    const map = new Map<string, Skill[]>()
    for (const s of skills) {
      const arr = map.get(s.categoryId) ?? []
      arr.push(s)
      map.set(s.categoryId, arr)
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => a.name.localeCompare(b.name))
    }
    return map
  }, [skills])

  return (
    <div className="page">
      <h2>Умения</h2>
      <p className="muted">
        {canEditLevels
          ? 'Задай ниво (0–5) за всяко умение. Можеш да поискаш потвърждение от ментор.'
          : 'Преглед на уменията на учениците.'}
      </p>

      {canManageSkills && (
        <div style={{ marginBottom: 16 }}>
          <button className="button" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? 'Отказ' : '+ Добави умение'}
          </button>
        </div>
      )}

      {isAdding && (
        <div className="card addForm" style={{ marginBottom: 24 }}>
          <h3>Ново умение</h3>
          <div className="formGrid">
            <div className="formField">
              <label>Име на умението</label>
              <input
                className="input"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="напр. React.js"
              />
            </div>
            <div className="formField">
              <label>Категория</label>
              <select
                className="select"
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="formField fullWidth">
              <label>Описание</label>
              <input
                className="input"
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                placeholder="Кратко описание..."
              />
            </div>
          </div>
          <button
            className="button buttonPrimary"
            disabled={!newSkillName.trim() || !newSkillCategory}
            onClick={() => {
              onAddSkill({
                name: newSkillName.trim(),
                categoryId: newSkillCategory,
                description: newSkillDesc.trim(),
              })
              setNewSkillName('')
              setNewSkillDesc('')
              setIsAdding(false)
            }}
          >
            Запази умението
          </button>
        </div>
      )}

      <div className="grid">
        {categories.map((c) => {
          const list = skillsByCategoryId.get(c.id) ?? []
          if (list.length === 0) return null
          return (
            <section key={c.id} className="panel">
              <h3>{c.name}</h3>
              <div className="list">
                {list.map((s) => {
                  const lvl = levelBySkillId.get(s.id) ?? 0
                  const endorsement = endorsementBySkillId.get(s.id)
                  return (
                    <div key={s.id} className="row">
                      <div className="rowMain">
                        <div className="rowTitle">
                          {s.name}
                          {endorsement && (
                            <span
                              className={`badge ${endorsementColors[endorsement.status]}`}
                              style={{ marginLeft: 8, fontSize: 11 }}
                            >
                              {endorsementLabels[endorsement.status]}
                            </span>
                          )}
                        </div>
                        {s.description ? (
                          <div className="rowSub muted">{s.description}</div>
                        ) : null}
                        {endorsement?.comment && (
                          <div className="rowSub small muted">
                            {endorsement.comment}
                          </div>
                        )}
                      </div>

                      <div className="rowRight" style={{ gap: 6 }}>
                        {canEditLevels ? (
                          <select
                            className="select"
                            value={lvl}
                            onChange={(e) =>
                              onSetLevel(
                                s.id,
                                Number(e.target.value) as UserSkillLevel['level'],
                              )
                            }
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        ) : (
                          <span className="badge">{lvl > 0 ? `Ниво ${lvl}` : '—'}</span>
                        )}

                        {canRequestEndorsement && lvl > 0 && !endorsement && (
                          <button
                            className="button"
                            onClick={() => onRequestEndorsement(s.id)}
                            title="Поискай потвърждение"
                          >
                            Потвърди
                          </button>
                        )}
                        {canManageSkills && (
                          <button
                            className="button buttonGhost"
                            onClick={() => {
                                if (confirm(`Сигурни ли сте, че искате да изтриете умението "${s.name}"?`)) {
                                    onDeleteSkill(s.id)
                                }
                            }}
                            title="Изтрий умението"
                            style={{ color: '#dc2626' }}
                          >
                            Изтрий
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
