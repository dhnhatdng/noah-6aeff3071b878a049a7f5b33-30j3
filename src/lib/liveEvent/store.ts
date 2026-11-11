/**
 * DEMO LIVE-EVENT CHECK-IN — stored in this browser only (localStorage).
 * No real event, venue or attendee list is connected: the 30 attendees are
 * the fictional demo profiles, and "you" are the local user.
 */
export interface LiveEventState {
    version: 1;
    checkedIn: boolean;
    checkedInAt: string | null;
}

export const LIVE_EVENT_STORAGE_KEY = 'bc:v1:live-event';

export const emptyLiveEvent = (): LiveEventState => ({ version: 1, checkedIn: false, checkedInAt: null });

export const readLiveEvent = (): LiveEventState => {
    const raw = localStorage.getItem(LIVE_EVENT_STORAGE_KEY);
    if (!raw) return emptyLiveEvent();
    try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        return {
            version: 1,
            checkedIn: o.checkedIn === true,
            checkedInAt: typeof o.checkedInAt === 'string' ? o.checkedInAt : null,
        };
    } catch (error) {
        console.warn('[live-event] Stored data could not be read', error);
        return emptyLiveEvent();
    }
};

export const writeLiveEvent = (state: LiveEventState): void => {
    try {
        localStorage.setItem(LIVE_EVENT_STORAGE_KEY, JSON.stringify(state));
    } catch {
        throw new Error('Your browser blocked saving check-in data.');
    }
};
