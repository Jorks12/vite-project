import { useEffect, useState } from 'react'
import { addFeedback, deleteFeedback, getFeedback, replyToFeedback, type FeedbackEntry } from '../data/storage'
import { useAuth } from '../context/AuthContext'

type FeedbackType = 'bug' | 'feature' | 'question' | 'other'

const feedbackLabels: Record<FeedbackType, string> = {
    bug: 'Бъг / Проблем',
    feature: 'Предложение',
    question: 'Въпрос',
    other: 'Друго',
}

export default function ContactPage() {
    const { role } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [type, setType] = useState<FeedbackType>('question')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [entries, setEntries] = useState<FeedbackEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')

    useEffect(() => {
        getFeedback().then((data) => {
            setEntries(data)
            setLoading(false)
        })
    }, [])

    async function handleSubmit() {
        setError('')
        setSuccess('')

        if (!name.trim()) {
            setError('Моля, въведете вашето име.')
            return
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Моля, въведете валиден имейл адрес.')
            return
        }
        if (!subject.trim()) {
            setError('Моля, въведете тема.')
            return
        }
        if (!message.trim()) {
            setError('Моля, въведете съобщение.')
            return
        }

        const entry = await addFeedback({
            name: name.trim(),
            email: email.trim(),
            type,
            subject: subject.trim(),
            message: message.trim(),
        })

        setEntries((prev) => [entry, ...prev])

        setName('')
        setEmail('')
        setType('question')
        setSubject('')
        setMessage('')
        setSuccess('Съобщението е изпратено успешно! Благодарим за обратната връзка.')
        setTimeout(() => setSuccess(''), 5000)
    }

    async function handleDelete(id: string) {
        await deleteFeedback(id)
        setEntries((prev) => prev.filter((e) => e.id !== id))
    }

    async function handleReply(id: string) {
        if (!replyText.trim()) return
        const updated = await replyToFeedback(id, replyText.trim())
        if (updated) {
            setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
        }
        setReplyingTo(null)
        setReplyText('')
    }

    return (
        <div className="page">
            <div className="pageHeader">
                <div>
                    <h1 className="pageTitle">{role === 'admin' ? 'Обратна връзка' : 'Контакти и обратна връзка'}</h1>
                    <p className="muted">
                        {role === 'admin' 
                            ? 'Изпратете или прегледайте обратна връзка.'
                            : 'Имате въпрос, предложение или сте открили проблем? Пишете ни!'}
                    </p>
                </div>
            </div>

            {/* Contact info cards */}
            {role !== 'admin' && (
                <div className="contactCards">
                    <div className="contactCard">
                        <div className="contactCardIcon"></div>
                        <div className="contactCardContent">
                            <h4>Имейл</h4>
                            <p>support@skillmatrix.bg</p>
                        </div>
                    </div>
                    <div className="contactCard">
                        <div className="contactCardIcon"></div>
                        <div className="contactCardContent">
                            <h4>Телефон</h4>
                            <p>+359 88 123 4567</p>
                        </div>
                    </div>
                    <div className="contactCard">
                        <div className="contactCardIcon"></div>
                        <div className="contactCardContent">
                            <h4>Адрес</h4>
                            <p>бул. „Витоша" 100, София</p>
                        </div>
                    </div>
                    <div className="contactCard">
                        <div className="contactCardIcon"></div>
                        <div className="contactCardContent">
                            <h4>Работно време</h4>
                            <p>Пон–Пет: 09:00–18:00</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback form */}
            {role !== 'admin' && (
                <div className="card addForm">
                    <h3>Изпратете съобщение</h3>
                    <div className="formGrid">
                        <div className="formField">
                            <label>Вашето име</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Иван Иванов"
                            />
                        </div>
                        <div className="formField">
                            <label>Имейл адрес</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ivan@example.com"
                            />
                        </div>
                        <div className="formField">
                            <label>Тип обратна връзка</label>
                            <select
                                className="select"
                                value={type}
                                onChange={(e) => setType(e.target.value as FeedbackType)}
                            >
                                {Object.entries(feedbackLabels).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="formField">
                            <label>Тема</label>
                            <input
                                type="text"
                                className="input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Кратко описание..."
                            />
                        </div>
                        <div className="formField fullWidth">
                            <label>Съобщение</label>
                            <textarea
                                className="textarea"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Опишете подробно вашия въпрос, предложение или проблем..."
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>
                    {error && <div className="errorMsg">{error}</div>}
                    {success && <div className="successMsg">{success}</div>}
                    <button className="button buttonPrimary" onClick={handleSubmit}>
                        Изпрати съобщение
                    </button>
                </div>
            )}

            {/* Previous feedback */}
            {role === 'admin' && (
                loading ? (
                    <div className="emptyState">
                        <div className="emptyIcon"></div>
                        <p>Зареждане на съобщения...</p>
                    </div>
                ) : entries.length > 0 ? (
                    <section className="panel">
                        <h3>Получени съобщения ({entries.length})</h3>
                        <div className="list">
                            {entries.map((entry) => (
                                <div key={entry.id} className="feedbackEntry">
                                    <div className="feedbackEntryHeader">
                                        <div className="feedbackEntryMeta">
                                            <span className="feedbackEntryType">
                                                {feedbackLabels[entry.type]}
                                            </span>
                                            <span className="feedbackEntryDate">
                                                {new Date(entry.createdAt).toLocaleDateString('bg-BG', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="button buttonSmall buttonGhost"
                                                onClick={() => {
                                                    setReplyingTo(replyingTo === entry.id ? null : entry.id)
                                                    setReplyText(entry.adminReply || '')
                                                }}
                                                title={entry.adminReply ? 'Редактирай отговор' : 'Отговори'}
                                            >
                                                {entry.adminReply ? 'Редактирай' : 'Отговори'}
                                            </button>
                                            <button
                                                className="button buttonSmall buttonGhost"
                                                onClick={() => handleDelete(entry.id)}
                                                title="Изтрий"
                                            >
                                                Изтрий
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="feedbackEntrySubject">{entry.subject}</h4>
                                    <p className="feedbackEntryMessage">{entry.message}</p>
                                    <div className="feedbackEntrySender muted small">
                                        От: {entry.name} ({entry.email})
                                    </div>

                                    {/* Show existing admin reply */}
                                    {entry.adminReply && replyingTo !== entry.id && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(var(--color-success), 0.08)',
                                            borderLeft: '3px solid rgb(var(--color-success))',
                                            borderRadius: '0.375rem',
                                        }}>
                                            <div className="muted small" style={{ marginBottom: '0.25rem' }}>
                                                Отговор от админ • {entry.adminRepliedAt && new Date(entry.adminRepliedAt).toLocaleDateString('bg-BG', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                            <p style={{ margin: 0 }}>{entry.adminReply}</p>
                                        </div>
                                    )}

                                    {/* Reply form */}
                                    {replyingTo === entry.id && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <textarea
                                                className="textarea"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Напишете отговор..."
                                                rows={3}
                                                style={{ resize: 'vertical', width: '100%' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button
                                                    className="button buttonPrimary buttonSmall"
                                                    onClick={() => handleReply(entry.id)}
                                                >
                                                    Изпрати отговор
                                                </button>
                                                <button
                                                    className="button buttonSmall buttonGhost"
                                                    onClick={() => { setReplyingTo(null); setReplyText('') }}
                                                >
                                                    Отказ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="emptyState">
                        <div className="emptyIcon"></div>
                        <p>Няма получени съобщения.</p>
                    </div>
                )
            )}
        </div>
    )
}

