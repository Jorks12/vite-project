import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../domain/types'

type AuthMode = 'login' | 'register'

const ROLE_OPTIONS: { value: UserRole; label: string; icon: string; desc: string }[] = [
    { value: 'student', label: 'Ученик', icon: '', desc: 'Проследявай умения и прогрес' },
    { value: 'mentor', label: 'Ментор', icon: '', desc: 'Потвърждавай умения и давай обратна връзка' },
]

function validateEmail(email: string): string | null {
    if (!email) return 'Имейлът е задължителен'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Невалиден имейл адрес'
    return null
}

function validatePassword(password: string): string | null {
    if (!password) return 'Паролата е задължителна'
    if (password.length < 6) return 'Паролата трябва да е поне 6 символа'
    return null
}

export default function AuthPage() {
    const { signIn, signUp, resetPassword } = useAuth()
    const [mode, setMode] = useState<AuthMode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [selectedRole, setSelectedRole] = useState<UserRole>('student')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [serverError, setServerError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showForgot, setShowForgot] = useState(false)

    function clearState() {
        setErrors({})
        setServerError('')
        setSuccessMsg('')
    }

    function switchMode(m: AuthMode) {
        setMode(m)
        clearState()
        setPassword('')
        setConfirmPassword('')
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        clearState()

        const newErrors: Record<string, string> = {}
        const emailErr = validateEmail(email)
        if (emailErr) newErrors.email = emailErr
        const passErr = validatePassword(password)
        if (passErr) newErrors.password = passErr

        if (mode === 'register') {
            if (!confirmPassword) {
                newErrors.confirmPassword = 'Потвърдете паролата'
            } else if (password !== confirmPassword) {
                newErrors.confirmPassword = 'Паролите не съвпадат'
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setSubmitting(true)
        try {
            if (mode === 'login') {
                const { error } = await signIn(email, password)
                if (error) setServerError(translateError(error.message))
            } else {
                const { error } = await signUp(email, password, displayName || undefined, selectedRole)
                if (error) {
                    setServerError(translateError(error.message))
                } else {
                    setSuccessMsg('Регистрацията е успешна! Проверете имейла си за потвърждение.')
                }
            }
        } catch {
            setServerError('Възникна неочаквана грешка. Моля, опитайте отново.')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleForgotPassword(e: FormEvent) {
        e.preventDefault()
        clearState()
        const emailErr = validateEmail(email)
        if (emailErr) {
            setErrors({ email: emailErr })
            return
        }
        setSubmitting(true)
        try {
            const { error } = await resetPassword(email)
            if (error) {
                setServerError(translateError(error.message))
            } else {
                setSuccessMsg('Линк за нулиране на паролата е изпратен на имейла ви.')
                setShowForgot(false)
            }
        } catch {
            setServerError('Грешка при изпращане. Опитайте отново.')
        } finally {
            setSubmitting(false)
        }
    }

    function translateError(msg: string): string {
        if (msg.includes('Invalid login credentials')) return 'Грешен имейл или парола'
        if (msg.includes('User already registered')) return 'Потребител с този имейл вече съществува'
        if (msg.includes('Email not confirmed')) return 'Имейлът не е потвърден. Проверете пощата си.'
        if (msg.includes('rate limit')) return 'Твърде много опити. Изчакайте малко.'
        return msg
    }

    return (
        <div className="authPage">
            {/* Decorative orbs */}
            <div className="authOrb authOrb1" />
            <div className="authOrb authOrb2" />
            <div className="authOrb authOrb3" />

            <div className="authCard">
                <div className="authLogo">
                    <span className="authLogoIcon"></span>
                    <span className="authLogoText">Skill Matrix</span>
                </div>

                {!showForgot ? (
                    <>
                        <div className="authTabs">
                            <button
                                className={`authTab ${mode === 'login' ? 'authTabActive' : ''}`}
                                onClick={() => switchMode('login')}
                                type="button"
                            >
                                Вход
                            </button>
                            <button
                                className={`authTab ${mode === 'register' ? 'authTabActive' : ''}`}
                                onClick={() => switchMode('register')}
                                type="button"
                            >
                                Регистрация
                            </button>
                        </div>

                        <form className="authForm" onSubmit={handleSubmit} noValidate>
                            {mode === 'register' && (
                                <div className="authField">
                                    <label className="authLabel" htmlFor="auth-name">
                                        Име (по избор)
                                    </label>
                                    <input
                                        id="auth-name"
                                        className="authInput"
                                        type="text"
                                        placeholder="Вашето име"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        autoComplete="name"
                                    />
                                </div>
                            )}

                            <div className="authField">
                                <label className="authLabel" htmlFor="auth-email">
                                    Имейл
                                </label>
                                <input
                                    id="auth-email"
                                    className={`authInput ${errors.email ? 'authInputError' : ''}`}
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (errors.email) setErrors((p) => ({ ...p, email: '' }))
                                    }}
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <span className="authErrorMsg">{errors.email}</span>}
                            </div>

                            <div className="authField">
                                <label className="authLabel" htmlFor="auth-password">
                                    Парола
                                </label>
                                <input
                                    id="auth-password"
                                    className={`authInput ${errors.password ? 'authInputError' : ''}`}
                                    type="password"
                                    placeholder="Минимум 6 символа"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        if (errors.password) setErrors((p) => ({ ...p, password: '' }))
                                    }}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    required
                                />
                                {errors.password && <span className="authErrorMsg">{errors.password}</span>}
                            </div>

                            {mode === 'register' && (
                                <div className="authField">
                                    <label className="authLabel" htmlFor="auth-confirm">
                                        Потвърди парола
                                    </label>
                                    <input
                                        id="auth-confirm"
                                        className={`authInput ${errors.confirmPassword ? 'authInputError' : ''}`}
                                        type="password"
                                        placeholder="Повторете паролата"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value)
                                            if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }))
                                        }}
                                        autoComplete="new-password"
                                        required
                                    />
                                    {errors.confirmPassword && (
                                        <span className="authErrorMsg">{errors.confirmPassword}</span>
                                    )}
                                </div>
                            )}

                            {/* Role selector — only on register */}
                            {mode === 'register' && (
                                <div className="authField">
                                    <label className="authLabel">
                                        Роля
                                    </label>
                                    <div className="authRoleSelector">
                                        {ROLE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                className={`authRoleOption ${selectedRole === opt.value ? 'authRoleOptionActive' : ''}`}
                                                onClick={() => setSelectedRole(opt.value)}
                                            >
                                                <span className="authRoleIcon">{opt.icon}</span>
                                                <span className="authRoleLabel">{opt.label}</span>
                                                <span className="authRoleDesc">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {serverError && (
                                <div className="authAlert authAlertError">
                                    {serverError}
                                </div>
                            )}

                            {successMsg && (
                                <div className="authAlert authAlertSuccess">
                                    {successMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="authSubmit"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span className="authSpinner" />
                                ) : mode === 'login' ? (
                                    'Влез'
                                ) : (
                                    'Регистрирай се'
                                )}
                            </button>

                            {mode === 'login' && (
                                <button
                                    type="button"
                                    className="authForgotLink"
                                    onClick={() => {
                                        clearState()
                                        setShowForgot(true)
                                    }}
                                >
                                    Забравена парола?
                                </button>
                            )}
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="authTitle">Нулиране на парола</h2>
                        <p className="authSubtitle">
                            Въведете имейла си и ще ви изпратим линк за нулиране.
                        </p>
                        <form className="authForm" onSubmit={handleForgotPassword} noValidate>
                            <div className="authField">
                                <label className="authLabel" htmlFor="auth-reset-email">
                                    Имейл
                                </label>
                                <input
                                    id="auth-reset-email"
                                    className={`authInput ${errors.email ? 'authInputError' : ''}`}
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (errors.email) setErrors((p) => ({ ...p, email: '' }))
                                    }}
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <span className="authErrorMsg">{errors.email}</span>}
                            </div>

                            {serverError && (
                                <div className="authAlert authAlertError">
                                    {serverError}
                                </div>
                            )}
                            {successMsg && (
                                <div className="authAlert authAlertSuccess">
                                    {successMsg}
                                </div>
                            )}

                            <button type="submit" className="authSubmit" disabled={submitting}>
                                {submitting ? <span className="authSpinner" /> : 'Изпрати линк'}
                            </button>

                            <button
                                type="button"
                                className="authForgotLink"
                                onClick={() => {
                                    clearState()
                                    setShowForgot(false)
                                }}
                            >
                                ← Обратно към вход
                            </button>
                        </form>
                    </>
                )}

                <div className="authFooter">
                    <span className="authFooterGlow" />
                    Защитено с Supabase Auth
                </div>
            </div>
        </div>
    )
}
