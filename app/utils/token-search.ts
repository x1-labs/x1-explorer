import { Cluster } from './cluster';

type SearchElement = {
    label: string;
    value: string[];
    pathname: string;
};

export async function searchTokens(_search: string, _cluster: Cluster): Promise<SearchElement[]> {
    // Token search using external Solana API is disabled
    return [];
}
