import {
    Handshake,
    Layers,
    LayoutGrid,
    Radio,
    Settings,
    Sparkles,
    UserRound,
    UsersRound,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    key: string;
    label: string;
    path: string;
    icon: LucideIcon;
    description: string;
    /** Shown in the mobile bottom tab bar */
    mobileTab?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
    { key: 'overview', label: 'Overview', path: '/', icon: LayoutGrid, description: 'Your dashboard', mobileTab: true },
    { key: 'profile', label: 'My Profile', path: '/profile', icon: UserRound, description: 'How attendees see you' },
    {
        key: 'matchmaking',
        label: 'AI Matchmaking',
        path: '/matchmaking',
        icon: Sparkles,
        description: 'Curated introductions',
        mobileTab: true,
    },
    {
        key: 'discover',
        label: 'Discover People',
        path: '/discover',
        icon: UsersRound,
        description: 'Browse attendees',
        mobileTab: true,
    },
    { key: 'live', label: 'Live Event', path: '/live', icon: Radio, description: 'Schedule & check-in', mobileTab: true },
    { key: 'connections', label: 'Connections', path: '/connections', icon: Handshake, description: 'Your network' },
    {
        key: 'collaboration',
        label: 'Collaboration Hub',
        path: '/collaboration',
        icon: Layers,
        description: 'Build together',
    },
    { key: 'settings', label: 'Settings', path: '/settings', icon: Settings, description: 'Wallet, network & account' },
];

export const findNavItem = (pathname: string): NavItem | undefined =>
    NAV_ITEMS.find((item) => (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)));
