/**
 * SSH Config Validation
 * Validates SSH config entries and provides actionable error messages.
 */

import type { SSHHostConfig, ParsedSSHConfig } from './ssh-config'

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  severity: ValidationSeverity
  field?: string
  message: string
  hint?: string
}

export interface ValidationResult {
  isValid: boolean
  hasBlockingErrors: boolean
  issues: ValidationIssue[]
}

// Deprecated/weak algorithms that should trigger warnings
const DEPRECATED_CIPHERS = [
  '3des-cbc',
  'blowfish-cbc',
  'cast128-cbc',
  'arcfour',
  'arcfour128',
  'arcfour256',
]

const DEPRECATED_MACS = ['hmac-md5', 'hmac-md5-96', 'hmac-sha1-96', 'umac-64']

const DEPRECATED_KEY_EXCHANGE = [
  'diffie-hellman-group1-sha1',
  'diffie-hellman-group14-sha1',
]

/**
 * Validate a single host configuration
 */
export function validateHost(
  host: SSHHostConfig,
  existingHosts: string[] = [],
  isNewHost: boolean = false
): ValidationResult {
  const issues: ValidationIssue[] = []

  // === BLOCKING ERRORS ===

  // 1. Host alias is required
  if (!host.Host || !host.Host.trim()) {
    issues.push({
      severity: 'error',
      field: 'Host',
      message: 'Host alias is required',
      hint: 'Enter a short name you\'ll use to connect (e.g., "my-server")',
    })
  }

  // 2. Host alias cannot contain spaces
  if (host.Host && /\s/.test(host.Host)) {
    issues.push({
      severity: 'error',
      field: 'Host',
      message: 'Host alias cannot contain spaces',
      hint: 'Use hyphens or underscores instead (e.g., "my-server")',
    })
  }

  // 3. Duplicate host check (only for new hosts)
  if (isNewHost && host.Host && existingHosts.includes(host.Host)) {
    issues.push({
      severity: 'error',
      field: 'Host',
      message: 'A host with this alias already exists',
      hint: 'Choose a different alias name',
    })
  }

  // 4. Invalid port number
  if (host.Port !== undefined) {
    const port =
      typeof host.Port === 'string' ? parseInt(host.Port, 10) : host.Port
    if (isNaN(port) || port < 1 || port > 65535) {
      issues.push({
        severity: 'error',
        field: 'Port',
        message: 'Port must be between 1 and 65535',
        hint: 'Standard SSH port is 22',
      })
    }
  }

  // 5. HostName validation (if provided, must be valid)
  if (host.HostName) {
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

    if (
      !hostnameRegex.test(host.HostName) &&
      !ipv4Regex.test(host.HostName) &&
      !ipv6Regex.test(host.HostName)
    ) {
      issues.push({
        severity: 'error',
        field: 'HostName',
        message: 'Invalid hostname or IP address format',
        hint: 'Enter a valid domain name or IP address',
      })
    }
  }

  // === WARNINGS (non-blocking) ===

  // 1. Missing HostName for non-wildcard hosts
  if (host.Host && host.Host !== '*' && !host.HostName) {
    issues.push({
      severity: 'warning',
      field: 'HostName',
      message: 'No server address specified',
      hint: 'Add a HostName to specify where to connect',
    })
  }

  // 2. Missing IdentityFile
  if (!host.IdentityFile) {
    issues.push({
      severity: 'warning',
      field: 'IdentityFile',
      message: 'No identity file specified',
      hint: 'SSH will use default keys. Consider specifying a key for better security.',
    })
  }

  // 3. IdentityFile path validation
  if (host.IdentityFile) {
    const path = host.IdentityFile
    if (
      !path.startsWith('/') &&
      !path.startsWith('~') &&
      !path.startsWith('%')
    ) {
      issues.push({
        severity: 'warning',
        field: 'IdentityFile',
        message: 'Identity file path may be invalid',
        hint: 'Use an absolute path starting with / or ~ (e.g., ~/.ssh/id_ed25519)',
      })
    }
  }

  // 4. Check for deprecated algorithms in various fields
  checkDeprecatedValue(host, 'Ciphers', DEPRECATED_CIPHERS, issues)
  checkDeprecatedValue(host, 'MACs', DEPRECATED_MACS, issues)
  checkDeprecatedValue(host, 'KexAlgorithms', DEPRECATED_KEY_EXCHANGE, issues)

  // 5. StrictHostKeyChecking disabled
  if (host.StrictHostKeyChecking === 'no') {
    issues.push({
      severity: 'warning',
      field: 'StrictHostKeyChecking',
      message: 'Host key checking is disabled',
      hint: 'This makes you vulnerable to man-in-the-middle attacks. Only use for testing.',
    })
  }

  // 6. ForwardAgent enabled without IdentitiesOnly
  if (host.ForwardAgent === true && !host.IdentitiesOnly) {
    issues.push({
      severity: 'warning',
      field: 'ForwardAgent',
      message: 'Agent forwarding enabled without IdentitiesOnly',
      hint: 'Consider setting IdentitiesOnly to yes to limit which keys are offered',
    })
  }

  // Calculate result
  const hasBlockingErrors = issues.some((i) => i.severity === 'error')

  return {
    isValid: issues.length === 0,
    hasBlockingErrors,
    issues,
  }
}

