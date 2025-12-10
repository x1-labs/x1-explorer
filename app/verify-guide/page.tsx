import Link from 'next/link';
import type { Metadata } from 'next/types';

function CodeBlock({ children }: { children: React.ReactNode }) {
    return (
        <pre className="bg-dark p-3 rounded mb-3" style={{ overflowX: 'auto' }}>
            <code className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {children}
            </code>
        </pre>
    );
}

export const metadata: Metadata = {
    description: 'Learn how to verify your X1 programs on-chain for transparency and trust',
    title: 'Program Verification Guide | X1 Network ™',
};

export default function VerifyGuidePage() {
    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-header-title mb-0">
                        🔐 X1 Program Verification Guide
                    </h3>
                </div>
                <div className="card-body">
                    <div className="mb-4">
                        <h4>What is Program Verification?</h4>
                        <p>
                            Program verification allows developers to link their deployed X1 programs to their source code on GitHub. 
                            This creates transparency and builds trust by allowing anyone to verify that a deployed program matches 
                            its published source code.
                        </p>
                        <p>
                            When you verify a program, the verification data is stored on-chain in the{' '}
                            <Link href="/address/verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh" className="badge bg-success-soft rank">
                                X1 Verification Program
                            </Link>, making it publicly accessible and immutable.
                        </p>
                    </div>

                    <div className="mb-4">
                        <h4>Prerequisites</h4>
                        <ul>
                            <li><strong>X1 CLI</strong> configured for X1 mainnet</li>
                            <li><strong>Anchor Framework</strong> installed</li>
                            <li><strong>x1-verify CLI</strong> tool installed</li>
                            <li>Your program source code in a <strong>public GitHub repository</strong></li>
                            <li>A keypair with sufficient XNT for transaction fees</li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h4>Installation</h4>
                        <h5 className="mt-3">Install x1-verify CLI</h5>
                        <CodeBlock>
                            npm install -g x1-verify
                        </CodeBlock>
                        <p>Or clone and build from source:</p>
                        <CodeBlock>
{`git clone https://github.com/Xenian84/x1-verify
cd x1-verify/cli
npm install
npm run build`}
                        </CodeBlock>
                    </div>

                    <div className="mb-4">
                        <h4>Step-by-Step Verification Guide</h4>
                        
                        <div className="mt-3">
                            <h5>
                                <span className="badge bg-primary me-2">1</span>
                                Build Your Program Verifiably
                            </h5>
                            <p>
                                First, build your Anchor program with the <code>--verifiable</code> flag. 
                                This ensures deterministic builds that can be reproduced.
                            </p>
                            <CodeBlock>
                                anchor build --verifiable
                            </CodeBlock>
                            <div className="alert alert-info mt-2">
                                <strong>💡 Tip:</strong> The <code>--verifiable</code> flag ensures your build is deterministic 
                                and reproducible, which is essential for verification.
                            </div>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">2</span>
                                Deploy Your Program
                            </h5>
                            <p>Deploy your program to X1 mainnet:</p>
                            <CodeBlock>
                                anchor deploy --provider.cluster mainnet
                            </CodeBlock>
                            <p className="mt-2">Or use X1 CLI (Solana CLI) directly:</p>
                            <CodeBlock>
                                solana program deploy target/deploy/your_program.so --program-id your_program-keypair.json
                            </CodeBlock>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">3</span>
                                Get Your Git Commit Hash
                            </h5>
                            <p>Get the commit hash of the code you deployed:</p>
                            <CodeBlock>
                                git rev-parse HEAD
                            </CodeBlock>
                            <p className="mt-2">Or for a specific commit:</p>
                            <CodeBlock>
                                git log --oneline -1
                            </CodeBlock>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">4</span>
                                Upload Verification Data
                            </h5>
                            <p>Use the x1-verify CLI to upload your verification data:</p>
                            <CodeBlock>
{`x1-verify upload \\
  --program-id YOUR_PROGRAM_ID \\
  --git-url https://github.com/YOUR_USERNAME/YOUR_REPO \\
  --commit YOUR_COMMIT_HASH \\
  --args "anchor build --verifiable" \\
  --keypair ~/.config/solana/id.json \\
  --rpc-url https://rpc.mainnet.x1.xyz`}
                            </CodeBlock>
                            <div className="alert alert-info mt-2">
                                <strong>📝 Note:</strong> Replace <code>YOUR_PROGRAM_ID</code>, <code>YOUR_USERNAME</code>, 
                                <code>YOUR_REPO</code>, and <code>YOUR_COMMIT_HASH</code> with your actual values.
                            </div>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">5</span>
                                Verify on Explorer
                            </h5>
                            <p>
                                Once uploaded, visit your program&apos;s page on the X1 Explorer:
                            </p>
                            <CodeBlock>
                                https://explorer.mainnet.x1.xyz/address/YOUR_PROGRAM_ID
                            </CodeBlock>
                            <p className="mt-2">
                                You should see a <span className="badge bg-success-soft">Program Source Verified</span> 
                                badge if verification was successful!
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4>Example: Complete Verification Flow</h4>
                        <CodeBlock>
{`# 1. Build verifiably
anchor build --verifiable

# 2. Deploy
anchor deploy --provider.cluster mainnet

# 3. Get commit hash
COMMIT=$(git rev-parse HEAD)
echo "Commit: $COMMIT"

# 4. Upload verification
x1-verify upload \\
  --program-id verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh \\
  --git-url https://github.com/Xenian84/x1-verify-program \\
  --commit $COMMIT \\
  --args "anchor build --verifiable" \\
  --keypair ~/.config/solana/id.json`}
                        </CodeBlock>
                    </div>

                    <div className="mb-4">
                        <h4>Querying Verification Data</h4>
                        <p>You can query verification data using the CLI:</p>
                        <CodeBlock>
{`x1-verify query \\
  --program-id YOUR_PROGRAM_ID \\
  --verifier YOUR_VERIFIER_PUBKEY`}
                        </CodeBlock>
                        <p className="mt-2">Or use the API directly:</p>
                        <CodeBlock>
                            curl https://verify.x1ns.xyz/api/program/YOUR_PROGRAM_ID
                        </CodeBlock>
                    </div>

                    <div className="mb-4">
                        <h4>Adding Security.txt to Your Program</h4>
                        <p>
                            Security.txt helps security researchers contact you if they find vulnerabilities in your program. 
                            It&apos;s embedded directly in your program binary and displayed on the explorer.
                        </p>
                        
                        <div className="mt-3">
                            <h5>
                                <span className="badge bg-primary me-2">1</span>
                                Add x1-security-txt Dependency
                            </h5>
                            <p>Add the <code>x1-security-txt</code> crate to your program&apos;s <code>Cargo.toml</code>:</p>
                            <CodeBlock>
{`[dependencies]
anchor-lang = "0.31.1"
x1-security-txt = "1.0.0"`}
                            </CodeBlock>
                            <p className="mt-2">
                                Or use a local path during development:
                            </p>
                            <CodeBlock>
{`x1-security-txt = { path = "../../x1-security-txt" }`}
                            </CodeBlock>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">2</span>
                                Add Security.txt Macro to Your Program
                            </h5>
                            <p>Add the security.txt macro to your program source code:</p>
                            <CodeBlock>
{`use anchor_lang::prelude::*;

declare_id!("YourProgramId111111111111111111111111");

#[program]
pub mod your_program {
    use super::*;
    // ... your program code ...
}

// Include security.txt only when not building as a library
#[cfg(not(feature = "no-entrypoint"))]
x1_security_txt::security_txt! {
    name: "Your Project Name",
    project_url: "https://yourproject.com",
    contacts: "email:admin@yourproject.com,link:https://yourproject.com/",
    policy: "https://github.com/yourusername/yourrepo/blob/main/SECURITY.md",
    source_code: "https://github.com/yourusername/yourrepo",
    source_release: "v1.0.0",
    auditors: "Auditor Name",
    expiry: "2026-12-31"
}`}
                            </CodeBlock>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">3</span>
                                Required Fields
                            </h5>
                            <ul>
                                <li><strong>name:</strong> Your project name</li>
                                <li><strong>project_url:</strong> Your project homepage URL</li>
                                <li><strong>contacts:</strong> Comma-separated contact list (format: <code>type:value</code>)</li>
                                <li><strong>policy:</strong> Security policy URL or text</li>
                            </ul>
                            <p className="mt-2">Contact types supported: <code>email</code>, <code>link</code>, <code>discord</code>, <code>telegram</code>, <code>twitter</code></p>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">4</span>
                                Optional Fields
                            </h5>
                            <ul>
                                <li><strong>preferred_languages:</strong> Comma-separated ISO 639-1 language codes</li>
                                <li><strong>encryption:</strong> PGP key or link</li>
                                <li><strong>source_code:</strong> Source code repository URL</li>
                                <li><strong>source_release:</strong> Release version/tag</li>
                                <li><strong>source_revision:</strong> Git commit hash</li>
                                <li><strong>auditors:</strong> Comma-separated auditor list or link</li>
                                <li><strong>acknowledgements:</strong> Acknowledgements URL or text</li>
                                <li><strong>expiry:</strong> Expiry date (YYYY-MM-DD)</li>
                            </ul>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">5</span>
                                Build and Deploy
                            </h5>
                            <p>Build and deploy your program as usual. The security.txt will be embedded automatically:</p>
                            <CodeBlock>
{`anchor build --verifiable
anchor deploy --provider.cluster mainnet`}
                            </CodeBlock>
                        </div>

                        <div className="mt-4">
                            <h5>
                                <span className="badge bg-primary me-2">6</span>
                                View on Explorer
                            </h5>
                            <p>
                                After deployment, visit your program page on the explorer. You should see:
                            </p>
                            <ul>
                                <li>A green <span className="badge bg-success-soft">Included</span> badge next to &quot;Security.txt&quot; on the program account page</li>
                                <li>Full security.txt details on the <Link href="/address/verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh/security">Security tab</Link></li>
                            </ul>
                            <CodeBlock>
                                https://explorer.mainnet.x1.xyz/address/YOUR_PROGRAM_ID/security
                            </CodeBlock>
                        </div>

                        <div className="alert alert-info mt-3">
                            <strong>💡 Tip:</strong> See an example of security.txt in action on the{' '}
                            <Link href="/address/verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh/security">
                                X1 Verification Program
                            </Link>.
                        </div>

                        <div className="alert alert-warning mt-2">
                            <strong>⚠️ Important:</strong> If your program is used as a library dependency, wrap the security.txt macro 
                            with <code>#[cfg(not(feature = &quot;no-entrypoint&quot;))]</code> to avoid conflicts.
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4>How Verification Works</h4>
                        <ol>
                            <li><strong>Build Hash:</strong> When you deploy, the program binary is hashed</li>
                            <li><strong>On-Chain Storage:</strong> Your verification data (Git URL, commit, build args) is stored on-chain</li>
                            <li><strong>Hash Comparison:</strong> The explorer computes the program hash and compares it with the stored hash</li>
                            <li><strong>Verification Status:</strong> If hashes match, the program is marked as verified ✅</li>
                        </ol>
                        <div className="alert alert-success mt-2">
                            <strong>✅ Security:</strong> Verification data is stored on-chain in a Program Derived Account (PDA), 
                            making it tamper-proof and publicly verifiable.
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4>Troubleshooting</h4>
                        <h5 className="mt-3">Hash Mismatch</h5>
                        <p>If verification fails due to hash mismatch:</p>
                        <ul>
                            <li>Ensure you built with <code>--verifiable</code> flag</li>
                            <li>Verify you&apos;re using the exact commit that was deployed</li>
                            <li>Check that build arguments match exactly</li>
                        </ul>

                        <h5 className="mt-3">PDA Not Found</h5>
                        <p>If the explorer shows &quot;Source Code Not Provided&quot;:</p>
                        <ul>
                            <li>Verify the upload transaction succeeded</li>
                            <li>Check that you&apos;re using the correct program ID</li>
                            <li>Ensure your verifier keypair matches the one used to upload</li>
                        </ul>

                        <h5 className="mt-3">Transaction Failed</h5>
                        <p>If upload transaction fails:</p>
                        <ul>
                            <li>Check you have sufficient XNT for fees</li>
                            <li>Verify your RPC endpoint is correct</li>
                            <li>Ensure your keypair has the correct permissions</li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h4>API Endpoints</h4>
                        <p>The verification API provides the following endpoints:</p>
                        <ul>
                            <li><code>GET /health</code> - Health check</li>
                            <li><code>GET /api/program/:programId</code> - Get all verifications for a program</li>
                            <li><code>GET /api/program/:programId/verifier/:verifier</code> - Get specific verification</li>
                            <li><code>GET /status-all/:programId</code> - Explorer-compatible format</li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h4>Resources</h4>
                        <ul>
                            <li>
                                <strong>Verification Program:</strong>{' '}
                                <Link href="/address/verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh">
                                    verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh
                                </Link>
                            </li>
                            <li>
                                <strong>Example Verified Program:</strong>{' '}
                                <Link href="/address/verifyZt9Hkg3sscFx6xYy16BN9cQB3UfnGh55D8pXh">
                                    View on Explorer
                                </Link>
                            </li>
                            <li>
                                <strong>GitHub Repository:</strong>{' '}
                                <a href="https://github.com/Xenian84/x1-verify-program" target="_blank" rel="noopener noreferrer">
                                    x1-verify-program
                                </a>
                            </li>
                            <li>
                                <strong>Verification API:</strong>{' '}
                                <a href="https://verify.x1ns.xyz" target="_blank" rel="noopener noreferrer">
                                    verify.x1ns.xyz
                                </a>
                            </li>
                            <li>
                                <strong>Security.txt Crate:</strong>{' '}
                                <a href="https://github.com/Xenian84/x1-security-txt" target="_blank" rel="noopener noreferrer">
                                    x1-security-txt
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

