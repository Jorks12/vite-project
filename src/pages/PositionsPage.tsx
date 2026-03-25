import { useEffect, useMemo, useState } from 'react'
import type { LearningMaterial, Position, PositionMatch, Skill, UserRole } from '../domain/types'

type Props = {
    skills: Skill[]
    positions: Position[]
    materials: LearningMaterial[]
    role: UserRole
    onCalculateMatch: (positionId: string) => Promise<PositionMatch>
    onAddPosition: (draft: Omit<Position, 'id'>) => void
    onDeletePosition: (id: string) => void
}

export default function PositionsPage({ skills, positions, materials, role, onCalculateMatch, onAddPosition, onDeletePosition }: Props) {
    const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)
    const [matches, setMatches] = useState<{ position: Position; match: PositionMatch }[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDesc, setNewDesc] = useState('')

    const canManagePositions = role === 'admin' || role === 'mentor'

    const skillMap = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills])

    useEffect(() => {
        let cancelled = false
        async function loadMatches() {
            const results = await Promise.all(
                positions.map(async (pos) => ({
                    position: pos,
                    match: await onCalculateMatch(pos.id),
                }))
            )
            if (!cancelled) setMatches(results)
        }
        loadMatches()
        return () => { cancelled = true }
    }, [positions, onCalculateMatch])

    const selectedMatch = selectedPositionId
        ? matches.find(m => m.position.id === selectedPositionId)
        : null

    const getSkillName = (skillId: string) => skillMap.get(skillId)?.name || skillId

    const getCoverageColor = (percent: number) => {
        if (percent >= 80) return 'coverageHigh'
        if (percent >= 50) return 'coverageMedium'
        return 'coverageLow'
    }

    // Memoize recommended materials for the selected position
    const recommendedMaterials = useMemo(() => {
        if (!selectedMatch || selectedMatch.match.missingSkills.length === 0) return []
        const missingSkillIds = new Set(selectedMatch.match.missingSkills.map(ms => ms.skillId))
        return materials.filter(mat => mat.skillIds.some(sid => missingSkillIds.has(sid))).slice(0, 5)
    }, [selectedMatch, materials])

    return (
        <div className="page">
            <div className="pageHeader">
                <div>
                    <h1 className="pageTitle">Позиции и съвпадения</h1>
                    <p className="muted">Виж кои позиции съответстват на твоите умения</p>
                </div>
                {canManagePositions && (
                    <div style={{ marginTop: 16 }}>
                        <button className="button" onClick={() => setIsAdding(!isAdding)}>
                            {isAdding ? 'Отказ' : '+ Добави позиция'}
                        </button>
                    </div>
                )}
            </div>

            {isAdding && (
                <div className="card addForm" style={{ margin: '16px 0' }}>
                    <h3>Нова позиция</h3>
                    <div className="formGrid">
                        <div className="formField">
                            <label>Име на позицията</label>
                            <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Напр. Senior Developer" />
                        </div>
                        <div className="formField fullWidth">
                            <label>Описание</label>
                            <input className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Описание..." />
                        </div>
                    </div>
                    <button className="button buttonPrimary" disabled={!newName.trim()} onClick={() => {
                        onAddPosition({ name: newName.trim(), description: newDesc.trim(), requirements: [] })
                        setNewName(''); setNewDesc(''); setIsAdding(false);
                    }}>
                        Запази позиция
                    </button>
                </div>
            )}

            <div className="positionsLayout">
                {/* Position list */}
                <div className="positionsList">
                    <h3>Налични позиции</h3>
                    {matches.map(({ position, match }) => (
                        <div
                            key={position.id}
                            className={`positionCard ${selectedPositionId === position.id ? 'selected' : ''}`}
                            onClick={() => setSelectedPositionId(position.id)}
                        >
                            <div className="positionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>{position.name}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className={`coverageBadge ${getCoverageColor(match.coveragePercent)}`}>
                                        {match.coveragePercent}%
                                    </div>
                                    {canManagePositions && (
                                        <button 
                                            className="button buttonSmall buttonGhost" 
                                            style={{ color: '#dc2626', padding: '0 4px' }}
                                            title="Изтрий"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm(`Сигурни ли сте, че искате да изтриете "${position.name}"?`)) {
                                                    onDeletePosition(position.id)
                                                    if (selectedPositionId === position.id) setSelectedPositionId(null)
                                                }
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                            {position.description && (
                                <p className="positionDesc">{position.description}</p>
                            )}
                            <div className="positionStats">
                                <span className="statGood">{match.matchedSkills.length} изпълнени</span>
                                <span className="statBad">{match.missingSkills.length} липсващи</span>
                            </div>
                            <div className="progressBar">
                                <div
                                    className={`progressFill ${getCoverageColor(match.coveragePercent)}`}
                                    style={{ width: `${match.coveragePercent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Position details */}
                <div className="positionDetails">
                    {selectedMatch ? (
                        <>
                            <h3>{selectedMatch.position.name}</h3>
                            <p className="muted">{selectedMatch.position.description}</p>

                            <div className="matchOverview">
                                <div className={`bigCoverage ${getCoverageColor(selectedMatch.match.coveragePercent)}`}>
                                    {selectedMatch.match.coveragePercent}%
                                    <span>покритие</span>
                                </div>
                            </div>

                            {/* Matched skills */}
                            {selectedMatch.match.matchedSkills.length > 0 && (
                                <div className="skillSection">
                                    <h4>Изпълнени изисквания</h4>
                                    <ul className="skillList matched">
                                        {selectedMatch.match.matchedSkills.map(ms => {
                                            const req = selectedMatch.position.requirements.find(r => r.skillId === ms.skillId)
                                            return (
                                                <li key={ms.skillId}>
                                                    <span className="skillName">{getSkillName(ms.skillId)}</span>
                                                    <span className="skillLevel">
                                                        Ниво {ms.level} / {req?.minLevel}
                                                        {req?.priority === 'required' ? ' (задължително)' : ' (по избор)'}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Missing skills */}
                            {selectedMatch.match.missingSkills.length > 0 && (
                                <div className="skillSection">
                                    <h4>Липсващи умения</h4>
                                    <ul className="skillList missing">
                                        {selectedMatch.match.missingSkills.map(ms => {
                                            const req = selectedMatch.position.requirements.find(r => r.skillId === ms.skillId)
                                            return (
                                                <li key={ms.skillId}>
                                                    <span className="skillName">{getSkillName(ms.skillId)}</span>
                                                    <span className="skillLevel">
                                                        Текущо: {ms.currentLevel} → Нужно: {ms.requiredLevel}
                                                        {req?.priority === 'required' ? ' (задължително)' : ' (по избор)'}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Recommended materials */}
                            {selectedMatch.match.missingSkills.length > 0 && (
                                <div className="recommendedSection">
                                    <h4>Препоръчани материали</h4>
                                    <div className="recommendedMaterials">
                                        {recommendedMaterials.length === 0 ? (
                                            <p className="muted">Няма налични материали за тези умения</p>
                                        ) : (
                                            recommendedMaterials.map(mat => (
                                                <div key={mat.id} className="materialCard mini">
                                                    <span className="materialType">{mat.type}</span>
                                                    <span className="materialTitle">{mat.title}</span>
                                                    {mat.url && (
                                                        <a href={mat.url} target="_blank" rel="noopener noreferrer">Линк</a>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="emptyState">
                            <div className="emptyIcon"></div>
                            <p>Избери позиция за детайли</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