/**
 * Validate entire SSH config
 */
export function validateConfig(config: ParsedSSHConfig): ValidationResult {
  const allIssues: ValidationIssue[] = []
  const hostAliases: string[] = []
  const duplicates = new Set<string>()

  // Check for duplicate hosts
  for (const host of config.hosts) {
    if (hostAliases.includes(host.Host)) {
      duplicates.add(host.Host)
    }
    hostAliases.push(host.Host)
  }

  // Report duplicates
  if (duplicates.size > 0) {
    for (const dup of duplicates) {
      allIssues.push({
        severity: 'error',
        message: `Duplicate host alias: ${dup}`,
        hint: 'Each host alias must be unique',
      })
    }
  }

  // Validate each host
  for (const host of config.hosts) {
    const result = validateHost(host, [], false)
    allIssues.push(
      ...result.issues.map((issue) => ({
        ...issue,
        message: `[${host.Host}] ${issue.message}`,
      }))
    )
  }

  const hasBlockingErrors = allIssues.some((i) => i.severity === 'error')

  return {
    isValid: allIssues.length === 0,
    hasBlockingErrors,
    issues: allIssues,
  }
}

/**
 * Check if a field contains deprecated values
 */
function checkDeprecatedValue(
  host: SSHHostConfig,
  field: string,
  deprecatedValues: string[],
  issues: ValidationIssue[]
): void {
  const value = host[field]
  if (typeof value !== 'string') return

  const values = value.split(',').map((v) => v.trim())
  const found = values.filter((v) => deprecatedValues.includes(v.toLowerCase()))

  if (found.length > 0) {
    issues.push({
      severity: 'warning',
      field,
      message: `Deprecated ${field.toLowerCase()}: ${found.join(', ')}`,
      hint: `These algorithms are considered weak. Consider using stronger alternatives.`,
    })
  }
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): string {
  const errorCount = result.issues.filter((i) => i.severity === 'error').length
  const warningCount = result.issues.filter(
    (i) => i.severity === 'warning'
  ).length

  if (errorCount === 0 && warningCount === 0) {
    return 'Configuration is valid'
  }

  const parts: string[] = []
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`)
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`)
  }

  return parts.join(', ')
}

/**
 * Filter issues by field
 */
export function getFieldIssues(
  result: ValidationResult,
  field: string
): ValidationIssue[] {
  return result.issues.filter((i) => i.field === field)
}

/**
 * Check if a field has errors
 */
export function fieldHasError(
  result: ValidationResult,
  field: string
): boolean {
  return result.issues.some((i) => i.field === field && i.severity === 'error')
}

/**
 * Check if a field has warnings
 */
export function fieldHasWarning(
  result: ValidationResult,
  field: string
): boolean {
  return result.issues.some(
    (i) => i.field === field && i.severity === 'warning'
  )
}
