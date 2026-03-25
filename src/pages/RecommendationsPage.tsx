import { useMemo, useState } from 'react'
import type { LearningMaterial, MaterialStatus, Skill, UserMaterialStatus, UserSkillLevel } from '../domain/types'
import { buildRecommendations } from '../ui/recommend'
import { formatMaterialType } from '../ui/format'

type Props = {
  skills: Skill[]
  materials: LearningMaterial[]
  userLevels: UserSkillLevel[]
  materialStatuses: UserMaterialStatus[]
  onSetStatus: (materialId: string, status: MaterialStatus) => void
}

const statusIcon: Record<MaterialStatus, string> = {
  none: '',
  read: '✓',
  later: '◷',
  favorite: '★',
}

const statusLabel: Record<MaterialStatus, string> = {
  none: '',
  read: 'Прочетено',
  later: 'За после',
  favorite: 'Любим',
}

export default function RecommendationsPage({ skills, materials, userLevels, materialStatuses, onSetStatus }: Props) {
  const [maxItems, setMaxItems] = useState(10)
  const [hideRead, setHideRead] = useState(false)

  const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s] as const)), [skills])
  const statusByMaterialId = useMemo(() => new Map(materialStatuses.map((s) => [s.materialId, s.status] as const)), [materialStatuses])

  const recs = useMemo(() => {
    let list = buildRecommendations({ materials, skills, userLevels })
    if (hideRead) {
      list = list.filter((r) => statusByMaterialId.get(r.material.id) !== 'read')
    }
    return list.slice(0, maxItems)
  }, [materials, skills, userLevels, maxItems, hideRead, statusByMaterialId])

  return (
    <div className="page">
      <h2>Препоръчани материали</h2>
      <p className="muted">
        Подреждане по това кои материали са най-близо до следващото ти ниво за свързаните
        умения.
      </p>

      <section className="panel">
        <div className="panelHeader">
          <h3>Резултати</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label className="fieldInline">
              <input
                type="checkbox"
                checked={hideRead}
                onChange={(e) => setHideRead(e.target.checked)}
              />
              <span className="label">Скрий прочетените</span>
            </label>
            <label className="fieldInline">
              <span className="label">Покажи</span>
              <input
                className="input inputSmall"
                type="number"
                min={1}
                max={50}
                value={maxItems}
                onChange={(e) => setMaxItems(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="list">
          {recs.map((r) => {
            const m: LearningMaterial = r.material
            const status = statusByMaterialId.get(m.id) ?? 'none'
            return (
              <div key={m.id} className="row">
                <div className="rowMain">
                  <div className="rowTitle">
                    {status !== 'none' && (
                      <span className="statusIcon" title={statusLabel[status]}>
                        {statusIcon[status]}{' '}
                      </span>
                    )}
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.title}
                      </a>
                    ) : (
                      m.title
                    )}
                  </div>
                  <div className="rowSub muted">
                    {formatMaterialType(m.type)} • ниво {m.level} •{' '}
                    {m.skillIds.map((sid) => skillById.get(sid)?.name ?? sid).join(', ')}
                  </div>
                  {m.description ? <div className="rowSub">{m.description}</div> : null}
                  <div className="rowSub muted small">{r.reasons.slice(0, 2).join(' • ')}</div>
                </div>

                <div className="rowRight" style={{ flexDirection: 'column', gap: 4 }}>
                  <div className="badge">score {r.score}</div>
                  <div className="statusButtons">
                    <button
                      className={`chipSmall ${status === 'read' ? 'chipActive' : ''}`}
                      onClick={() => onSetStatus(m.id, status === 'read' ? 'none' : 'read')}
                      title="Прочетено"
                    >
                      ✓
                    </button>
                    <button
                      className={`chipSmall ${status === 'later' ? 'chipActive' : ''}`}
                      onClick={() => onSetStatus(m.id, status === 'later' ? 'none' : 'later')}
                      title="За после"
                    >
                      ◷
                    </button>
                    <button
                      className={`chipSmall ${status === 'favorite' ? 'chipActive' : ''}`}
                      onClick={() => onSetStatus(m.id, status === 'favorite' ? 'none' : 'favorite')}
                      title="Любим"
                    >
                      ★
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {recs.length === 0 ? (
            <div className="muted">
              Няма препоръки. Задай нива в таб „Умения" или добави материали.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
