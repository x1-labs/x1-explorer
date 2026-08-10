import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { getX1NSProgramName, parseX1NSInstructionTitle } from './types';

export function X1NSDetailsCard({
    ix,
    index,
    result,
    signature,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { url } = useCluster();

    const programName = getX1NSProgramName(ix);
    let instructionTitle;

    try {
        instructionTitle = parseX1NSInstructionTitle(ix);
    } catch (error) {
        console.error(error, {
            signature: signature,
            url: url,
        });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName}: ${instructionTitle || 'Unknown'}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}

