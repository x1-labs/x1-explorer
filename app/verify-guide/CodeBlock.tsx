'use client';

import { useState } from 'react';

interface CodeBlockProps {
    children: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="position-relative">
            <pre className="bg-dark text-light p-3 rounded" style={{ fontSize: '0.9em', overflowX: 'auto' }}>
                <code>{children}</code>
            </pre>
            <button
                className="btn btn-sm btn-outline-light position-absolute"
                onClick={handleCopy}
                style={{ right: '8px', top: '8px' }}
                type="button"
            >
                {copied ? '✓ Copied' : 'Copy'}
            </button>
        </div>
    );
}

