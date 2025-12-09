import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export type VerifiableBuild =
    | {
          label: string;
          id: number;
          verified_slot: number;
          url: string;
      }
    | {
          label: string;
          verified_slot: null;
      };

export function useVerifiableBuilds(programAddress: PublicKey) {
    const { loading: loadingAnchor, verifiableBuild: verifiedBuildAnchor } = useAnchorVerifiableBuild(programAddress);

    return {
        loading: loadingAnchor,
        verifiableBuilds: [verifiedBuildAnchor],
    };
}

// ANCHOR

const defaultAnchorBuild = {
    label: 'Anchor',
    verified_slot: null,
};

export function useAnchorVerifiableBuild(programAddress: PublicKey) {
    const [loading, setLoading] = useState(true);
    const [verifiableBuild, setVerifiableBuild] = useState<VerifiableBuild>(defaultAnchorBuild);

    useEffect(() => {
        setLoading(true);
        getAnchorVerifiableBuild(programAddress)
            .then(setVerifiableBuild)
            .catch(error => {
                console.log(error);
                setVerifiableBuild(defaultAnchorBuild);
            })
            .finally(() => setLoading(false));
    }, [programAddress, setVerifiableBuild, setLoading]);

    return {
        loading,
        verifiableBuild,
    };
}

export interface AnchorBuild {
    aborted: boolean;
    address: string;
    created_at: string;
    updated_at: string;
    descriptor: string[];
    docker: string;
    id: number;
    name: string;
    sha256: string;
    upgrade_authority: string;
    verified: string;
    verified_slot: number;
    state: string;
}

/**
 * Returns a verified build from the anchor registry. null if no such
 * verified build exists, e.g., if the program has been upgraded since the
 * last verified build.
 */
export async function getAnchorVerifiableBuild(programId: PublicKey): Promise<VerifiableBuild> {
    const programIdBase58 = programId.toBase58();
    const url = `${process.env.NEXT_PUBLIC_X1_VERIFY_API_URL || 'https://verify.x1ns.xyz'}/api/program/${programIdBase58}/latest?limit=5`;
    const latestBuildsResp = await fetch(url);

    // Check if the response is ok and has data
    if (!latestBuildsResp.ok) {
        return defaultAnchorBuild;
    }

    const latestBuilds = await latestBuildsResp.json();

    if (!Array.isArray(latestBuilds) || latestBuilds.length === 0) {
        return defaultAnchorBuild;
    }

    // Get the latest build
    const latestBuild = latestBuilds[0];
    return {
        ...defaultAnchorBuild,
        id: latestBuild.pda,
        url: `${process.env.NEXT_PUBLIC_X1_VERIFY_API_URL || 'https://verify.x1ns.xyz'}/api/program/${programIdBase58}`,
        verified_slot: 0, // X1 verification doesn't use slots
    };
}

// END ANCHOR
