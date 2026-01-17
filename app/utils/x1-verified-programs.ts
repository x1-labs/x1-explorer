/**
 * X1-Specific Program Verification Registry
 * 
 * Since X1 is separate from Solana, we maintain our own verified programs list
 * for X1 ecosystem programs until a full verification infrastructure is deployed.
 */

export interface X1VerifiedProgram {
    programId: string;
    name: string;
    verifier: string;
    gitRepo: string;
    commit?: string;
    verifiedAt: string;
    description?: string;
}

// Manually verified X1 programs
export const X1_VERIFIED_PROGRAMS: Record<string, X1VerifiedProgram> = {
    
    'RECQbMcEjcFLj2nDLeHS387mEPqhgkBRoWkXLCpk18S': {
        commit: 'main',
        description: 'Official X1NS DNS Records Program',
        gitRepo: 'https://github.com/your-org/x1ns',
        name: 'X1NS Records Program',
        programId: 'RECQbMcEjcFLj2nDLeHS387mEPqhgkBRoWkXLCpk18S',
        verifiedAt: '2024-01-01',
        verifier: 'X1NS Team',
    },
    // X1NS Programs
'X1NS1M4Lh9zwpYe7Mi2RKyy7QWq7dRtqyr7KxsLyUn5': {
        commit: 'main',
        description: 'Official X1NS Domain Name Service Registrar',
        gitRepo: 'https://github.com/your-org/x1ns',
        name: 'X1NS Domain Name Service',
        programId: 'X1NS1M4Lh9zwpYe7Mi2RKyy7QWq7dRtqyr7KxsLyUn5',
        verifiedAt: '2024-01-01',
        verifier: 'X1NS Team',
    },
    'nameQyUhZQQgnirGbbJRR9ECWSdq1W7mMaNUZZTBvtq': {
        commit: 'main',
        description: 'SPL Name Service Adapter for X1NS',
        gitRepo: 'https://github.com/your-org/x1ns',
        name: 'X1NS SPL Name Service',
        programId: 'nameQyUhZQQgnirGbbJRR9ECWSdq1W7mMaNUZZTBvtq',
        verifiedAt: '2024-01-01',
        verifier: 'X1NS Team',
    },
    'nfTbQtRpscYq1SGCkadj44Ka13EEqGMbBoq7ZhSefUs': {
        commit: 'main',
        description: 'NFT Tokenization Program for X1NS Domains',
        gitRepo: 'https://github.com/your-org/x1ns',
        name: 'X1NS Name Tokenizer',
        programId: 'nfTbQtRpscYq1SGCkadj44Ka13EEqGMbBoq7ZhSefUs',
        verifiedAt: '2024-01-01',
        verifier: 'X1NS Team',
    },
};

/**
 * Check if a program is verified on X1
 */
export function isX1VerifiedProgram(programId: string): boolean {
    return programId in X1_VERIFIED_PROGRAMS;
}

/**
 * Get verification info for an X1 program
 */
export function getX1ProgramVerification(programId: string): X1VerifiedProgram | null {
    return X1_VERIFIED_PROGRAMS[programId] || null;
}

