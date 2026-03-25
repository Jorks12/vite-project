import { useState, useMemo } from 'react'
import type { EvidenceType, Skill, SkillEvidence, UserSkillLevel, UserRole } from '../domain/types'
import { isValidUrl } from '../data/storage'

type Props = {
    skills: Skill[]
    evidences: SkillEvidence[]
    userLevels: UserSkillLevel[]
    role: UserRole
    onAdd: (draft: Omit<SkillEvidence, 'id' | 'createdAt' | 'isValidated' | 'validatedBy' | 'validatedAt'>) => void
    onDelete: (id: string) => void
    onValidate: (id: string, mentorName: string, isValid: boolean) => void
}

const evidenceTypeLabels: Record<EvidenceType, string> = {
    github: 'GitHub Repository',
    demo: 'Demo/Публичен проект',
    file: 'Файл (PDF, снимка, документ)',
    portfolio: 'Портфолио проект',
}

export default function EvidencePage({ skills, evidences, userLevels, role, onAdd, onDelete, onValidate }: Props) {
    const canAddEvidence = role === 'student' || role === 'admin'
    const canValidate = role === 'mentor' || role === 'admin'
    const canDelete = role === 'student' || role === 'admin'
    const [selectedSkillId, setSelectedSkillId] = useState<string>('')
    const [filterSkillId, setFilterSkillId] = useState<string>('')
    const [title, setTitle] = useState('')
    const [type, setType] = useState<EvidenceType>('github')
    const [url, setUrl] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    // Get skills that user has (level > 0)
    const userSkillIds = useMemo(() => new Set(userLevels.filter(ul => ul.level > 0).map(ul => ul.skillId)), [userLevels])
    const availableSkills = useMemo(() => skills.filter(s => userSkillIds.has(s.id)), [skills, userSkillIds])

    const filteredEvidences = useMemo(() => {
        let result = evidences
        if (filterSkillId) {
            result = result.filter(e => e.skillId === filterSkillId)
        }
        return result
    }, [evidences, filterSkillId])

    const evidencesBySkill = useMemo(() => {
        const map = new Map<string, SkillEvidence[]>()
        for (const ev of filteredEvidences) {
            const arr = map.get(ev.skillId) || []
            arr.push(ev)
            map.set(ev.skillId, arr)
        }
        return map
    }, [filteredEvidences])

    function handleAdd() {
        setError('')
        if (!selectedSkillId) {
            setError('Изберете умение')
            return
        }
        if (!title.trim()) {
            setError('Въведете заглавие')
            return
        }
        if (type !== 'file' && url) {
            if (!isValidUrl(url)) {
                setError('Невалиден URL формат')
                return
            }
        }
        if ((type === 'github' || type === 'demo' || type === 'portfolio') && !url) {
            setError('URL е задължителен за този тип доказателство')
            return
        }

        onAdd({
            skillId: selectedSkillId,
            type,
            title: title.trim(),
            url: url.trim() || undefined,
            description: description.trim() || undefined,
        })

        setTitle('')
        setUrl('')
        setDescription('')
    }

    const getSkillName = (skillId: string) => skills.find(s => s.id === skillId)?.name || skillId

    return (
        <div className="page">
            <div className="pageHeader">
                <div>
                    <h1 className="pageTitle">Доказателства за умения</h1>
                    <p className="muted">
                        {canAddEvidence
                            ? 'Добавете линкове, файлове и проекти за вашите умения'
                            : 'Преглед и валидиране на доказателства на учениците'}
                    </p>
                </div>
                {canValidate && (
                    <span className="badge badgeSuccess" style={{ fontSize: 12, padding: '6px 12px' }}>
                        Менторски режим
                    </span>
                )}
            </div>

            {/* Add new evidence form */}
            {canAddEvidence && (
            <div className="card addForm">
                <h3>Добави доказателство</h3>
                <div className="formGrid">
                    <div className="formField">
                        <label>Умение</label>
                        <select className="select" value={selectedSkillId} onChange={(e) => setSelectedSkillId(e.target.value)}>
                            <option value="">-- Избери умение --</option>
                            {availableSkills.map(skill => (
                                <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="formField">
                        <label>Тип доказателство</label>
                        <select className="select" value={type} onChange={(e) => setType(e.target.value as EvidenceType)}>
                            {Object.entries(evidenceTypeLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="formField">
                        <label>Заглавие</label>
                        <input
                            className="input"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Напр. 'Моят React проект'"
                        />
                    </div>
                    <div className="formField">
                        <label>URL {type === 'file' ? '(по избор)' : ''}</label>
                        <input
                            className="input"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://github.com/..."
                        />
                    </div>
                    <div className="formField fullWidth">
                        <label>Описание (по избор)</label>
                        <textarea
                            className="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Описание на проекта или доказателството..."
                            rows={2}
                        />
                    </div>
                </div>
                {error && <div className="errorMsg" style={{ marginTop: '12px' }}>{error}</div>}
                <button className="button buttonPrimary" onClick={handleAdd} style={{ marginTop: '24px' }}>
                    Добави доказателство
                </button>
            </div>
            )}

            {/* Filter */}
            <div className="filterBar">
                <label>Филтрирай по умение:</label>
                <select className="select" value={filterSkillId} onChange={(e) => setFilterSkillId(e.target.value)}>
                    <option value="">Всички умения</option>
                    {skills.map(skill => (
                        <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                </select>
            </div>

            {/* Evidence list */}
            {filteredEvidences.length === 0 ? (
                <div className="emptyState">
                    <div className="emptyIcon"></div>
                    <p>Няма добавени доказателства</p>
                    <p className="muted small">Добавете GitHub линкове, демо проекти или файлове</p>
                </div>
            ) : (
                <div className="evidenceList">
                    {Array.from(evidencesBySkill.entries()).map(([skillId, items]) => (
                        <div key={skillId} className="skillEvidenceGroup">
                            <h3 className="skillGroupTitle">{getSkillName(skillId)}</h3>
                            <div className="evidenceCards">
                                {items.map(ev => (
                                    <div key={ev.id} className={`evidenceCard ${ev.isValidated ? 'validated' : ''}`}>
                                        <div className="evidenceHeader">
                                            <span className="evidenceType">{evidenceTypeLabels[ev.type]}</span>
                                            {ev.isValidated && (
                                                <span className="validatedBadge">Валидирано от {ev.validatedBy}</span>
                                            )}
                                        </div>
                                        <h4 className="evidenceTitle">{ev.title}</h4>
                                        {ev.url && (
                                            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="evidenceLink">
                                                {ev.url}
                                            </a>
                                        )}
                                        {ev.description && <p className="evidenceDesc">{ev.description}</p>}
                                        <div className="evidenceFooter">
                                            <span className="evidenceDate">
                                                {new Date(ev.createdAt).toLocaleDateString('bg-BG')}
                                            </span>
                                            <div className="evidenceActions">
                                                {canValidate && !ev.isValidated && (
                                                    <>
                                                        <button
                                                            className="button buttonSmall buttonSuccess"
                                                            onClick={() => onValidate(ev.id, 'Ментор', true)}
                                                        >
                                                            Приеми
                                                        </button>
                                                        <button
                                                            className="button buttonSmall buttonDanger"
                                                            onClick={() => onValidate(ev.id, 'Ментор', false)}
                                                        >
                                                            Отхвърли
                                                        </button>
                                                    </>
                                                )}
                                                {canDelete && (
                                                <button
                                                    className="button buttonSmall buttonGhost"
                                                    onClick={() => onDelete(ev.id)}
                                                >
                                                    Изтрий
                                                </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
