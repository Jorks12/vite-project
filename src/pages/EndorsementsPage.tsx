import { useMemo, useState } from 'react'
import type { Skill, SkillEndorsement } from '../domain/types'

type Props = {
    skills: Skill[]
    endorsements: SkillEndorsement[]
    onUpdate: (id: string, status: SkillEndorsement['status'], comment?: string, whatChecked?: string, improvements?: string, nextSteps?: string) => void
}

const statusLabels: Record<SkillEndorsement['status'], string> = {
    unconfirmed: 'Непотвърдено',
    pending: 'Очаква потвърждение',
    confirmed: 'Потвърдено',
    returned: 'Върнато за доказателство',
}

const statusColors: Record<SkillEndorsement['status'], string> = {
    unconfirmed: '',
    pending: 'badgeWarning',
    confirmed: 'badgeSuccess',
    returned: 'badgeDanger',
}

export default function EndorsementsPage({ skills, endorsements, onUpdate }: Props) {
    const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s] as const)), [skills])

    const [editingId, setEditingId] = useState<string | null>(null)
    const [comment, setComment] = useState('')
    const [whatChecked, setWhatChecked] = useState('')
    const [improvements, setImprovements] = useState('')
    const [nextSteps, setNextSteps] = useState('')

    const pendingEndorsements = endorsements.filter((e) => e.status === 'pending')
    const otherEndorsements = endorsements.filter((e) => e.status !== 'pending')

    function startEdit(e: SkillEndorsement) {
        setEditingId(e.id)
        setComment(e.comment ?? '')
        setWhatChecked(e.whatChecked ?? '')
        setImprovements(e.improvements ?? '')
        setNextSteps(e.nextSteps ?? '')
    }

    function handleAction(id: string, status: SkillEndorsement['status']) {
        onUpdate(id, status, comment, whatChecked, improvements, nextSteps)
        setEditingId(null)
        setComment('')
        setWhatChecked('')
        setImprovements('')
        setNextSteps('')
    }

    function renderEndorsement(e: SkillEndorsement) {
        const skill = skillById.get(e.skillId)
        const isEditing = editingId === e.id

        return (
            <div key={e.id} className="row">
                <div className="rowMain">
                    <div className="rowTitle">
                        {skill?.name ?? e.skillId}
                        <span className={`badge ${statusColors[e.status]}`} style={{ marginLeft: 8 }}>
                            {statusLabels[e.status]}
                        </span>
                    </div>
                    <div className="rowSub muted small">
                        Заявено: {new Date(e.createdAt).toLocaleDateString('bg-BG')}
                        {e.mentorName && ` • Ментор: ${e.mentorName}`}
                    </div>

                    {e.comment && !isEditing && (
                        <div className="rowSub" style={{ marginTop: 4 }}>
                            <strong>Коментар:</strong> {e.comment}
                        </div>
                    )}

                    {isEditing && (
                        <div className="endorsementForm" style={{ marginTop: 10 }}>
                            <label className="field">
                                <span className="label">Какво е проверено</span>
                                <input
                                    className="input"
                                    value={whatChecked}
                                    onChange={(ev) => setWhatChecked(ev.target.value)}
                                    placeholder="напр. Практическа задача, код преглед..."
                                />
                            </label>
                            <label className="field">
                                <span className="label">Препоръка за подобрение</span>
                                <input
                                    className="input"
                                    value={improvements}
                                    onChange={(ev) => setImprovements(ev.target.value)}
                                    placeholder="напр. Да упражни advanced patterns..."
                                />
                            </label>
                            <label className="field">
                                <span className="label">Бележки за следваща стъпка</span>
                                <input
                                    className="input"
                                    value={nextSteps}
                                    onChange={(ev) => setNextSteps(ev.target.value)}
                                    placeholder="напр. Следващо ниво след 1 месец..."
                                />
                            </label>
                            <label className="field fieldFull">
                                <span className="label">Общ коментар</span>
                                <textarea
                                    className="textarea"
                                    rows={2}
                                    value={comment}
                                    onChange={(ev) => setComment(ev.target.value)}
                                    placeholder="Допълнителни бележки..."
                                />
                            </label>
                        </div>
                    )}
                </div>

                <div className="rowRight" style={{ flexDirection: 'column', gap: 6 }}>
                    {e.status === 'pending' && !isEditing && (
                        <button className="button primary" onClick={() => startEdit(e)}>
                            Редактирай
                        </button>
                    )}
                    {isEditing && (
                        <>
                            <button
                                className="button primary"
                                onClick={() => handleAction(e.id, 'confirmed')}
                            >
                                ✓ Потвърди
                            </button>
                            <button
                                className="button danger"
                                onClick={() => handleAction(e.id, 'returned')}
                            >
                                ↩ Върни
                            </button>
                            <button className="button" onClick={() => setEditingId(null)}>
                                Отказ
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <h2>Потвърждения на умения</h2>
            <p className="muted">
                Преглед и потвърждение на умения от ментор/учител.
            </p>

            <section className="panel">
                <h3>Чакащи потвърждение ({pendingEndorsements.length})</h3>
                <div className="list">
                    {pendingEndorsements.map(renderEndorsement)}
                    {pendingEndorsements.length === 0 && (
                        <div className="muted">Няма чакащи заявки за потвърждение.</div>
                    )}
                </div>
            </section>

            {otherEndorsements.length > 0 && (
                <section className="panel">
                    <h3>История</h3>
                    <div className="list">
                        {otherEndorsements.map(renderEndorsement)}
                    </div>
                </section>
            )}
        </div>
    )
}
