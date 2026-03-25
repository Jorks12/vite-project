import { useMemo, useState } from 'react'
import type { Skill, SkillCategory, UserProfile, UserRole } from '../domain/types'

type Props = {
    categories: SkillCategory[]
    skills: Skill[]
    userProfiles: UserProfile[]
    role: UserRole
    onUpdateUserRole: (userId: string, newRole: UserRole) => void
    onAddUser: (draft: Omit<UserProfile, 'id'>) => void
    onDeleteUser: (id: string) => void
}

export default function SearchPage({ categories, skills, userProfiles, role, onUpdateUserRole, onAddUser, onDeleteUser }: Props) {
    const [query, setQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [minLevel, setMinLevel] = useState(0)
    const [sort, setSort] = useState<'level' | 'endorsements' | 'active'>('level')
    
    const [isAddingUser, setIsAddingUser] = useState(false)
    const [newUserName, setNewUserName] = useState('')
    const [newUserRole, setNewUserRole] = useState<UserRole>('student')

    const skillById = useMemo(() => new Map(skills.map((s) => [s.id, s] as const)), [skills])

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()

        return userProfiles
            .filter((user) => {
                // Filter by skill name or user name
                if (q) {
                    const nameMatch = user.name.toLowerCase().includes(q)
                    const skillMatch = user.skills.some((us) => {
                        const skill = skillById.get(us.skillId)
                        return skill?.name.toLowerCase().includes(q)
                    })
                    if (!nameMatch && !skillMatch) return false
                }

                // Filter by category
                if (categoryFilter) {
                    const hasCategory = user.skills.some((us) => {
                        const skill = skillById.get(us.skillId)
                        return skill?.categoryId === categoryFilter
                    })
                    if (!hasCategory) return false
                }

                // Filter by minimum level
                if (minLevel > 0) {
                    const hasLevel = user.skills.some((us) => us.level >= minLevel)
                    if (!hasLevel) return false
                }

                return true
            })
            .sort((a, b) => {
                if (sort === 'level') {
                    const maxA = Math.max(...a.skills.map((s) => s.level), 0)
                    const maxB = Math.max(...b.skills.map((s) => s.level), 0)
                    return maxB - maxA
                }
                if (sort === 'endorsements') {
                    const sumA = a.skills.reduce((acc, s) => acc + s.endorsementCount, 0)
                    const sumB = b.skills.reduce((acc, s) => acc + s.endorsementCount, 0)
                    return sumB - sumA
                }
                // active
                return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0)
            })
    }, [query, categoryFilter, minLevel, sort, userProfiles, skillById])

    return (
        <div className="page">
            <h2>Търсачка по умения и потребители</h2>
            <p className="muted">
                Търси потребители по име, умение, категория или ниво.
            </p>

            {role === 'admin' && (
                <div style={{ marginBottom: 16 }}>
                    <button className="button" onClick={() => setIsAddingUser(!isAddingUser)}>
                        {isAddingUser ? 'Отказ' : '+ Добави потребител'}
                    </button>
                </div>
            )}

            {role === 'admin' && isAddingUser && (
                <div className="card addForm" style={{ marginBottom: 24 }}>
                    <h3>Нов потребител</h3>
                    <div className="formGrid">
                        <div className="formField">
                            <label>Име</label>
                            <input className="input" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Напр. Георги Георгиев" />
                        </div>
                        <div className="formField">
                            <label>Роля</label>
                            <select className="select" value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)}>
                                <option value="student">Ученик</option>
                                <option value="mentor">Ментор</option>
                                <option value="admin">Администратор</option>
                            </select>
                        </div>
                    </div>
                    <button className="button buttonPrimary" disabled={!newUserName.trim()} onClick={() => {
                        onAddUser({ name: newUserName.trim(), role: newUserRole, skills: [], isActive: true })
                        setNewUserName(''); setNewUserRole('student'); setIsAddingUser(false);
                    }}>
                        Запази потребител
                    </button>
                </div>
            )}

            <section className="panel">
                <h3>Филтри</h3>
                <div className="formGrid">
                    <label className="field">
                        <span className="label">Търси (име/умение)</span>
                        <input
                            className="input"
                            placeholder="напр. React, Иван..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </label>

                    <label className="field">
                        <span className="label">Категория</span>
                        <select
                            className="select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">Всички</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span className="label">Минимално ниво</span>
                        <select
                            className="select"
                            value={minLevel}
                            onChange={(e) => setMinLevel(Number(e.target.value))}
                        >
                            <option value={0}>Всички</option>
                            <option value={1}>≥ 1</option>
                            <option value={2}>≥ 2</option>
                            <option value={3}>≥ 3</option>
                            <option value={4}>≥ 4</option>
                            <option value={5}>= 5</option>
                        </select>
                    </label>

                    <label className="field">
                        <span className="label">Сортиране</span>
                        <select
                            className="select"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as 'level' | 'endorsements' | 'active')}
                        >
                            <option value="level">Най-високо ниво</option>
                            <option value="endorsements">Най-много потвърждения</option>
                            <option value="active">Най-активни</option>
                        </select>
                    </label>
                </div>
            </section>

            <section className="panel">
                <h3>Резултати ({results.length})</h3>
                <div className="list">
                    {results.map((user) => (
                        <div key={user.id} className="row">
                            <div className="rowMain">
                                <div className="rowTitle">
                                    {user.name}
                                    {role === 'admin' ? (
                                        <select 
                                            className="select" 
                                            style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12, height: 'auto', display: 'inline-block', width: 'auto' }}
                                            value={user.role} 
                                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                                        >
                                            <option value="student">Ученик</option>
                                            <option value="mentor">Ментор</option>
                                            <option value="admin">Администратор</option>
                                        </select>
                                    ) : (
                                        <span className="badge" style={{ marginLeft: 8 }}>
                                            {user.role === 'student' ? 'Ученик' : user.role === 'mentor' ? 'Ментор' : 'Администратор'}
                                        </span>
                                    )}
                                    {user.isActive && (
                                        <span className="badge badgeSuccess" style={{ marginLeft: 4 }}>
                                            Активен
                                        </span>
                                    )}
                                    {role === 'admin' && (
                                        <button 
                                            className="button buttonSmall buttonGhost" 
                                            style={{ color: '#dc2626', marginLeft: 'auto' }}
                                            onClick={() => {
                                                if (confirm(`Сигурни ли сте, че искате да изтриете потребител "${user.name}"?`)) {
                                                    onDeleteUser(user.id)
                                                }
                                            }}
                                            title="Изтрий потребителя"
                                        >
                                            Изтрий
                                        </button>
                                    )}
                                </div>
                                {user.bio && <div className="rowSub muted">{user.bio}</div>}
                                <div className="chips" style={{ marginTop: 6 }}>
                                    {user.skills.map((us) => {
                                        const skill = skillById.get(us.skillId)
                                        if (!skill) return null
                                        return (
                                            <span key={us.skillId} className="chip">
                                                {skill.name}: ниво {us.level}
                                                {us.endorsementCount > 0 && ` (${us.endorsementCount} потв.)`}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && (
                        <div className="muted">Няма намерени потребители с тези критерии.</div>
                    )}
                </div>
            </section>
        </div>
    )
}
