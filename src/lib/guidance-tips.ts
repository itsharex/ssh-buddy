import type { TipType } from '@/components/common/ContextualTip'

export interface TipDefinition {
  id: string
  type: TipType
  title: string
  description: string
  suggestions?: string[]
  details?: string
}

// Multi-account platform tips
export const MULTI_ACCOUNT_PLATFORM_TIP: TipDefinition = {
  id: 'multi-account-platform',
  type: 'info',
  title: 'Multi-Account Platform',
  description:
    'This platform supports multiple accounts. If you have multiple accounts (e.g., personal and work), each account needs a different SSH key.',
  suggestions: [
    'Create a dedicated SSH key for each account',
    'Use different Host aliases to distinguish between accounts',
    'Make sure each Host config points to the correct key file',
  ],
  details:
    'SSH servers identify you by your key. If two Host configs use the same key, the server cannot distinguish which account you want to use. Therefore, each account needs its own key pair.',
}

export const SAME_KEY_WARNING: TipDefinition = {
  id: 'same-key-warning',
  type: 'warning',
  title: 'Same Key Warning',
  description: 'This key is already used by another config for the same platform.',
  suggestions: [
    'If this is the same account, you can continue using it',
    'If it\'s a different account, consider creating a new key for it',
  ],
  details:
    'When multiple Host configs use the same key to connect to the same platform, they are treated as the same account. If you want to use different accounts, you need a separate key for each.',
}

// Connection test educational tips
export const HOST_KEY_CHANGED_TIP: TipDefinition = {
  id: 'host-key-changed',
  type: 'warning',
  title: 'Why did this happen?',
  description:
    'The remote host\'s key has changed. This usually occurs when the server is reinstalled or the platform updates its keys.',
  suggestions: [
    'If this is an expected change (e.g., server reset), you can safely remove the old key',
    'If you\'re unsure why, consider verifying with the server administrator',
  ],
  details:
    'SSH records each server\'s public key (stored in ~/.ssh/known_hosts). When a server\'s key doesn\'t match the record, SSH blocks the connection to protect you from man-in-the-middle attacks.',
}

export const HOST_KEY_UNKNOWN_TIP: TipDefinition = {
  id: 'host-key-unknown',
  type: 'info',
  title: 'First-Time Connection',
  description: 'This is your first time connecting to this host. You need to verify and save its key.',
  suggestions: [
    'For well-known platforms (GitHub, GitLab, etc.), it\'s usually safe to add',
    'For private servers, consider verifying the key fingerprint with the administrator',
  ],
  details:
    'SSH uses a "Trust On First Use" (TOFU) model. On first connection, you need to confirm the server\'s identity. Afterwards, SSH will automatically verify the server key to prevent man-in-the-middle attacks.',
}

export const PERMISSION_DENIED_TIP: TipDefinition = {
  id: 'permission-denied',
  type: 'tip',
  title: 'Common Causes of Auth Failure',
  description: 'The server rejected your SSH key authentication.',
  suggestions: [
    'Verify the correct IdentityFile is specified in your Host config',
    'Confirm your public key is added to the remote service (e.g., GitHub SSH Keys settings)',
    'Check that key file permissions are correct (private key should be 600)',
  ],
  details:
    'Authentication failures usually occur because: 1) Wrong key is being used 2) Public key not added to remote service 3) Key file permissions are too open (SSH rejects insecure keys).',
}

// Platform detection patterns
export const MULTI_ACCOUNT_PLATFORMS = [
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'ssh.dev.azure.com',
]

export function isMultiAccountPlatform(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase()
  return MULTI_ACCOUNT_PLATFORMS.some(
    (platform) =>
      normalizedHost.includes(platform) || normalizedHost === platform
  )
}

export function getPlatformName(hostname: string): string | null {
  const normalizedHost = hostname.toLowerCase()
  if (normalizedHost.includes('github.com')) return 'GitHub'
  if (normalizedHost.includes('gitlab.com')) return 'GitLab'
  if (normalizedHost.includes('bitbucket.org')) return 'Bitbucket'
  if (normalizedHost.includes('ssh.dev.azure.com')) return 'Azure DevOps'
  return null
}
