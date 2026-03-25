import { supabase } from './supabase'

export type ActivityAction =
    | 'login'
    | 'signup'
    | 'logout'
    | 'page_load'
    | 'tab_switch'
    | 'click'
    | 'data_change'

/**
 * Log a user activity to the `activity_logs` table in Supabase.
 * Silently fails if no user is logged in or Supabase is not configured.
 */
export async function logActivity(
    action: ActivityAction,
    details?: Record<string, unknown>,
    page?: string
) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase.from('activity_logs').insert({
            user_id: user.id,
            action,
            details: details ?? {},
            page: page ?? window.location.pathname,
        })

        if (error) {
            console.warn('Activity log failed:', error.message)
        }
    } catch {
        // Silently ignore – logging should never break the app
    }
}
