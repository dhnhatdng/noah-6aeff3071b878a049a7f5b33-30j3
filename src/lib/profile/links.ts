import type { SocialLinks } from './types';

export type LinkKind = keyof SocialLinks;

const HANDLE_RULES: Partial<Record<LinkKind, { pattern: RegExp; base: string; hosts: string[] }>> = {
    x: { pattern: /^@?[A-Za-z0-9_]{1,15}$/, base: 'https://x.com/', hosts: ['x.com', 'twitter.com'] },
    github: { pattern: /^@?[A-Za-z0-9-]{1,39}$/, base: 'https://github.com/', hosts: ['github.com'] },
};

/** Only http(s) URLs with a real-looking hostname are allowed (blocks javascript: etc.). */
const parseHttpUrl = (raw: string): URL | null => {
    try {
        const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        if (!url.hostname.includes('.')) return null;
        return url;
    } catch {
        return null;
    }
};

const hostMatches = (url: URL, hosts: string[]) =>
    hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));

export const isValidLink = (kind: LinkKind, raw: string): boolean => {
    const value = raw.trim();
    if (!value) return true;
    const rule = HANDLE_RULES[kind];
    if (rule && rule.pattern.test(value)) return true;
    const url = parseHttpUrl(value);
    if (!url) return false;
    if (rule) return hostMatches(url, rule.hosts);
    if (kind === 'linkedin') return hostMatches(url, ['linkedin.com']);
    return true;
};

/** Safe, absolute href for display; null when empty or invalid. */
export const linkHref = (kind: LinkKind, raw: string): string | null => {
    const value = raw.trim();
    if (!value || !isValidLink(kind, value)) return null;
    const rule = HANDLE_RULES[kind];
    if (rule && rule.pattern.test(value)) return `${rule.base}${value.replace(/^@/, '')}`;
    return parseHttpUrl(value)?.toString() ?? null;
};

export const linkLabel = (kind: LinkKind, raw: string): string => {
    const value = raw.trim();
    const rule = HANDLE_RULES[kind];
    if (rule && rule.pattern.test(value)) return `@${value.replace(/^@/, '')}`;
    const url = parseHttpUrl(value);
    return url ? `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}` : value;
};
