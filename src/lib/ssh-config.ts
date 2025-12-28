/**
 * SSH Config Parser and Serializer
 * Handles reading, parsing, and writing SSH config files
 */

// Common SSH config options
export interface SSHHostConfig {
  Host: string
  HostName?: string
  User?: string
  Port?: number
  IdentityFile?: string
  IdentitiesOnly?: boolean
  ProxyJump?: string
  ProxyCommand?: string
  ForwardAgent?: boolean
  AddKeysToAgent?: boolean
  UseKeychain?: boolean
  ServerAliveInterval?: number
  ServerAliveCountMax?: number
  StrictHostKeyChecking?: string
  UserKnownHostsFile?: string
  LogLevel?: string
  Compression?: boolean
  // Allow any other SSH options
  [key: string]: string | number | boolean | undefined
}

// Represents a line in the config file
export type ConfigLine =
  | { type: 'comment'; content: string }
  | { type: 'blank' }
  | { type: 'global'; key: string; value: string }
  | { type: 'host'; name: string }
  | { type: 'option'; key: string; value: string }

// Parsed SSH config structure
export interface ParsedSSHConfig {
  lines: ConfigLine[]
  hosts: SSHHostConfig[]
}

/**
 * Parse SSH config file content
 */
export function parseSSHConfig(content: string): ParsedSSHConfig {
  const lines: ConfigLine[] = []
  const hosts: SSHHostConfig[] = []
  let currentHost: SSHHostConfig | null = null

  const rawLines = content.split('\n')

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim()

    // Blank line
    if (trimmed === '') {
      lines.push({ type: 'blank' })
      continue
    }

    // Comment
    if (trimmed.startsWith('#')) {
      lines.push({ type: 'comment', content: rawLine })
      continue
    }

    // Parse key-value pair
    const match = trimmed.match(/^(\S+)\s+(.+)$/)
    if (!match) {
      // Malformed line, treat as comment
      lines.push({ type: 'comment', content: rawLine })
      continue
    }

    const [, key, value] = match
    const normalizedKey = normalizeKey(key)

    // Host directive starts a new block
    if (normalizedKey === 'Host') {
      // Save previous host if exists
      if (currentHost) {
        hosts.push(currentHost)
      }

      currentHost = { Host: value }
      lines.push({ type: 'host', name: value })
      continue
    }

    // Option within a host block or global option
    if (currentHost) {
      lines.push({ type: 'option', key, value })
      setHostOption(currentHost, normalizedKey, value)
    } else {
      // Global option (like Include)
      lines.push({ type: 'global', key, value })
    }
  }

  // Don't forget the last host
  if (currentHost) {
    hosts.push(currentHost)
  }

  return { lines, hosts }
}

/**
 * Serialize SSH config back to string
 */
export function serializeSSHConfig(config: ParsedSSHConfig): string {
  const outputLines: string[] = []

  for (const line of config.lines) {
    switch (line.type) {
      case 'blank':
        outputLines.push('')
        break
      case 'comment':
        outputLines.push(line.content)
        break
      case 'global':
        outputLines.push(`${line.key} ${line.value}`)
        break
      case 'host':
        outputLines.push(`Host ${line.name}`)
        break
      case 'option':
        outputLines.push(`  ${line.key} ${line.value}`)
        break
    }
  }

  return outputLines.join('\n')
}

/**
 * Add a new host to the config
 */
export function addHost(
  config: ParsedSSHConfig,
  host: SSHHostConfig
): ParsedSSHConfig {
  const newLines: ConfigLine[] = [...config.lines]
  const newHosts: SSHHostConfig[] = [...config.hosts]

  // Add blank line before new host if needed
  if (newLines.length > 0 && newLines[newLines.length - 1].type !== 'blank') {
    newLines.push({ type: 'blank' })
  }

  // Add host line
  newLines.push({ type: 'host', name: host.Host })

  // Add all options
  for (const [key, value] of Object.entries(host)) {
    if (key === 'Host' || value === undefined) continue
    newLines.push({ type: 'option', key, value: String(value) })
  }

  newHosts.push(host)

  return { lines: newLines, hosts: newHosts }
}

/**
 * Update an existing host in the config
 */
