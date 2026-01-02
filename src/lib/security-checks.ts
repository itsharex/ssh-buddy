/**
 * Security and Health Checks
 * Scans SSH keys and known_hosts for potential issues.
 */

import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import { getSSHDir } from './ssh-service'
import type { SSHKeyInfo } from './ssh-service'

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface SecurityIssue {
  id: string
  severity: IssueSeverity
  title: string
  description: string
  affectedItem?: string
  suggestion?: string
  action?: {
    label: string
    type: 'fix' | 'learn'
  }
}

export interface KeyHealthResult {
  key: SSHKeyInfo
  issues: SecurityIssue[]
  isHealthy: boolean
}

export interface KnownHostEntry {
  lineNumber: number
  hosts: string[]
  keyType: string
  publicKey: string
  raw: string
}

export interface KnownHostsResult {
  entries: KnownHostEntry[]
  issues: SecurityIssue[]
  path: string
}

export interface SecurityScanResult {
  keyHealth: KeyHealthResult[]
  knownHosts: KnownHostsResult
  overallIssues: SecurityIssue[]
  timestamp: number
}

// Recommended alternatives for weak key types
const WEAK_KEY_TYPE_ALTERNATIVES: Record<string, string> = {
  dsa: 'Ed25519 or RSA (4096-bit)',
  rsa: 'Ed25519',
}

/**
 * Check health of SSH keys
 */
export async function checkKeyHealth(
  keys: SSHKeyInfo[]
): Promise<KeyHealthResult[]> {
  const results: KeyHealthResult[] = []

  for (const key of keys) {
    const issues: SecurityIssue[] = []

    // Check for missing public key
    if (!key.hasPublicKey) {
      issues.push({
        id: `key-no-pub-${key.name}`,
        severity: 'warning',
        title: 'Missing Public Key',
        description: `The private key "${key.name}" has no corresponding .pub file.`,
        affectedItem: key.name,
        suggestion: 'Generate the public key or recreate the key pair.',
        action: {
          label: 'Learn how to fix',
          type: 'learn',
        },
      })
    }

    // Check for deprecated key types
    if (key.type === 'dsa') {
      issues.push({
        id: `key-insecure-${key.name}`,
        severity: 'error',
        title: 'Insecure Key Type',
        description: `"${key.name}" uses DSA which is deprecated and no longer considered secure.`,
        affectedItem: key.name,
        suggestion: `Generate a new ${WEAK_KEY_TYPE_ALTERNATIVES.dsa} key instead.`,
        action: {
          label: 'Generate new key',
          type: 'fix',
        },
      })
    }

    // RSA key size check
    if (key.type === 'rsa') {
      const bitSize = key.bitSize
      if (bitSize) {
        if (bitSize < 2048) {
          // Less than 2048 bits is insecure
          issues.push({
            id: `key-rsa-weak-${key.name}`,
            severity: 'error',
            title: 'Weak RSA Key',
            description: `"${key.name}" uses ${bitSize}-bit RSA which is considered insecure.`,
            affectedItem: key.name,
            suggestion:
              'Generate a new key with at least 3072 bits, or preferably use Ed25519.',
            action: {
              label: 'Generate new key',
              type: 'fix',
            },
          })
        } else if (bitSize < 3072) {
          // 2048 bits is acceptable but not recommended
          issues.push({
            id: `key-rsa-short-${key.name}`,
            severity: 'warning',
            title: 'Short RSA Key',
            description: `"${key.name}" uses ${bitSize}-bit RSA. NIST recommends at least 3072 bits.`,
            affectedItem: key.name,
            suggestion:
              'Consider generating a 4096-bit RSA key or switching to Ed25519.',
          })
        } else {
          // 3072+ bits is acceptable
          issues.push({
            id: `key-rsa-info-${key.name}`,
            severity: 'info',
            title: `RSA ${bitSize}-bit`,
            description: `"${key.name}" uses ${bitSize}-bit RSA which is secure.`,
            affectedItem: key.name,
            suggestion:
              'Ed25519 offers similar security with better performance.',
          })
        }
      } else {
        // Couldn't determine bit size
        issues.push({
          id: `key-rsa-unknown-${key.name}`,
          severity: 'info',
          title: 'RSA Key',
          description: `"${key.name}" uses RSA. Could not determine key size.`,
          affectedItem: key.name,
          suggestion:
            'Consider using Ed25519 for better security and performance.',
        })
      }
    }

    // Unknown key type
    if (key.type === 'unknown') {
      issues.push({
        id: `key-unknown-${key.name}`,
        severity: 'info',
        title: 'Unknown Key Type',
        description: `Could not determine the type of key "${key.name}".`,
        affectedItem: key.name,
      })
    }

    results.push({
      key,
      issues,
      isHealthy: issues.filter((i) => i.severity !== 'info').length === 0,
    })
  }

  return results
}

