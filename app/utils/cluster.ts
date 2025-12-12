export enum ClusterStatus {
    Connected,
    Connecting,
    Failure,
}

export enum Cluster {
    MainnetBeta,
    Testnet,
    Devnet,
    Simd296,
    Custom,
}

export const CLUSTERS = [
  Cluster.MainnetBeta,
    Cluster.Testnet,
    // Cluster.Devnet,
    Cluster.Custom
];

export function clusterSlug(cluster: Cluster): string {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return 'mainnet';
        case Cluster.Testnet:
            return 'testnet';
        // case Cluster.Devnet:
        //     return 'devnet';
        case Cluster.Custom:
            return 'custom';
    }

    return '';
}

export function clusterName(cluster: Cluster): string {
    switch (cluster) {
        case Cluster.MainnetBeta:
            return 'X1 Network ™ (Mainnet)';
        case Cluster.Testnet:
          return 'X1 Network ™ (Testnet)';
        // case Cluster.Devnet:
        //     return 'Devnet';
        case Cluster.Custom:
            return 'Custom';
    }

    return '';
}

export const MAINNET_BETA_URL = 'https://rpc.mainnet.x1.xyz';
export const TESTNET_URL = 'https://rpc.testnet.x1.xyz';
export const DEVNET_URL = 'https://rpc.devnet.x1.xyz';
export const SIMD296_URL = 'https://rpc.devnet.x1.xyz';

const modifyUrl = (url: string): string => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return url;
    } else {
        return url.replace('api', 'explorer-api');
    }
};

export function clusterUrl(cluster: Cluster, customUrl: string): string {
    switch (cluster) {
        case Cluster.Devnet:
            return process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
        case Cluster.MainnetBeta:
            return process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
        case Cluster.Testnet:
            return process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
        case Cluster.Simd296:
            return process.env.NEXT_PUBLIC_SIMD296_RPC_URL ?? SIMD296_URL;
        case Cluster.Custom:
            return customUrl;
    }
}

export function serverClusterUrl(cluster: Cluster, customUrl: string): string {
    switch (cluster) {
        case Cluster.Devnet:
            return process.env.DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
        case Cluster.MainnetBeta:
            return process.env.MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
        case Cluster.Testnet:
            return process.env.TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
        case Cluster.Simd296:
            return process.env.SIMD296_RPC_URL ?? SIMD296_URL;
        case Cluster.Custom:
            return customUrl;
    }
}

export const DEFAULT_CLUSTER = Cluster.MainnetBeta;
