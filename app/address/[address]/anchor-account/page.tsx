import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import AnchorAccountPageClient from './page-client';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Contents of the Anchor Account at address ${props.params.address} on X1 Network ™`,
        title: `Anchor Account Data | ${await getReadableTitleFromAddress(props)} | X1 Network ™`,
    };
}

export default function AnchorAccountPage(props: Props) {
    return <AnchorAccountPageClient {...props} />;
}