/**
 * Parse and check known_hosts file
 */
export async function checkKnownHosts(): Promise<KnownHostsResult> {
  const sshDir = await getSSHDir()
  const knownHostsPath = `${sshDir}/known_hosts`
  const entries: KnownHostEntry[] = []
  const issues: SecurityIssue[] = []

  const fileExists = await exists(knownHostsPath)
  if (!fileExists) {
    return {
      entries: [],
      issues: [
        {
          id: 'known-hosts-missing',
          severity: 'info',
          title: 'No Known Hosts',
          description: 'The known_hosts file does not exist yet.',
          suggestion: 'It will be created when you first connect to a server.',
        },
      ],
      path: knownHostsPath,
    }
  }

  try {
    const content = await readTextFile(knownHostsPath)
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) continue

      const parsed = parseKnownHostLine(line, i + 1)
      if (parsed) {
        entries.push(parsed)

        // Check for weak key types in known_hosts
        if (parsed.keyType === 'ssh-dss') {
          issues.push({
            id: `known-host-dss-${i}`,
            severity: 'warning',
            title: 'Weak Host Key',
            description: `Host "${parsed.hosts[0]}" uses DSA which is deprecated.`,
            affectedItem: parsed.hosts[0],
            suggestion: 'The server should update its host key.',
          })
        }

        // Check for old RSA without SHA-2
        if (parsed.keyType === 'ssh-rsa') {
          issues.push({
            id: `known-host-rsa-${i}`,
            severity: 'info',
            title: 'Legacy RSA Host Key',
            description: `Host "${parsed.hosts[0]}" uses ssh-rsa. Modern servers use rsa-sha2 variants.`,
            affectedItem: parsed.hosts[0],
          })
        }
      }
    }

    // Check for duplicate entries (same host + same key type = duplicate)
    // Note: Same host with different key types (ed25519, rsa, ecdsa) is normal
    const hostKeyTypeCounts = new Map<string, number>()
    for (const entry of entries) {
      for (const host of entry.hosts) {
        const key = `${host}:${entry.keyType}`
        hostKeyTypeCounts.set(key, (hostKeyTypeCounts.get(key) || 0) + 1)
      }
    }

    for (const [hostKeyType, count] of hostKeyTypeCounts) {
      if (count > 1) {
        const [host, keyType] = hostKeyType.split(':')
        issues.push({
          id: `known-host-dup-${hostKeyType}`,
          severity: 'warning',
          title: 'Duplicate Host Entry',
          description: `"${host}" has ${count} entries with the same key type (${keyType}).`,
          affectedItem: host,
          suggestion: 'Remove duplicate entries to avoid confusion.',
          action: {
            label: 'Clean up',
            type: 'fix',
          },
        })
      }
    }
  } catch (error) {
    issues.push({
      id: 'known-hosts-error',
      severity: 'error',
      title: 'Error Reading Known Hosts',
      description: `Failed to read known_hosts: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return {
    entries,
    issues,
    path: knownHostsPath,
  }
}

/**
 * Remove a known_hosts entry
 */
export async function removeKnownHostEntry(lineNumber: number): Promise<void> {
  const sshDir = await getSSHDir()
  const knownHostsPath = `${sshDir}/known_hosts`

  const content = await readTextFile(knownHostsPath)
  const lines = content.split('\n')

  // Remove the line (lineNumber is 1-indexed)
  lines.splice(lineNumber - 1, 1)

  await writeTextFile(knownHostsPath, lines.join('\n'))
}

/**
 * Remove known_hosts entries by host name
 */
export async function removeKnownHostByName(hostname: string): Promise<number> {
  const sshDir = await getSSHDir()
  const knownHostsPath = `${sshDir}/known_hosts`

  const content = await readTextFile(knownHostsPath)
  const lines = content.split('\n')
  let removedCount = 0

  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return true

    const parsed = parseKnownHostLine(trimmed, 0)
    if (
      parsed &&
      parsed.hosts.some((h) => h === hostname || h.includes(hostname))
    ) {
      removedCount++
      return false
    }
    return true
  })

  await writeTextFile(knownHostsPath, filteredLines.join('\n'))
  return removedCount
}

/**
 * Parse a single known_hosts line
 */
function parseKnownHostLine(
  line: string,
  lineNumber: number
): KnownHostEntry | null {
  // Format: host1,host2 key-type base64-key [comment]
  // Or hashed: |1|salt|hash key-type base64-key
  const parts = line.split(/\s+/)
  if (parts.length < 3) return null

  const hostsStr = parts[0]
  const keyType = parts[1]
  const publicKey = parts[2]

  // Parse hosts (comma-separated or hashed)
  let hosts: string[]
  if (hostsStr.startsWith('|')) {
    // Hashed entry
    hosts = ['[hashed]']
  } else {
    hosts = hostsStr.split(',')
  }

  return {
    lineNumber,
    hosts,
    keyType,
    publicKey,
    raw: line,
  }
}

/**
 * Run a full security scan
 */
export async function runSecurityScan(
  keys: SSHKeyInfo[]
): Promise<SecurityScanResult> {
  const keyHealth = await checkKeyHealth(keys)
  const knownHosts = await checkKnownHosts()

  // Aggregate overall issues
  const overallIssues: SecurityIssue[] = []

  // Count issues by severity
  let errorCount = 0
  let warningCount = 0

  for (const kh of keyHealth) {
    for (const issue of kh.issues) {
      if (issue.severity === 'error') errorCount++
      if (issue.severity === 'warning') warningCount++
    }
  }

  for (const issue of knownHosts.issues) {
    if (issue.severity === 'error') errorCount++
    if (issue.severity === 'warning') warningCount++
  }

  // Add summary issue if there are problems
  if (errorCount > 0 || warningCount > 0) {
    overallIssues.push({
      id: 'scan-summary',
      severity: errorCount > 0 ? 'error' : 'warning',
      title: 'Security Issues Found',
      description: `Found ${errorCount} errors and ${warningCount} warnings in your SSH configuration.`,
      suggestion: 'Review the detailed findings below.',
    })
  }

  return {
    keyHealth,
    knownHosts,
    overallIssues,
    timestamp: Date.now(),
  }
}

/**
 * Get a summary of the security scan
 */
export function getScanSummary(result: SecurityScanResult): {
  status: 'healthy' | 'warning' | 'error'
  message: string
} {
  let errorCount = 0
  let warningCount = 0

  for (const kh of result.keyHealth) {
    for (const issue of kh.issues) {
      if (issue.severity === 'error') errorCount++
      if (issue.severity === 'warning') warningCount++
    }
  }

  for (const issue of result.knownHosts.issues) {
    if (issue.severity === 'error') errorCount++
    if (issue.severity === 'warning') warningCount++
  }

  if (errorCount > 0) {
    return {
      status: 'error',
      message: `${errorCount} security issue${errorCount > 1 ? 's' : ''} found`,
    }
  }

  if (warningCount > 0) {
    return {
      status: 'warning',
      message: `${warningCount} warning${warningCount > 1 ? 's' : ''} found`,
    }
  }

  return {
    status: 'healthy',
    message: 'No issues found',
  }
}
