/**
 * MEETINGS — localStorage fallback, used when Supabase is not configured.
 * Mirrors the versioned pattern in src/lib/connections/store.ts.
 *
 * `ownerId` / `counterpartId` use the same id space as messages: the local
 * user profile id in demo mode, the anonymous Supabase auth user id live.
 * Unlike connection requests, a declined meeting is kept (status
 * 'declined') so the Meetings page can list past and declined meetings.
 */

export type MeetingDirection = 'sent' | 'received';
export type MeetingStatus = 'pending' | 'accepted' | 'declined';

export interface MeetingRecord {
    id: string;
    ownerId: string;
    counterpartId: string;
    direction: MeetingDirection;
    status: MeetingStatus;
    /** ISO timestamp of the meeting start. */
    startTime: string;
    location: string;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingsState {
    version: 1;
    meetings: MeetingRecord[];
}

export const MEETINGS_STORAGE_KEY = 'bc:v1:meetings';

export const emptyMeetings = (): MeetingsState => ({ version: 1, meetings: [] });

const isMeeting = (v: unknown): v is MeetingRecord => {
    const o = v as Record<string, unknown> | null;
    return Boolean(
        o &&
            typeof o.id === 'string' &&
            typeof o.ownerId === 'string' &&
            typeof o.counterpartId === 'string' &&
            (o.direction === 'sent' || o.direction === 'received') &&
            (o.status === 'pending' || o.status === 'accepted' || o.status === 'declined') &&
            typeof o.startTime === 'string' &&
            typeof o.location === 'string' &&
            typeof o.createdAt === 'string' &&
            typeof o.updatedAt === 'string',
    );
};

export const readMeetings = (): MeetingsState => {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) return emptyMeetings();
    try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        const meetings = (Array.isArray(o.meetings) ? o.meetings : []).filter(isMeeting);
        return { version: 1, meetings };
    } catch (error) {
        console.warn('[meetings] Stored data could not be read', error);
        return emptyMeetings();
    }
};

export const writeMeetings = (state: MeetingsState): void => {
    try {
        localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(state));
    } catch {
        throw new Error('Your browser blocked saving meeting data.');
    }
};

// ── Breakpoint 2026 meeting window (verified event dates) ────────────────

/** Meetings can only be booked on Breakpoint days: Nov 15–17, 2026. */
export const MEETING_DATE_MIN = '2026-11-15';
export const MEETING_DATE_MAX = '2026-11-17';
export const MEETING_LOCATION_DEFAULT = 'Olympia London';

/**
 * Validates a meeting start time (ISO string). Returns a user-facing error
 * message, or null when the date is inside the Breakpoint window.
 * The date part is taken as entered (local date), so a booking for Nov 14
 * or Nov 18 is rejected even if timezones would shift it.
 */
export const validateMeetingStart = (startTime: string): string | null => {
    if (!startTime || Number.isNaN(Date.parse(startTime))) return 'Pick a date and time for the meeting.';
    // The date as the viewer sees it (local timezone): an ISO string is UTC,
    // so slicing it would wrongly reject early-morning local bookings.
    const d = new Date(startTime);
    const pad = (n: number) => String(n).padStart(2, '0');
    const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (datePart < MEETING_DATE_MIN || datePart > MEETING_DATE_MAX) {
        return 'Meetings can only be booked during Breakpoint, Nov 15–17, 2026. Pick a date in that range.';
    }
    return null;
};
