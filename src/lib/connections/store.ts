import { DEMO_PROFILES } from '@/lib/profile/demoProfiles';
import type { DemoProfile } from '@/lib/profile/types';

/**
 * DEMO CONNECTIONS — stored in this browser only (localStorage).
 * Counterparts are fictional demo profiles, so nothing is sent to real people.
 * `ownerId` is the local user profile id, so a deleted/recreated profile starts clean.
 */
export type ConnectionDirection = 'sent' | 'received';
export type ConnectionStatus = 'pending' | 'accepted';

export interface ConnectionRecord {
    id: string;
    ownerId: string;
    counterpartId: string;
    direction: ConnectionDirection;
    status: ConnectionStatus;
    createdAt: string;
    updatedAt: string;
    /** True for incoming requests generated locally for testing. */
    simulated: boolean;
}

export interface ConnectionsState {
    version: 1;
    records: ConnectionRecord[];
    /** Profile ids that already received their simulated incoming requests. */
    seededOwners: string[];
}

export const CONNECTIONS_STORAGE_KEY = 'bc:v1:connections';

export const emptyConnections = (): ConnectionsState => ({ version: 1, records: [], seededOwners: [] });

const isRecord = (v: unknown): v is ConnectionRecord => {
    const o = v as Record<string, unknown> | null;
    return Boolean(
        o &&
            typeof o.id === 'string' &&
            typeof o.ownerId === 'string' &&
            typeof o.counterpartId === 'string' &&
            (o.direction === 'sent' || o.direction === 'received') &&
            (o.status === 'pending' || o.status === 'accepted') &&
            typeof o.createdAt === 'string' &&
            typeof o.updatedAt === 'string',
    );
};

export const readConnections = (): ConnectionsState => {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (!raw) return emptyConnections();
    try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        const seen = new Set<string>();
        // One record per owner + counterpart: this is what prevents duplicate requests/connections.
        const records = (Array.isArray(o.records) ? o.records : []).filter(isRecord).filter((r) => {
            const key = `${r.ownerId}:${r.counterpartId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        const seededOwners = (Array.isArray(o.seededOwners) ? o.seededOwners : []).filter(
            (s): s is string => typeof s === 'string',
        );
        return { version: 1, records: records.map((r) => ({ ...r, simulated: Boolean(r.simulated) })), seededOwners };
    } catch (error) {
        console.warn('[connections] Stored data could not be read', error);
        return emptyConnections();
    }
};

export const writeConnections = (state: ConnectionsState): void => {
    try {
        localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(state));
    } catch {
        throw new Error('Your browser blocked saving connection data.');
    }
};

const DEMO_BY_ID = new Map(DEMO_PROFILES.map((p) => [p.id, p]));
export const findDemoProfile = (id: string): DemoProfile | undefined => DEMO_BY_ID.get(id);
