import { useMemo } from 'react'
import type { Skill, UserProfile, LearningMaterial, SkillEndorsement, Position } from '../domain/types'

type Props = {
  users: UserProfile[]
  skills: Skill[]
  materials: LearningMaterial[]
  endorsements: SkillEndorsement[]
  positions: Position[]
}

export default function StatisticsPage({ users, skills, materials, endorsements, positions }: Props) {
  const stats = useMemo(() => {
    const students = users.filter((u) => u.role === 'student').length
    const mentors = users.filter((u) => u.role === 'mentor').length
    const admins = users.filter((u) => u.role === 'admin').length

    const pendingEndorsements = endorsements.filter((e) => e.status === 'pending').length
    const confirmedEndorsements = endorsements.filter((e) => e.status === 'confirmed').length
    
    // Top skills by total levels or by endorsement count
    // For simplicity, count how many users have each skill
    const skillCounts: Record<string, number> = {}
    for (const u of users) {
      for (const s of u.skills) {
        if (s.level > 0) {
          skillCounts[s.skillId] = (skillCounts[s.skillId] || 0) + 1
        }
      }
    }
    
    const topSkills = Object.entries(skillCounts)
      .map(([skillId, count]) => {
        const skill = skills.find((s) => s.id === skillId)
        return { name: skill?.name || skillId, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalUsers: users.length,
      students,
      mentors,
      admins,
      totalSkills: skills.length,
      totalMaterials: materials.length,
      totalPositions: positions.length,
      pendingEndorsements,
      confirmedEndorsements,
      topSkills,
    }
  }, [users, skills, materials, endorsements, positions])

  return (
    <div className="page" style={{ animation: 'fadeSlideUp 0.3s ease-out forwards' }}>
      <header className="pageHeader">
        <h2 className="pageTitle">Статистика</h2>
        <p className="pageSubtitle">Табло за управление с ключови показатели за платформата</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="panel" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--c-blue-500)' }}>{stats.totalUsers}</div>
          <div className="muted" style={{ marginTop: '8px' }}>Потребители</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', fontSize: '12px' }}>
            <span title="Ученици">👨‍🎓 {stats.students}</span>
            <span title="Ментори">👨‍🏫 {stats.mentors}</span>
            <span title="Админи">🛡️ {stats.admins}</span>
          </div>
        </div>
        
        <div className="panel" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--c-purple-500)' }}>{stats.totalSkills}</div>
          <div className="muted" style={{ marginTop: '8px' }}>Общо Умения</div>
        </div>

        <div className="panel" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--c-green-500)' }}>{stats.totalMaterials}</div>
          <div className="muted" style={{ marginTop: '8px' }}>Материали</div>
        </div>
        
        <div className="panel" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--c-orange-500)' }}>{stats.totalPositions}</div>
          <div className="muted" style={{ marginTop: '8px' }}>Възможни Позиции</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        <section className="panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--c-pink-500)' }}>⭐</span> Топ умения в платформата
          </h3>
          <div className="list">
            {stats.topSkills.map((s, idx) => (
              <div key={idx} className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{s.name}</span>
                <span className="badge">{s.count} потребители</span>
              </div>
            ))}
            {stats.topSkills.length === 0 && (
              <div className="muted">Няма данни за умения</div>
            )}
          </div>
        </section>

        <section className="panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--c-teal-500)' }}>✅</span> Потвърждения на умения
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--c-bg-hover)', borderRadius: 'var(--radius-md)' }}>
              <span>Одобрени</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--c-green-500)' }}>{stats.confirmedEndorsements}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--c-bg-hover)', borderRadius: 'var(--radius-md)' }}>
              <span>Чакащи преглед</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--c-orange-500)' }}>{stats.pendingEndorsements}</span>
            </div>
            <div className="muted small" style={{ marginTop: '8px' }}>
              Общо {stats.confirmedEndorsements + stats.pendingEndorsements} заявки за потвърждение на умения.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
