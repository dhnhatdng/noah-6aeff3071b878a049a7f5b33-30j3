import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { SOLANA_CHAIN_ID } from '@/lib/config';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { supabaseProfileRepository } from '@/lib/supabase/profiles';

/**
 * Sign-In With Solana (SIWS), verified CLIENT-SIDE.
 *
 * Connecting a wallet only shares a public key — it does NOT prove ownership.
 * Ownership is proven when the wallet signs a one-time, locally issued nonce
 * and the Ed25519 signature verifies against the wallet's public key.
 *
 * Flow:
 *   1. A fresh nonce is generated in this browser (crypto.randomUUID) and
 *      kept in localStorage until it is used (bc:v1:siws-nonce).
 *   2. The wallet signs the message below (no transaction, no fees).
 *   3. verifySignature() checks the signature here with tweetnacl, then
 *      authenticateWallet() writes wallet_address + wallet_verified_at on
 *      the user's Supabase profile row (when one exists).
 *
 * SECURITY — READ THIS BEFORE MAINNET: client-side verification only proves
 * the signature to this browser. A production deployment MUST move nonce
 * issuance and signature verification to a server (the server must check the
 * nonce is fresh, unused and unexpired, rebuild the exact message, verify
 * the signature, and only then write wallet_verified_at). Until then, treat
 * wallet_verified_at as a local convenience flag, not a trust anchor.
 */

export interface SiwsVerification {
    address: string;
    verifiedAt: string;
}

/** Nonce storage: one pending nonce per wallet address. */
const NONCE_KEY = 'bc:v1:siws-nonce';

interface StoredNonce {
    address: string;
    nonce: string;
    issuedAt: string;
}

/** Issues (and stores) a fresh one-time nonce for this address. */
export const issueNonce = (address: string): StoredNonce => {
    const stored: StoredNonce = { address, nonce: crypto.randomUUID(), issuedAt: new Date().toISOString() };
    try {
        localStorage.setItem(NONCE_KEY, JSON.stringify(stored));
    } catch {
        // Private mode / blocked storage: the in-memory copy below still works.
    }
    return stored;
};

/** Consumes the stored nonce so it cannot be replayed. */
const consumeNonce = (): void => {
    try {
        localStorage.removeItem(NONCE_KEY);
    } catch {
        // Non-fatal: the next issueNonce() overwrites it.
    }
};

export const buildSignMessage = (address: string, nonce: string): string =>
    [
        'Breakpoint Connect — Sign in with Solana',
        '',
        `Address: ${address}`,
        `Nonce: ${nonce}`,
        `Chain: ${SOLANA_CHAIN_ID}`,
    ].join('\n');

/** Pure Ed25519 check: does `signature` over `message` verify against `address`? */
export const verifySignature = (address: string, message: string, signatureBytes: Uint8Array): boolean => {
    try {
        const publicKey = bs58.decode(address);
        return nacl.sign.detached.verify(new TextEncoder().encode(message), signatureBytes, publicKey);
    } catch {
        return false;
    }
};

/**
 * Full ownership proof: issue a nonce, ask the wallet to sign the SIWS
 * message, verify the signature client-side, then record the verification
 * on the Supabase profile row when one exists (and Supabase is configured).
 * In demo mode (no Supabase) the signature is still verified and returned.
 */
export const authenticateWallet = async (params: {
    address: string;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<SiwsVerification> => {
    const { nonce } = issueNonce(params.address);
    const message = buildSignMessage(params.address, nonce);
    let signatureBytes: Uint8Array;
    try {
        signatureBytes = await params.signMessage(new TextEncoder().encode(message));
    } catch (error) {
        consumeNonce();
        throw new Error(error instanceof Error ? error.message : 'Signing was cancelled.');
    }
    if (!verifySignature(params.address, message, signatureBytes)) {
        consumeNonce();
        throw new Error('Signature does not match this wallet address.');
    }
    consumeNonce();
    const verifiedAt = new Date().toISOString();
    if (isSupabaseConfigured()) {
        // Best effort: no profile row exists yet if the user has not created
        // one — they can verify again after creating it.
        await supabaseProfileRepository.markWalletVerified(params.address, verifiedAt);
    }
    return { address: params.address, verifiedAt };
};
