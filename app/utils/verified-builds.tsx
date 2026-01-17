import { sha256 } from '@noble/hashes/sha256';
import { Connection, PublicKey } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

import { useAnchorProgram } from '../providers/anchor';
import { useCluster } from '../providers/cluster';
import { ProgramDataAccountInfo } from '../validators/accounts/upgradeable-program';
import { Cluster } from './cluster';

// X1 Verification - Use X1-specific verification service
const OSEC_REGISTRY_URL = process.env.NEXT_PUBLIC_X1_VERIFY_API_URL || 'https://verify.x1ns.xyz';
const VERIFY_PROGRAM_ID = process.env.NEXT_PUBLIC_X1_VERIFY_PROGRAM_ID || 'verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh';

export enum VerificationStatus {
    Verified = 'Verified Build',
    PdaUploaded = 'Not verified Build',
    NotVerified = 'Not Verified',
}

export type OsecRegistryInfo = {
    verification_status: VerificationStatus;
    signer: string;
    is_verified: boolean;
    message: string;
    on_chain_hash: string;
    executable_hash: string;
    last_verified_at: string | null;
    repo_url: string;
    verify_command: string;
};

export type OsecInfo = {
    signer: string;
    is_verified: boolean;
    on_chain_hash: string;
    executable_hash: string;
    repo_url: string;
    commit: string;
    last_verified_at: string;
};

const TRUSTED_SIGNERS: Record<string, string> = {
    '9VWiUUhgNoRwTH5NVehYJEDwcotwYX3VgW4MChiHPAqU': 'OtterSecurity',
    CyJj5ejJAUveDXnLduJbkvwjxcmWJNqCuB9DR7AExrHn: 'Explorer',
};

export function useVerifiedProgramRegistry({
    programId,
    programAuthority,
    options,
    programData,
}: {
    programId: PublicKey;
    programAuthority: PublicKey | null;
    options?: { suspense: boolean };
    programData?: ProgramDataAccountInfo;
}) {
    const {
        data: registryData,
        error: registryError,
        isLoading: isRegistryLoading,
    } = useSWRImmutable(
        `${programId.toBase58()}`,
        async (programId: string) => {
            const response = await fetch(`${OSEC_REGISTRY_URL}/status-all/${programId}`);

            return response.json() as Promise<OsecInfo[]>;
        },
        { suspense: options?.suspense }
    );

    if (!programData || !registryData) {
        return { data: null, error: registryError, isLoading: isRegistryLoading };
    }

    // Only trust entries that are verified and signed by a trusted signer or the program authority
    const trustedEntries = registryData.filter(
        entry => (TRUSTED_SIGNERS[entry.signer] || entry.signer === programAuthority?.toBase58()) && entry.is_verified
    );

    // Update the verification status of the trusted entries based on the on-chain hash
    const hash = hashProgramData(programData);
    trustedEntries.forEach(entry => {
        entry.is_verified = hash === entry['on_chain_hash'];
    });

    return { data: trustedEntries, isLoading: isRegistryLoading };
}

// Method to fetch verified build information for a given program
// Returns the first verified entry that is signed by the program authority or a trusted signer
export function useVerifiedProgram({
    programId,
    programAuthority,
    options,
    programData,
}: {
    programId: PublicKey;
    programAuthority: PublicKey | null;
    options?: { suspense: boolean };
    programData?: ProgramDataAccountInfo;
}) {
    const { data: registryData } = useVerifiedProgramRegistry({
        options,
        programAuthority,
        programData,
        programId,
    });

    const mappedBySigner: Record<string, OsecInfo> = {};

    // Map the registryData by signer in order to enforce hierarchy of trust
    registryData?.forEach(entry => {
        mappedBySigner[entry.signer] = entry;
    });

    // Get the program authority's entry first, then the trusted signers
    const hierarchy = [...(programAuthority ? [programAuthority.toBase58()] : []), ...Object.keys(TRUSTED_SIGNERS)];
    const orderedVerifiedEntries: OsecInfo[] = [];
    for (const signer of hierarchy) {
        if (mappedBySigner[signer]) {
            orderedVerifiedEntries.push(mappedBySigner[signer]);
        }
    }

    // Get the first verified entry
    const verifiedData = orderedVerifiedEntries.find(entry => entry.is_verified);

    return useEnrichedOsecInfo({ options, osecInfo: verifiedData, programId });
}

