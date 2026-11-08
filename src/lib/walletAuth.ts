import { Buffer } from 'buffer';
import { AUTH_API_URL, SOLANA_CHAIN_ID } from '@/lib/config';

/**
 * Nonce-based wallet ownership verification (Sign-In With Solana style).
 *
 * Connecting a wallet only shares a public key — it does NOT prove ownership.
 * Ownership is proven when the wallet signs a one-time, server-issued nonce
 * and the backend verifies the ed25519 signature against the public key.
 *
 * Flow:
 *   1. POST {AUTH_API_URL}/nonce   { address }                -> { nonce, issuedAt, expiresAt }
 *   2. Client builds the message below and asks the wallet to sign it (no transaction, no fees).
 *   3. POST {AUTH_API_URL}/verify  { address, message, signature(base64) } -> { token }
 *      Backend must: check nonce exists, is unused and unexpired; rebuild/compare message;
 *      verify signature with nacl.sign.detached.verify; mark nonce consumed; issue session.
 *
 * STATUS: client side implemented. Backend endpoints are PENDING (no auth backend connected).
 */

export interface NonceResponse {
    nonce: string;
    issuedAt: string;
    expiresAt: string;
}

export interface VerifyResponse {
    token: string;
}

export class AuthBackendNotConfiguredError extends Error {
    constructor() {
        super('Ownership verification backend is not configured yet.');
        this.name = 'AuthBackendNotConfiguredError';
    }
}

export const isBackendAuthConfigured = (): boolean => Boolean(AUTH_API_URL);

export const buildSignInMessage = (params: { address: string } & NonceResponse): string => {
    const { host, origin } = window.location;
    return [
        `${host} wants you to sign in with your Solana account:`,
        params.address,
        '',
        'Sign in to Breakpoint Connect. This request will not trigger a blockchain transaction or cost any fees.',
        '',
        `URI: ${origin}`,
        'Version: 1',
        `Chain ID: ${SOLANA_CHAIN_ID}`,
        `Nonce: ${params.nonce}`,
        `Issued At: ${params.issuedAt}`,
        `Expiration Time: ${params.expiresAt}`,
    ].join('\n');
};

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${AUTH_API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Auth request failed (${res.status})`);
    }
    return (await res.json()) as T;
};

export const requestNonce = async (address: string): Promise<NonceResponse> => {
    if (!isBackendAuthConfigured()) throw new AuthBackendNotConfiguredError();
    return postJson<NonceResponse>('/nonce', { address });
};

export const verifyWalletSignature = async (payload: {
    address: string;
    message: string;
    signature: string;
}): Promise<VerifyResponse> => {
    if (!isBackendAuthConfigured()) throw new AuthBackendNotConfiguredError();
    return postJson<VerifyResponse>('/verify', payload);
};

/** Full ownership proof. Session token is kept in memory only (never localStorage). */
export const authenticateWallet = async (params: {
    address: string;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<VerifyResponse> => {
    const nonce = await requestNonce(params.address);
    const message = buildSignInMessage({ address: params.address, ...nonce });
    const signatureBytes = await params.signMessage(new TextEncoder().encode(message));
    return verifyWalletSignature({
        address: params.address,
        message,
        signature: Buffer.from(signatureBytes).toString('base64'),
    });
};
