import { TransactionInstruction } from '@solana/web3.js';

// X1NS Program IDs
export const X1NS_PROGRAM_IDS = {
    NAME_TOKENIZER: 'nfTbQtRpscYq1SGCkadj44Ka13EEqGMbBoq7ZhSefUs',
    RECORDS: 'RECQbMcEjcFLj2nDLeHS387mEPqhgkBRoWkXLCpk18S',
    REGISTRAR: 'X1NS1M4Lh9zwpYe7Mi2RKyy7QWq7dRtqyr7KxsLyUn5',
    SPL_NAME_SERVICE: 'nameQyUhZQQgnirGbbJRR9ECWSdq1W7mMaNUZZTBvtq',
} as const;

// Program name mapping
const PROGRAM_NAMES: { [key: string]: string } = {
    [X1NS_PROGRAM_IDS.REGISTRAR]: 'X1NS Domain Name Service',
    [X1NS_PROGRAM_IDS.RECORDS]: 'X1NS Records Program',
    [X1NS_PROGRAM_IDS.SPL_NAME_SERVICE]: 'X1NS SPL Name Service',
    [X1NS_PROGRAM_IDS.NAME_TOKENIZER]: 'X1NS Name Tokenizer',
};

// X1NS Registrar instructions (starting at byte 12)
const REGISTRAR_INSTRUCTIONS: { [key: number]: string } = {
    12: 'Create Reverse Lookup',
    13: 'Delete Domain',
    14: 'Register Domain',
    15: 'Create Subdomain',
    16: 'Create Marketplace Listing',
    17: 'Buy Marketplace Listing',
    18: 'Cancel Marketplace Listing',
    19: 'Set Primary Domain',
    20: 'Update Domain Profile',
    21: 'Tokenize Domain as NFT',
    22: 'Initialize Pricing Config',
    23: 'Update Pricing',
    24: 'Lock/Unlock Pricing',
    25: 'Create NFT Listing',
    26: 'Buy NFT Listing',
    27: 'Cancel NFT Listing',
    28: 'Admin Transfer Domain',
    29: 'Admin Register (Free)',
};

// X1NS Records instructions
const RECORDS_INSTRUCTIONS: { [key: number]: string } = {
    0: 'Allocate Record',
    1: 'Allocate and Post Record',
    2: 'Edit Record',
    3: 'Validate X1 Signature',
    4: 'Validate Ethereum Signature',
    5: 'Delete Record',
    6: 'Write RoA',
    7: 'Unverify RoA',
};

// SPL Name Service instructions (Borsh enum format)
const SPL_NAME_SERVICE_INSTRUCTIONS: { [key: number]: string } = {
    0: 'Create Name Record',
    1: 'Update Name Record',
    2: 'Transfer Name Ownership',
    3: 'Delete Name Record',
    4: 'Realloc Name Record',
};

// Name Tokenizer instructions
const NAME_TOKENIZER_INSTRUCTIONS: { [key: number]: string } = {
    0: 'Create NFT Mint',
    1: 'Create NFT Collection',
    2: 'Create Domain NFT',
    3: 'Redeem Domain NFT',
    4: 'Withdraw Tokens',
    5: 'Edit Tokenized Data',
    6: 'Unverify NFT Collection',
};

// Instruction lookup map by program
const INSTRUCTION_LOOKUPS: { [programId: string]: { [key: number]: string } } = {
    [X1NS_PROGRAM_IDS.REGISTRAR]: REGISTRAR_INSTRUCTIONS,
    [X1NS_PROGRAM_IDS.RECORDS]: RECORDS_INSTRUCTIONS,
    [X1NS_PROGRAM_IDS.SPL_NAME_SERVICE]: SPL_NAME_SERVICE_INSTRUCTIONS,
    [X1NS_PROGRAM_IDS.NAME_TOKENIZER]: NAME_TOKENIZER_INSTRUCTIONS,
};

// Check if instruction is from any X1NS program
export function isX1NSInstruction(instruction: TransactionInstruction): boolean {
    const programId = instruction.programId.toBase58();
    return programId in PROGRAM_NAMES;
}

// Get program name
export function getX1NSProgramName(instruction: TransactionInstruction): string | null {
    const programId = instruction.programId.toBase58();
    return PROGRAM_NAMES[programId] || null;
}

// Parse instruction title dynamically for any X1NS program
export function parseX1NSInstructionTitle(instruction: TransactionInstruction): string {
    const programId = instruction.programId.toBase58();
    const instructionCode = instruction.data[0];
    
    // Get the lookup table for this program
    const lookup = INSTRUCTION_LOOKUPS[programId];
    
    if (!lookup) {
        throw new Error(`Unknown X1NS program: ${programId}`);
    }
    
    const instructionName = lookup[instructionCode];
    
    if (!instructionName) {
        throw new Error(`Unrecognized instruction code ${instructionCode} for program ${programId}`);
    }
    
    return instructionName;
}