// Internal method to enrich the osec info with the verify command (requires fetching the on-chain PDA)
function useEnrichedOsecInfo({
    programId,
    osecInfo,
    options,
}: {
    programId: PublicKey;
    osecInfo: OsecInfo | undefined;
    options?: { suspense: boolean };
}) {
    const { url: clusterUrl, cluster: cluster } = useCluster();
    const connection = new Connection(clusterUrl);

    const { program: accountAnchorProgram } = useAnchorProgram(VERIFY_PROGRAM_ID, connection.rpcEndpoint);

    // Fetch the PDA derived from the program upgrade authority
    // Try Anchor program first, fallback to raw account fetch if IDL not available
    const {
        data: pdaData,
        error: pdaError,
        isLoading: isPdaLoading,
    } = useSWRImmutable(
        osecInfo ? `pda-${programId.toBase58()}-${osecInfo.signer}` : null,
        async () => {
            if (!osecInfo) {
                return null;
            }

            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from('otter_verify'), new PublicKey(osecInfo.signer).toBuffer(), programId.toBuffer()],
                new PublicKey(VERIFY_PROGRAM_ID)
            );

            // Try Anchor program first if available
            if (accountAnchorProgram) {
                try {
                    const pdaAccountInfo = await (accountAnchorProgram.account as any).buildParams.fetch(pda);
                    if (pdaAccountInfo) {
                        return pdaAccountInfo;
                    }
                } catch (e) {
                    // Fall through to raw fetch
                }
            }

            // Fallback: Fetch raw account data and deserialize manually
            const accountInfo = await connection.getAccountInfo(pda);
            if (!accountInfo || !accountInfo.data) {
                return null;
            }

            // Deserialize BuildParams manually (Anchor account layout)
            // Layout: discriminator (8) + program_id (32) + verifier (32) + git_url (4+len) + commit (4+len) + args (4+vec) + uploaded_at (8)
            const data = accountInfo.data;
            let offset = 8; // Skip Anchor discriminator

            const programIdBytes = data.slice(offset, offset + 32);
            offset += 32;
            const verifierBytes = data.slice(offset, offset + 32);
            offset += 32;

            // Read git_url (string with 4-byte length prefix)
            const gitUrlLen = data.readUInt32LE(offset);
            offset += 4;
            const gitUrl = data.slice(offset, offset + gitUrlLen).toString('utf8');
            offset += gitUrlLen;

            // Read commit (string with 4-byte length prefix)
            const commitLen = data.readUInt32LE(offset);
            offset += 4;
            const commit = data.slice(offset, offset + commitLen).toString('utf8');
            offset += commitLen;

            // Read args (vector with 4-byte length prefix)
            const argsLen = data.readUInt32LE(offset);
            offset += 4;
            const args: string[] = [];
            for (let i = 0; i < argsLen; i++) {
                const argLen = data.readUInt32LE(offset);
                offset += 4;
                args.push(data.slice(offset, offset + argLen).toString('utf8'));
                offset += argLen;
            }

            // Read uploaded_at (i64 = 8 bytes)
            const uploadedAt = data.readBigUInt64LE(offset);

            return {
                args,
                commit,
                gitUrl,
                programId: new PublicKey(programIdBytes),
                uploadedAt: { toNumber: () => Number(uploadedAt) },
                verifier: new PublicKey(verifierBytes),
            };
        },
        { suspense: options?.suspense }
    );

    if (!osecInfo || pdaError) {
        return { data: null, error: pdaError, isLoading: isPdaLoading };
    }
    if (!pdaData || isPdaLoading) {
        return { data: null, isLoading: isPdaLoading };
    }

    const message = TRUSTED_SIGNERS[osecInfo?.signer || '']
        ? 'Verification information provided by a trusted signer.'
        : 'Verification information provided by the program authority.';

    const enrichedOsecInfo: OsecRegistryInfo = {
        ...osecInfo,
        message,
        signer: osecInfo.signer || '',
        verification_status: osecInfo.is_verified
            ? VerificationStatus.Verified
            : pdaData
            ? VerificationStatus.PdaUploaded
            : VerificationStatus.NotVerified,
        verify_command: '',
    };
    enrichedOsecInfo.repo_url = pdaData.gitUrl;
    enrichedOsecInfo.repo_url += pdaData.commit.length ? '/tree/' + pdaData.commit : '';
    if (pdaData) {
        // Create command from the args of the verified build PDA
        enrichedOsecInfo.verify_command = coalesceCommandFromPda(programId, pdaData);
    } else {
        enrichedOsecInfo.verify_command = isMainnet(cluster)
            ? 'Program does not have a verify PDA uploaded.'
            : 'Verify command only available on mainnet.';
    }
    return { data: enrichedOsecInfo, isLoading: isPdaLoading };
}

function coalesceCommandFromPda(programId: PublicKey, pdaData: any) {
    let verify_command = `x1-verify upload --program-id ${programId.toBase58()} --git-url ${pdaData.gitUrl}`;

    if (pdaData.commit) {
        verify_command += ` --commit-hash ${pdaData.commit}`;
    }

    // Add additional args if available, for example mount-path and --library-name
    if (pdaData.args && pdaData.args.length > 0) {
        const argsString = pdaData.args.join(' ');
        verify_command += ` ${argsString}`;
    }
    return verify_command;
}

function isMainnet(currentCluster: Cluster): boolean {
    return currentCluster == Cluster.MainnetBeta;
}

// Helper function to hash program data
export function hashProgramData(programData: ProgramDataAccountInfo): string {
    const buffer = Buffer.from(programData.data[0], 'base64');
    // Truncate null bytes at the end of the buffer
    let truncatedBytes = 0;
    while (buffer[buffer.length - 1 - truncatedBytes] === 0) {
        truncatedBytes++;
    }
    // Hash the binary
    const c = new Uint8Array(buffer.subarray(0, buffer.length - truncatedBytes));
    const hashBytes = sha256(c);
    return Buffer.from(hashBytes).toString('hex');
}
