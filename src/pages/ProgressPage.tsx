import { useMemo, useState } from 'react'
import type { ProgressEvent, Skill, SkillCategory, UserSkillLevel } from '../domain/types'

type Props = {
    skills: Skill[]
    categories: SkillCategory[]
    userLevels: UserSkillLevel[]
    progressEvents: ProgressEvent[]
}

type PeriodFilter = 'all' | 'week' | 'month' | 'year'

const eventTypeLabels: Record<ProgressEvent['type'], { icon: string; label: string }> = {
    skill_added: { icon: '+', label: 'Ново умение' },
    level_up: { icon: '↑', label: 'Повишаване на ниво' },
    level_down: { icon: '↓', label: 'Понижаване на ниво' },
    evidence_added: { icon: '▪', label: 'Добавено доказателство' },
    endorsement_received: { icon: '✓', label: 'Получено потвърждение' },
    project_added: { icon: '▪', label: 'Добавен проект' },
    certificate_added: { icon: '▪', label: 'Добавен сертификат' },
}

export default function ProgressPage({ skills, categories, userLevels, progressEvents }: Props) {
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
    const [viewMode, setViewMode] = useState<'timeline' | 'categories'>('timeline')


    const filteredEvents = useMemo(() => {
        if (periodFilter === 'all') return progressEvents

        const now = new Date()
        let cutoff = new Date()

        switch (periodFilter) {
            case 'week':
                cutoff.setDate(now.getDate() - 7)
                break
            case 'month':
                cutoff.setMonth(now.getMonth() - 1)
                break
            case 'year':
                cutoff.setFullYear(now.getFullYear() - 1)
                break
        }

        return progressEvents.filter(e => new Date(e.createdAt) >= cutoff)
    }, [progressEvents, periodFilter])

    // Group events by date
    const eventsByDate = useMemo(() => {
        const map = new Map<string, ProgressEvent[]>()
        for (const event of filteredEvents) {
            const dateKey = new Date(event.createdAt).toLocaleDateString('bg-BG')
            const arr = map.get(dateKey) || []
            arr.push(event)
            map.set(dateKey, arr)
        }
        return Array.from(map.entries())
    }, [filteredEvents])

    // Category progress calculation
    const categoryProgress = useMemo(() => {
        const result: { categoryId: string; name: string; count: number; avgLevel: number; totalPoints: number }[] = []

        for (const category of categories) {
            const categorySkills = skills.filter(s => s.categoryId === category.id)
            const userCategoryLevels = userLevels.filter(ul =>
                categorySkills.some(cs => cs.id === ul.skillId) && ul.level > 0
            )

            if (categorySkills.length === 0) continue

            const totalPoints = userCategoryLevels.reduce((sum, ul) => sum + ul.level, 0)
            const avgLevel = userCategoryLevels.length > 0
                ? Math.round((totalPoints / userCategoryLevels.length) * 10) / 10
                : 0

            result.push({
                categoryId: category.id,
                name: category.name,
                count: userCategoryLevels.length,
                avgLevel,
                totalPoints,
            })
        }

        return result.sort((a, b) => b.totalPoints - a.totalPoints)
    }, [categories, skills, userLevels])

    // Development index calculation
    const developmentIndex = useMemo(() => {
        const totalSkills = skills.length
        const learnedSkills = userLevels.filter(ul => ul.level > 0).length
        const totalPoints = userLevels.reduce((sum, ul) => sum + ul.level, 0)
        const maxPossiblePoints = totalSkills * 5

        const coverageScore = totalSkills > 0 ? (learnedSkills / totalSkills) * 100 : 0
        const depthScore = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0
        const overallIndex = Math.round((coverageScore * 0.4 + depthScore * 0.6))

        return {
            learnedSkills,
            totalSkills,
            totalPoints,
            maxPossiblePoints,
            coverageScore: Math.round(coverageScore),
            depthScore: Math.round(depthScore),
            overallIndex,
        }
    }, [skills, userLevels])

    return (
        <div className="page">
            <div className="pageHeader">
                <div>
                    <h1 className="pageTitle">Прогрес и развитие</h1>
                    <p className="muted">Следете историята на вашето развитие</p>
                </div>
                <div className="viewToggle">
                    <button
                        className={`toggleBtn ${viewMode === 'timeline' ? 'active' : ''}`}
                        onClick={() => setViewMode('timeline')}
                    >
                        Timeline
                    </button>
                    <button
                        className={`toggleBtn ${viewMode === 'categories' ? 'active' : ''}`}
                        onClick={() => setViewMode('categories')}
                    >
                        Категории
                    </button>
                </div>
            </div>

            {/* Development Index */}
            <div className="devIndexCard">
                <h3>Индекс на развитие</h3>
                <div className="indexGrid">
                    <div className="indexItem">
                        <div className="indexValue big">{developmentIndex.overallIndex}%</div>
                        <div className="indexLabel">Общ индекс</div>
                    </div>
                    <div className="indexItem">
                        <div className="indexValue">{developmentIndex.learnedSkills}/{developmentIndex.totalSkills}</div>
                        <div className="indexLabel">Научени умения</div>
                    </div>
                    <div className="indexItem">
                        <div className="indexValue">{developmentIndex.coverageScore}%</div>
                        <div className="indexLabel">Покритие</div>
                    </div>
                    <div className="indexItem">
                        <div className="indexValue">{developmentIndex.depthScore}%</div>
                        <div className="indexLabel">Дълбочина</div>
                    </div>
                    <div className="indexItem">
                        <div className="indexValue">{developmentIndex.totalPoints}</div>
                        <div className="indexLabel">Общо точки</div>
                    </div>
                </div>
            </div>

            {/* Period filter */}
            <div className="filterBar">
                <label>Период:</label>
                <div className="periodButtons">
                    <button
                        className={`periodBtn ${periodFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setPeriodFilter('all')}
                    >
                        Всички
                    </button>
                    <button
                        className={`periodBtn ${periodFilter === 'week' ? 'active' : ''}`}
                        onClick={() => setPeriodFilter('week')}
                    >
                        Седмица
                    </button>
                    <button
                        className={`periodBtn ${periodFilter === 'month' ? 'active' : ''}`}
                        onClick={() => setPeriodFilter('month')}
                    >
                        Месец
                    </button>
                    <button
                        className={`periodBtn ${periodFilter === 'year' ? 'active' : ''}`}
                        onClick={() => setPeriodFilter('year')}
                    >
                        Година
                    </button>
                </div>
            </div>

            {viewMode === 'timeline' ? (
                /* Timeline View */
                <div className="timelineSection">
                    <h3>История на промените ({filteredEvents.length} събития)</h3>
                    {filteredEvents.length === 0 ? (
                        <div className="emptyState">
                            <div className="emptyIcon"></div>
                            <p>Няма събития за избрания период</p>
                            <p className="muted small">Започнете да добавяте умения, за да виждате прогреса си</p>
                        </div>
                    ) : (
                        <div className="timeline">
                            {eventsByDate.map(([dateKey, events]) => (
                                <div key={dateKey} className="timelineDay">
                                    <div className="timelineDate">{dateKey}</div>
                                    <div className="timelineEvents">
                                        {events.map(event => (
                                            <div key={event.id} className={`timelineEvent ${event.type}`}>
                                                <span className="eventIcon">
                                                    {eventTypeLabels[event.type]?.icon || '▪'}
                                                </span>
                                                <div className="eventContent">
                                                    <span className="eventType">{eventTypeLabels[event.type]?.label}</span>
                                                    <span className="eventDesc">{event.description}</span>
                                                    {event.oldValue !== undefined && event.newValue !== undefined && (
                                                        <span className="eventChange">
                                                            {event.oldValue} → {event.newValue}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="eventTime">
                                                    {new Date(event.createdAt).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Categories View */
                <div className="categoriesSection">
                    <h3>Прогрес по категории</h3>
                    {categoryProgress.length === 0 ? (
                        <div className="emptyState">
                            <div className="emptyIcon"></div>
                            <p>Няма данни за категории</p>
                        </div>
                    ) : (
                        <div className="categoryTable">
                            <div className="categoryHeader">
                                <span>Категория</span>
                                <span>Умения</span>
                                <span>Средно ниво</span>
                                <span>Точки</span>
                                <span>Прогрес</span>
                            </div>
                            {categoryProgress.map(cat => (
                                <div key={cat.categoryId} className="categoryRow">
                                    <span className="catName">{cat.name}</span>
                                    <span className="catCount">{cat.count}</span>
                                    <span className="catAvg">{cat.avgLevel}</span>
                                    <span className="catPoints">{cat.totalPoints}</span>
                                    <div className="catProgressBar">
                                        <div
                                            className="catProgressFill"
                                            style={{ width: `${Math.min(cat.avgLevel * 20, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
