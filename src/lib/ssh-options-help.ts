/**
 * SSH Options Help
 * Provides user-friendly explanations for SSH config options.
 */

export interface OptionHelp {
  label: string
  description: string
  example?: string
  learnMore?: string
}

export const SSH_OPTIONS_HELP: Record<string, OptionHelp> = {
  Host: {
    label: 'Host Alias',
    description:
      'A short name you\'ll use to connect. Instead of typing a long command, you can just use "ssh myserver".',
    example: 'my-server, production, dev-box',
  },
  HostName: {
    label: 'Server Address',
    description:
      'The actual address of the server you want to connect to. This can be an IP address or a domain name.',
    example: '192.168.1.100 or example.com',
  },
  User: {
    label: 'Username',
    description:
      'The username to log in as on the remote server. If not set, SSH will use your current username.',
    example: 'ubuntu, root, admin',
  },
  Port: {
    label: 'Port',
    description:
      'The network port to connect on. The default SSH port is 22, but some servers use different ports for security.',
    example: '22 (default), 2222',
  },
  IdentityFile: {
    label: 'SSH Key',
    description:
      'Path to the private key file to use for authentication. Keys provide secure, password-free login.',
    example: '~/.ssh/id_ed25519',
  },
  IdentitiesOnly: {
    label: 'Use Only Specified Key',
    description:
      'When enabled, SSH will only use the key you specify, ignoring other keys in your agent. Useful when you have many keys.',
    example: 'yes or no',
  },
  ProxyJump: {
    label: 'Jump Host',
    description:
      'Connect through another SSH host first. Useful for accessing servers behind a firewall or bastion host.',
    example: 'bastion (uses another host alias)',
  },
  ProxyCommand: {
    label: 'Proxy Command',
    description:
      'A custom command to establish the connection. Advanced users can use this for complex networking setups.',
    example: 'ssh -W %h:%p bastion',
  },
  ForwardAgent: {
    label: 'Forward SSH Agent',
    description:
      'Share your local SSH keys with the remote server, allowing it to use your keys for further connections.',
    example: 'yes or no',
  },
  AddKeysToAgent: {
    label: 'Add Keys to Agent',
    description:
      "Automatically add your key to the SSH agent when first used, so you don't need to enter your passphrase again.",
    example: 'yes or no',
  },
  UseKeychain: {
    label: 'Use macOS Keychain',
    description:
      'Store your key passphrase in the macOS Keychain for automatic unlocking. macOS only.',
    example: 'yes or no',
  },
  ServerAliveInterval: {
    label: 'Keep-Alive Interval',
    description:
      'Send a signal to the server every X seconds to keep the connection alive. Prevents disconnections during idle periods.',
    example: '60 (seconds)',
  },
  ServerAliveCountMax: {
    label: 'Keep-Alive Retries',
    description:
      'How many keep-alive signals to send before considering the connection dead.',
    example: '3',
  },
  StrictHostKeyChecking: {
    label: 'Host Key Verification',
    description:
      "Controls whether SSH verifies the server's identity. Disabling this is insecure but useful for testing.",
    example: 'yes, no, or accept-new',
  },
  UserKnownHostsFile: {
    label: 'Known Hosts File',
    description:
      "Path to the file that stores trusted server fingerprints. Usually you don't need to change this.",
    example: '~/.ssh/known_hosts',
  },
  Compression: {
    label: 'Enable Compression',
    description:
      'Compress data during transfer. Can speed up connections on slow networks but uses more CPU.',
    example: 'yes or no',
  },
  LogLevel: {
    label: 'Log Verbosity',
    description:
      'How much detail to show in logs. Useful for debugging connection issues.',
    example: 'QUIET, ERROR, INFO, DEBUG',
  },
  LocalForward: {
    label: 'Local Port Forward',
    description:
      'Forward a local port to a remote address. Access remote services as if they were local.',
    example: '8080:localhost:80',
  },
  RemoteForward: {
    label: 'Remote Port Forward',
    description:
      'Forward a remote port back to your local machine. Let remote servers access your local services.',
    example: '8080:localhost:80',
  },
  DynamicForward: {
    label: 'SOCKS Proxy',
    description:
      'Create a SOCKS proxy on a local port. Route traffic through the remote server.',
    example: '1080',
  },
  RequestTTY: {
    label: 'Request Terminal',
    description:
      'Whether to request a terminal (TTY) on the remote server. Needed for interactive sessions.',
    example: 'yes, no, or auto',
  },
  Ciphers: {
    label: 'Encryption Algorithms',
    description:
      'Which encryption algorithms to use. Usually the defaults are secure, but some old servers need specific ciphers.',
    example: 'aes256-gcm@openssh.com',
  },
  MACs: {
    label: 'MAC Algorithms',
    description:
      'Message authentication codes to verify data integrity. The defaults are usually fine.',
    example: 'hmac-sha2-256',
  },
  KexAlgorithms: {
    label: 'Key Exchange Algorithms',
    description:
      'Algorithms for securely exchanging encryption keys. Only change if needed for compatibility.',
    example: 'curve25519-sha256',
  },
}

/**
 * Get help for a specific SSH option
 */
export function getOptionHelp(option: string): OptionHelp | undefined {
  return SSH_OPTIONS_HELP[option]
}

/**
 * Get all option names that have help available
 */
export function getAvailableHelpOptions(): string[] {
  return Object.keys(SSH_OPTIONS_HELP)
}
