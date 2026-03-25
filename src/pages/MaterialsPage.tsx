import { useMemo, useState } from 'react'
import type { LearningMaterial, MaterialType, Skill, UserRole } from '../domain/types'
import { formatMaterialType, clampLevel } from '../ui/format'
import type { MaterialDraft } from '../data/storage'

type Props = {
  skills: Skill[]
  materials: LearningMaterial[]
  role: UserRole
  onAdd: (draft: MaterialDraft) => void
  onDelete: (id: string) => void
}

const materialTypes: MaterialType[] = ['lesson', 'article', 'video', 'task']

export default function MaterialsPage({ skills, materials, role, onAdd, onDelete }: Props) {
  const canManage = role === 'mentor' || role === 'admin'
  const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s] as const)), [skills])

  const [title, setTitle] = useState('')
  const [type, setType] = useState<MaterialType>('lesson')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState(2)
  const [skillIds, setSkillIds] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return materials
    return materials.filter((m) => {
      const text = `${m.title} ${m.description ?? ''} ${(m.tags ?? []).join(' ')}`.toLowerCase()
      return text.includes(q)
    })
  }, [materials, query])

  function toggleSkill(sid: string) {
    setSkillIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]))
  }

  function resetForm() {
    setTitle('')
    setType('lesson')
    setUrl('')
    setDescription('')
    setLevel(2)
    setSkillIds([])
    setTags('')
  }

  return (
    <div className="page">
      <h2>Учебни материали</h2>

      {canManage && (

      <section className="panel">
        <h3>Добавяне на материал</h3>

        <div className="formGrid">
          <label className="field">
            <span className="label">Заглавие</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="field">
            <span className="label">Тип</span>
            <select className="select" value={type} onChange={(e) => setType(e.target.value as MaterialType)}>
              {materialTypes.map((t) => (
                <option key={t} value={t}>
                  {formatMaterialType(t)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label">Ниво (1-5)</span>
            <input
              className="input"
              type="number"
              min={1}
              max={5}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span className="label">URL (по желание)</span>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>

          <label className="field fieldFull">
            <span className="label">Описание (по желание)</span>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>

          <label className="field fieldFull">
            <span className="label">Тагове (разделени със запетая)</span>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
        </div>

        <div className="panelSub">
          <div className="label">Свързани умения</div>
          <div className="chips">
            {skills
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => {
                const active = skillIds.includes(s.id)
                return (
                  <button
                    type="button"
                    key={s.id}
                    className={active ? 'chip chipActive' : 'chip'}
                    onClick={() => toggleSkill(s.id)}
                  >
                    {s.name}
                  </button>
                )
              })}
          </div>
        </div>

        <div className="actions">
          <button
            className="button primary"
            onClick={() => {
              const t = title.trim()
              if (!t) return
              if (skillIds.length === 0) return

              onAdd({
                title: t,
                type,
                url: url.trim() || undefined,
                description: description.trim() || undefined,
                skillIds,
                level: clampLevel(level),
                tags: tags
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
              resetForm()
            }}
          >
            Добави
          </button>
          <button className="button" onClick={resetForm}>
            Изчисти
          </button>
          <div className="muted small">
            Изисква се заглавие и поне 1 умение.
          </div>
        </div>
      </section>
      )}

      <section className="panel">
        <div className="panelHeader">
          <h3>Списък материали</h3>
          <input
            className="input"
            placeholder="Търси..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="list">
          {filtered.map((m) => (
            <div key={m.id} className="row">
              <div className="rowMain">
                <div className="rowTitle">
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noreferrer">
                      {m.title}
                    </a>
                  ) : (
                    m.title
                  )}
                </div>
                <div className="rowSub muted">
                  {formatMaterialType(m.type)} • ниво {m.level}
                  {m.skillIds.length > 0 ? (
                    <> • {m.skillIds.map((sid) => skillById.get(sid)?.name ?? sid).join(', ')}</>
                  ) : null}
                </div>
                {m.description ? <div className="rowSub">{m.description}</div> : null}
                {m.tags && m.tags.length > 0 ? (
                  <div className="rowSub muted small">Тагове: {m.tags.join(', ')}</div>
                ) : null}
              </div>

              {canManage && (
                <div className="rowRight">
                  <button className="button danger" onClick={() => onDelete(m.id)}>
                    Изтрий
                  </button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 ? <div className="muted">Няма намерени материали.</div> : null}
        </div>
      </section>
    </div>
  )
}
