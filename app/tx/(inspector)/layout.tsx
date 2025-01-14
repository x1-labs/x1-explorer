import { Metadata } from 'next/types';
import React from 'react';

type Props = Readonly<{
    children: React.ReactNode;
    params: Readonly<{
        signature: string;
    }>;
}>;

export async function generateMetadata({ params: { signature } }: Props): Promise<Metadata> {
    if (signature) {
        return {
            description: `Interactively inspect the X1 Network ™ transaction with signature ${signature}`,
            title: `Transaction Inspector | ${signature} | X1 Network ™`,
        };
    } else {
        return {
            description: `Interactively inspect X1 Network ™ transactions`,
            title: `Transaction Inspector | X1 Network ™`,
        };
    }
}

export default function TransactionInspectorLayout({ children }: Props) {
    return children;
}