export function updateHost(
  config: ParsedSSHConfig,
  oldHostName: string,
  newHost: SSHHostConfig
): ParsedSSHConfig {
  const newLines: ConfigLine[] = []
  const newHosts: SSHHostConfig[] = []
  let inTargetHost = false
  let skipOptions = false

  for (const line of config.lines) {
    if (line.type === 'host') {
      if (line.name === oldHostName) {
        // Found the host to update
        inTargetHost = true
        skipOptions = true

        // Add updated host
        newLines.push({ type: 'host', name: newHost.Host })
        for (const [key, value] of Object.entries(newHost)) {
          if (key === 'Host' || value === undefined) continue
          newLines.push({ type: 'option', key, value: String(value) })
        }
        newHosts.push(newHost)
      } else {
        // Different host, reset flags
        inTargetHost = false
        skipOptions = false
        newLines.push(line)

        const existingHost = config.hosts.find((h) => h.Host === line.name)
        if (existingHost) {
          newHosts.push(existingHost)
        }
      }
    } else if (line.type === 'option' && skipOptions) {
      // Skip old options for the target host
      continue
    } else {
      if (line.type === 'blank' && inTargetHost) {
        inTargetHost = false
        skipOptions = false
      }
      newLines.push(line)
    }
  }

  return { lines: newLines, hosts: newHosts }
}

/**
 * Remove a host from the config
 */
export function removeHost(
  config: ParsedSSHConfig,
  hostName: string
): ParsedSSHConfig {
  const newLines: ConfigLine[] = []
  const newHosts: SSHHostConfig[] = []
  let skipUntilNextHost = false
  let lastWasBlank = false

  for (const line of config.lines) {
    if (line.type === 'host') {
      if (line.name === hostName) {
        skipUntilNextHost = true
        continue
      } else {
        skipUntilNextHost = false
        newLines.push(line)
        const existingHost = config.hosts.find((h) => h.Host === line.name)
        if (existingHost) {
          newHosts.push(existingHost)
        }
      }
    } else if (skipUntilNextHost) {
      if (line.type === 'blank') {
        skipUntilNextHost = false
        // Don't add consecutive blank lines
        if (!lastWasBlank) {
          newLines.push(line)
        }
      }
      continue
    } else {
      newLines.push(line)
    }

    lastWasBlank = line.type === 'blank'
  }

  // Remove trailing blank lines
  while (
    newLines.length > 0 &&
    newLines[newLines.length - 1].type === 'blank'
  ) {
    newLines.pop()
  }

  return { lines: newLines, hosts: newHosts }
}

/**
 * Create a new empty config
 */
export function createEmptyConfig(): ParsedSSHConfig {
  return { lines: [], hosts: [] }
}

/**
 * Create a default host config
 */
export function createDefaultHost(name: string): SSHHostConfig {
  return {
    Host: name,
    HostName: '',
    User: '',
    IdentityFile: '',
  }
}

// Helper functions

function normalizeKey(key: string): string {
  // SSH config keys are case-insensitive, normalize to standard casing
  const keyMap: Record<string, string> = {
    host: 'Host',
    hostname: 'HostName',
    user: 'User',
    port: 'Port',
    identityfile: 'IdentityFile',
    identitiesonly: 'IdentitiesOnly',
    proxyjump: 'ProxyJump',
    proxycommand: 'ProxyCommand',
    forwardagent: 'ForwardAgent',
    addkeystoagent: 'AddKeysToAgent',
    usekeychain: 'UseKeychain',
    serveraliveinterval: 'ServerAliveInterval',
    serveralivecountmax: 'ServerAliveCountMax',
    stricthostkeychecking: 'StrictHostKeyChecking',
    userknownhostsfile: 'UserKnownHostsFile',
    loglevel: 'LogLevel',
    compression: 'Compression',
    include: 'Include',
  }

  return keyMap[key.toLowerCase()] || key
}

function setHostOption(host: SSHHostConfig, key: string, value: string): void {
  // Convert value to appropriate type
  const booleanKeys = [
    'IdentitiesOnly',
    'ForwardAgent',
    'AddKeysToAgent',
    'UseKeychain',
    'Compression',
  ]
  const numberKeys = ['Port', 'ServerAliveInterval', 'ServerAliveCountMax']

  if (booleanKeys.includes(key)) {
    host[key] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true'
  } else if (numberKeys.includes(key)) {
    host[key] = parseInt(value, 10)
  } else {
    host[key] = value
  }
}

/**
 * Get display name for a host (handles wildcards)
 */
export function getHostDisplayName(host: SSHHostConfig): string {
  if (host.Host === '*') {
    return 'Default (all hosts)'
  }
  return host.Host
}

/**
 * Check if a host matches a pattern
 */
export function hostMatchesPattern(hostname: string, pattern: string): boolean {
  if (pattern === '*') return true

  // Convert SSH pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')

  return new RegExp(`^${regexPattern}$`).test(hostname)
}
