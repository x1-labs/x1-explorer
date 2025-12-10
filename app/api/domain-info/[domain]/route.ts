import { Connection } from "@solana/web3.js";
import { NextResponse } from "next/server";

import { MAINNET_BETA_URL } from "@/app/utils/cluster";
import { getX1NSDomainInfo, isX1NSDomain } from "@/app/utils/domain-info";

type Params = {
    params: {
        domain: string
    }
}

export type FetchedDomainInfo = Awaited<ReturnType<typeof getX1NSDomainInfo>>;

export async function GET(
    _request: Request,
    { params: { domain } }: Params
) {
    const connection = new Connection(MAINNET_BETA_URL);
    
    // Determine network from query params (default to mainnet)
    const { searchParams } = new URL(_request.url);
    const network = searchParams.get('network') === 'testnet' ? 'testnet' : 'mainnet';
    
    // Only resolve X1NS domains (.x1, .xnt, .xen)
    let domainInfo = null;
    if (isX1NSDomain(domain)) {
        domainInfo = await getX1NSDomainInfo(domain, connection, network);
    }

    return NextResponse.json(domainInfo, {
        headers: {
            // 24 hours
            "Cache-Control": "max-age=86400",
        }
    });
}
