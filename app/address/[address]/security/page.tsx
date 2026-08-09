import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import SecurityPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Contents of the security.txt for the program with address ${props.params.address} on X1 Network`,
        title: `Security | ${await getReadableTitleFromAddress(props)} | X1 Network ™`,
    };
}

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function SecurityPage(props: Props) {
    return <SecurityPageClient {...props} />;
}
