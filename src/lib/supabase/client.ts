import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

/**
 * Supabase client. `null` when the project is not configured (no
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — the app then runs in demo
 * mode with localStorage only. Nothing in the app may assume this is set;
 * always go through isSupabaseConfigured() or a null check first.
 *
 * Only the public anon key is ever used here — never a service-role key.
 */
export const supabase: SupabaseClient | null =
    SUPABASE_URL && SUPABASE_ANON_KEY
        ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              auth: { persistSession: true, autoRefreshToken: true },
          })
        : null;

export const isSupabaseConfigured = (): boolean => supabase !== null;

/** Flag (not the id itself) recording that an anonymous session was established. */
const ANON_FLAG_KEY = 'bc:v1:supabase-anon';

let anonUserId: string | null = null;
let anonPromise: Promise<string | null> | null = null;

/**
 * Returns the stable anonymous user id for this browser, signing in
 * anonymously once via Supabase Auth (cached in module state afterwards).
 * Reuses an existing session when one is already stored.
 *
 * Returns null when Supabase is unconfigured, or when anonymous sign-in
 * fails — e.g. anonymous sign-ins are not enabled in the Supabase project
 * (Dashboard → Authentication → Sign-in providers → Anonymous). Callers
 * must treat null as "no backend identity yet" and surface a clear error
 * instead of writing rows with a missing owner.
 */
/**
 * Drops the cached anonymous identity (module state + flag) — used by
 * sign-out so the next data-layer call establishes a fresh identity
 * instead of reusing the previous user's anonymous session.
 */
export const resetAnonUserId = (): void => {
    anonUserId = null;
    anonPromise = null;
    try {
        localStorage.removeItem(ANON_FLAG_KEY);
    } catch {
        // Private mode / blocked storage: nothing to clear.
    }
};

export const getAnonUserId = (): Promise<string | null> => {
    if (!supabase) return Promise.resolve(null);
    if (anonUserId) return Promise.resolve(anonUserId);
    if (!anonPromise) {
        anonPromise = (async (): Promise<string | null> => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                let user = session?.user ?? null;
                if (!user) {
                    const { data, error } = await supabase.auth.signInAnonymously();
                    if (error || !data.user) {
                        console.warn('[supabase] Anonymous sign-in failed', error?.message ?? 'no user returned');
                        return null;
                    }
                    user = data.user;
                }
                anonUserId = user.id;
                try {
                    localStorage.setItem(ANON_FLAG_KEY, '1');
                } catch {
                    // Private mode / blocked storage: the module cache still holds the id.
                }
                return anonUserId;
            } catch (error) {
                console.warn('[supabase] Could not establish an anonymous session', error);
                return null;
            }
        })();
    }
    return anonPromise;
};
