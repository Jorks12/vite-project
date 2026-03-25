import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogger'
import type { UserRole } from '../domain/types'

interface AuthContextType {
    user: User | null
    role: UserRole
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUp: (email: string, password: string, displayName?: string, role?: UserRole) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Fetch the role from the auth metadata, fallback to public.users table */
async function fetchRoleFromDB(user: User): Promise<UserRole> {
    const metaRole = user.user_metadata?.role
    
    // 1. HARD OVERRIDE: Always trust the registration metadata if present
    if (metaRole === 'admin' || metaRole === 'mentor' || metaRole === 'student') {
        return metaRole
    }

    // 2. ONLY fallback to DB if metadata is completely missing/corrupted
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!error && data?.role) {
        const raw = data.role
        if (raw === 'admin' || raw === 'mentor' || raw === 'student') return raw
    }

    return 'student'
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>('student')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session — with a 2s timeout so we never hang forever
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 2000))
        const sessionPromise = supabase.auth.getSession().then(async ({ data: { session } }) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                const dbRole = await fetchRoleFromDB(currentUser)
                setRole(dbRole)
            }

        })
        Promise.race([sessionPromise, timeoutPromise]).finally(() => {
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                const dbRole = await fetchRoleFromDB(currentUser)
                setRole(dbRole)
            } else {
                setRole('student')
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error) {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (currentUser) {
                // Read role from DB or metadata
                const dbRole = await fetchRoleFromDB(currentUser)
                setRole(dbRole)
                await supabase.from('users').update({ last_sign_in: new Date().toISOString() }).eq('id', currentUser.id)
                await logActivity('login', { method: 'email' })
            }
        }
        return { error }
    }

    const signUp = async (email: string, password: string, displayName?: string, userRole?: UserRole) => {
        const selectedRole = userRole || 'student'
        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || email.split('@')[0],
                    role: selectedRole,
                },
            },
        })
        if (!error && data.user) {
            // The trigger handle_new_user() will insert the row with the role.
            // But as a safety measure, also try to update it explicitly:
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: selectedRole })
                .eq('id', data.user.id)
            
            if (updateError) {
                console.error("Failed to explicitely update user role in DB:", updateError)
            }

            await logActivity('signup', { method: 'email', role: selectedRole })
        }
        return { error }
    }

    const signOut = async () => {
        // 1. Instantly clear local state so the UI updates to logged-out
        setUser(null)
        setRole('student')

        // 2. Perform network operations in the background
        // We use Promise.allSettled so neither action blocks the other
        Promise.allSettled([
            logActivity('logout'),
            supabase.auth.signOut()
        ]).finally(() => {
            // Optional: reset location just in case local path is protected
            if (window.location.hash || window.location.pathname !== '/') {
                window.history.replaceState(null, '', '/')
            }
        })
    }

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/`,
        })
        return { error }
    }

    return (
        <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut, resetPassword }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
