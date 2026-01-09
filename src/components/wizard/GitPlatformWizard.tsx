import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Github,
  GitlabIcon,
  Key,
  Copy,
  FileCode,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react'

// Custom Bitbucket icon
const BitbucketIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="currentColor"
    className={className}
  >
    <path d="M22.2 32c-2.1 0-4.2 .4-6.1 1.1s-3.7 1.9-5.2 3.4-2.7 3.2-3.5 5.1-1.3 4-1.3 6.1c0 .9 .1 1.9 .2 2.8L74.1 462.7c.8 5.1 3.4 9.7 7.3 13s8.8 5.2 14 5.2l325.7 0c3.8 .1 7.5-1.3 10.5-3.7s4.9-5.9 5.5-9.7L505 50.7c.7-4.2-.3-8.4-2.8-11.9s-6.2-5.7-10.4-6.4c-.9-.1-1.9-.2-2.8-.2L22.2 32zM308.1 329.8l-104 0-28.1-147 157.3 0-25.2 147z" />
  </svg>
)
import { open as shellOpen } from '@tauri-apps/plugin-shell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/common'
import type { SSHHostConfig } from '@/lib/ssh-config'
import type { SSHKeyInfo } from '@/lib/ssh-service'
import { testSSHConnection } from '@/lib/ssh-service'
import { GitCommandsPanel } from '@/components/hosts/GitCommandsPanel'

type WizardStep = 'platform' | 'welcome' | 'key' | 'copy' | 'config' | 'test'

type AccountType = 'primary' | 'work' | 'personal' | 'custom'

type Platform = 'github' | 'gitlab' | 'bitbucket'

interface PlatformConfig {
  id: Platform
  name: string
  icon: React.ComponentType<{ className?: string }>
  hostname: string
  sshSettingsUrl: string
  defaultAlias: string
  aliasPrefix: string
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    hostname: 'github.com',
    sshSettingsUrl: 'https://github.com/settings/ssh/new',
    defaultAlias: 'github.com',
    aliasPrefix: 'github',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: GitlabIcon,
    hostname: 'gitlab.com',
    sshSettingsUrl: 'https://gitlab.com/-/user_settings/ssh_keys',
    defaultAlias: 'gitlab.com',
    aliasPrefix: 'gitlab',
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: BitbucketIcon,
    hostname: 'bitbucket.org',
    sshSettingsUrl: 'https://bitbucket.org/account/settings/ssh-keys/',
    defaultAlias: 'bitbucket.org',
    aliasPrefix: 'bitbucket',
  },
]

interface GitPlatformWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hosts: SSHHostConfig[]
  keys: SSHKeyInfo[]
  onAddHost: (host: SSHHostConfig) => Promise<void>
  onGenerateKey: (options: {
    name: string
    type: 'ed25519' | 'rsa'
    comment?: string
    passphrase?: string
  }) => Promise<void>
  onGetPublicKey: (keyName: string) => Promise<string>
  /** Pre-select a specific platform, skips platform selection step */
  defaultPlatform?: Platform
}

const STEPS: WizardStep[] = [
  'platform',
  'welcome',
  'key',
  'copy',
  'config',
  'test',
]

// Step info will be dynamically generated based on selected platform
const getStepInfo = (
  step: WizardStep,
  platform: PlatformConfig
): {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
} => {
  switch (step) {
    case 'platform':
      return {
        title: 'Choose Platform',
        description: 'Select your Git hosting service',
        icon: Github,
      }
    case 'welcome':
      return {
        title: `Connect to ${platform.name}`,
        description: 'Set up SSH connection in a few steps',
        icon: platform.icon,
      }
    case 'key':
      return {
        title: 'Choose SSH Key',
        description: `Select or generate a key for ${platform.name}`,
        icon: Key,
      }
    case 'copy':
      return {
        title: `Add Key to ${platform.name}`,
        description: `Copy your public key to ${platform.name}`,
        icon: Copy,
      }
    case 'config':
      return {
        title: 'Create Configuration',
        description: 'Set up your SSH config',
        icon: FileCode,
      }
    case 'test':
      return {
        title: 'Test Connection',
        description: 'Verify everything works',
        icon: CheckCircle2,
      }
  }
}

export function GitPlatformWizard({
  open,
  onOpenChange,
  hosts,
  keys,
  onAddHost,
  onGenerateKey,
  onGetPublicKey,
  defaultPlatform,
}: GitPlatformWizardProps) {
  const { addToast } = useToast()
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    defaultPlatform ? 'welcome' : 'platform'
  )
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // Platform state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    defaultPlatform || 'github'
  )

  // Get current platform config
  const platform = useMemo(
    () => PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0],
    [selectedPlatform]
  )

  // Wizard state
  const [accountType, setAccountType] = useState<AccountType>('primary')
  const [customAlias, setCustomAlias] = useState('')
  const [selectedKeyName, setSelectedKeyName] = useState<string | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPassphrase, setNewKeyPassphrase] = useState('')
  const [newKeyComment, setNewKeyComment] = useState('')
  const [publicKeyContent, setPublicKeyContent] = useState('')
  const [isLoadingPublicKey, setIsLoadingPublicKey] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isCreatingConfig, setIsCreatingConfig] = useState(false)
  const [configCreated, setConfigCreated] = useState(false) // Track if config was already created
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Detect existing hosts for current platform
  const existingPlatformHosts = useMemo(() => {
    return hosts.filter(
      (h) =>
        h.HostName?.toLowerCase().includes(platform.hostname) ||
        h.Host?.toLowerCase().includes(platform.aliasPrefix)
    )
  }, [hosts, platform])

  const hasExistingPlatform = existingPlatformHosts.length > 0

  // Generate suggested alias based on account type and platform
  const suggestedAlias = useMemo(() => {
    if (accountType === 'primary' && !hasExistingPlatform) {
      return platform.defaultAlias
    }
    if (accountType === 'work') return `${platform.aliasPrefix}-work`
    if (accountType === 'personal') return `${platform.aliasPrefix}-personal`
    if (accountType === 'custom')
      return customAlias || `${platform.aliasPrefix}-custom`
    // If has existing, default to work
    return `${platform.aliasPrefix}-work`
  }, [accountType, hasExistingPlatform, customAlias, platform])

  // Generate suggested key name
  const suggestedKeyName = useMemo(() => {
    if (suggestedAlias === platform.defaultAlias)
      return `id_ed25519_${platform.aliasPrefix}`
    return `id_ed25519_${suggestedAlias.replace(/[.-]/g, '_')}`
  }, [suggestedAlias, platform])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(defaultPlatform ? 'welcome' : 'platform')
      setSelectedPlatform(defaultPlatform || 'github')
      setAccountType('primary')
      setCustomAlias('')
      setSelectedKeyName(null)
      setNewKeyName('')
      setNewKeyPassphrase('')
      setNewKeyComment('')
      setPublicKeyContent('')
      setIsCopied(false)
      setConfigCreated(false)
      setTestResult(null)
    }
  }, [open, defaultPlatform])

  // Reset account type and key name when platform changes
  useEffect(() => {
    setAccountType(hasExistingPlatform ? 'work' : 'primary')
    setNewKeyName('')
    setNewKeyComment('')
  }, [hasExistingPlatform, selectedPlatform])

  // Update suggested key name when it changes
  useEffect(() => {
    if (!selectedKeyName && !newKeyName) {
      setNewKeyName(suggestedKeyName)
    }
  }, [suggestedKeyName, selectedKeyName, newKeyName])

  const currentStepIndex = STEPS.indexOf(currentStep)
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === STEPS.length - 1
  const stepInfo = getStepInfo(currentStep, platform)

  // Check if user has made progress (not on first step, or has selected a key)
  const hasProgress = currentStepIndex > 0 || selectedKeyName !== null

  // Handle close with confirmation
  const handleClose = useCallback(
    (forceClose = false) => {
      if (forceClose || !hasProgress) {
        setShowCloseConfirm(false)
        onOpenChange(false)
      } else {
        setShowCloseConfirm(true)
      }
    },
    [hasProgress, onOpenChange]
  )

  const handleConfirmClose = () => {
    setShowCloseConfirm(false)
    onOpenChange(false)
  }

  const handleCancelClose = () => {
    setShowCloseConfirm(false)
  }

  // Load public key when entering copy step
  useEffect(() => {
    if (currentStep === 'copy' && selectedKeyName && !publicKeyContent) {
      setIsLoadingPublicKey(true)
      onGetPublicKey(selectedKeyName)
        .then(setPublicKeyContent)
        .catch((err) => {
          addToast({
            type: 'error',
            title: 'Failed to load public key',
            description: err.message,
          })
        })
        .finally(() => setIsLoadingPublicKey(false))
    }
  }, [currentStep, selectedKeyName, publicKeyContent, onGetPublicKey, addToast])

  const handleNext = async () => {
    if (currentStep === 'key') {
      // Validate key selection
      if (!selectedKeyName) {
        addToast({
          type: 'error',
          title: 'No key selected',
          description: 'Please select or generate a key',
        })
        return
      }
    }

    if (currentStep === 'config') {
      // Create the configuration
      await handleCreateConfig()
      return
    }

    if (isLast) {
      onOpenChange(false)
    } else {
      setCurrentStep(STEPS[currentStepIndex + 1])
    }
  }

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep(STEPS[currentStepIndex - 1])
    }
  }

  const handleGenerateNewKey = async () => {
    if (!newKeyName.trim()) {
      addToast({
        type: 'error',
        title: 'Key name required',
        description: 'Please enter a name for the key',
      })
      return
    }

    // Check if key already exists
    if (keys.some((k) => k.name === newKeyName)) {
      addToast({
        type: 'error',
        title: 'Key already exists',
        description: `A key named "${newKeyName}" already exists`,
      })
      return
    }

    setIsGeneratingKey(true)
    try {
      const defaultComment =
        `${platform.name} ${accountType === 'work' ? 'Work' : accountType === 'personal' ? 'Personal' : ''} Account`.replace(
          /\s+/g,
          ' '
        )
      await onGenerateKey({
        name: newKeyName,
        type: 'ed25519',
        comment: newKeyComment.trim() || defaultComment,
        passphrase: newKeyPassphrase || undefined,
      })
      setSelectedKeyName(newKeyName)
      addToast({
        type: 'success',
        title: 'Key generated',
        description: `Created ${newKeyName}`,
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to generate key',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const handleCopyPublicKey = async () => {
    try {
      await navigator.clipboard.writeText(publicKeyContent)
      setIsCopied(true)
      addToast({
        type: 'success',
        title: 'Copied!',
        description: 'Public key copied to clipboard',
      })
      setTimeout(() => setIsCopied(false), 3000)
    } catch {
      addToast({
        type: 'error',
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
      })
    }
  }

  const handleOpenPlatform = async () => {
    try {
      await shellOpen(platform.sshSettingsUrl)
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not open browser',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const handleCreateConfig = async () => {
    // If config was already created, just move to test step
    if (configCreated) {
      setCurrentStep('test')
      return
    }

    setIsCreatingConfig(true)
    try {
      const config: SSHHostConfig = {
        Host: suggestedAlias,
        HostName: platform.hostname,
        User: 'git',
        IdentityFile: `~/.ssh/${selectedKeyName}`,
        IdentitiesOnly: true,
      }
      await onAddHost(config)
      setConfigCreated(true)
      addToast({
        type: 'success',
        title: 'Configuration created',
        description: `Host "${suggestedAlias}" added to SSH config`,
      })
      setCurrentStep('test')
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to create config',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsCreatingConfig(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await testSSHConnection(suggestedAlias)
      if (result.success) {
        setTestResult({
          success: true,
          message: result.output || 'Successfully connected to GitHub!',
        })
      } else {
        setTestResult({
          success: false,
          message:
            result.errorDetails?.rawMessage ||
            result.output ||
            'Connection failed',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsTesting(false)
    }
  }

  // Filter keys suitable for GitHub (Ed25519 or RSA)
  const suitableKeys = useMemo(() => {
    return keys.filter((k) => k.type === 'ed25519' || k.type === 'rsa')
  }, [keys])

  const renderStepContent = () => {
    switch (currentStep) {
      case 'platform':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Select the Git hosting service you want to connect to.
            </p>
            <div className="grid gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 border-2 text-left transition-all',
                    selectedPlatform === p.id
                      ? 'border-primary bg-primary/5'
                      : 'border-primary/20 hover:border-primary/40'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      selectedPlatform === p.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.hostname}
                    </p>
                  </div>
                  {selectedPlatform === p.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case 'welcome':
        return (
          <div className="space-y-4">
            {hasExistingPlatform ? (
              <>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    You already have {existingPlatformHosts.length}{' '}
                    {platform.name} host
                    {existingPlatformHosts.length > 1 ? 's' : ''} configured:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {existingPlatformHosts.map((h) => (
                      <li
                        key={h.Host}
                        className="text-sm font-mono text-muted-foreground"
                      >
                        {h.Host}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-muted-foreground">
                  Want to add another {platform.name} account?
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                This wizard will help you set up SSH access to {platform.name}.
                You'll be able to clone, push, and pull without entering your
                password.
              </p>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Account type:</p>
              <div className="grid gap-2">
                {!hasExistingPlatform && (
                  <AccountOption
                    selected={accountType === 'primary'}
                    onClick={() => setAccountType('primary')}
                    title="Primary Account"
                    description={`Your main ${platform.name} account`}
                  />
                )}
                <AccountOption
                  selected={accountType === 'work'}
                  onClick={() => setAccountType('work')}
                  title="Work Account"
                  description={`Will create host alias "${platform.aliasPrefix}-work"`}
                />
                <AccountOption
                  selected={accountType === 'personal'}
                  onClick={() => setAccountType('personal')}
                  title="Personal Account"
                  description={`Will create host alias "${platform.aliasPrefix}-personal"`}
                />
                <AccountOption
                  selected={accountType === 'custom'}
                  onClick={() => setAccountType('custom')}
                  title="Custom"
                  description="Choose your own alias"
                />
              </div>
              {accountType === 'custom' && (
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder={`e.g., ${platform.aliasPrefix}-client-a`}
                  className="w-full mt-2 px-3 py-2 text-sm border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
                />
              )}
            </div>
          </div>
        )

      case 'key':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Select an existing key or generate a new one for{' '}
              <span className="font-mono text-primary">{suggestedAlias}</span>
            </p>

            {suitableKeys.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Use existing key:</p>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {suitableKeys.map((key) => (
                    <button
                      key={key.name}
                      onClick={() => setSelectedKeyName(key.name)}
                      className={cn(
                        'flex items-center gap-3 p-3 border-2 text-left transition-all',
                        selectedKeyName === key.name
                          ? 'border-primary bg-primary/5'
                          : 'border-primary/20 hover:border-primary/40'
                      )}
                    >
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {key.type.toUpperCase()}
                          {key.bitSize ? ` ${key.bitSize} bits` : ''}
                        </p>
                      </div>
                      {selectedKeyName === key.name && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or generate new
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 border-2 border-dashed border-primary/20 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key name:</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => {
                    setNewKeyName(e.target.value)
                    setSelectedKeyName(null)
                  }}
                  placeholder={suggestedKeyName}
                  className="w-full px-3 py-2 text-sm font-mono border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Passphrase (optional):
                </label>
                <input
                  type="password"
                  value={newKeyPassphrase}
                  onChange={(e) => setNewKeyPassphrase(e.target.value)}
                  placeholder="Leave empty for no passphrase"
                  className="w-full px-3 py-2 text-sm border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comment (optional):
                </label>
                <input
                  type="text"
                  value={newKeyComment}
                  onChange={(e) => setNewKeyComment(e.target.value)}
                  placeholder={`${platform.name} ${accountType === 'work' ? 'Work' : accountType === 'personal' ? 'Personal' : ''} Account`.replace(
                    /\s+/g,
                    ' '
                  )}
                  className="w-full px-3 py-2 text-sm border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-muted-foreground">
                  Used to identify the key (e.g., account description)
                </p>
              </div>
              <Button
                onClick={handleGenerateNewKey}
                disabled={isGeneratingKey || !newKeyName.trim()}
                className="w-full"
              >
                {isGeneratingKey ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Ed25519 Key
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case 'copy':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Copy this public key and add it to your GitHub account.
            </p>

            <div className="space-y-3">
              <div className="relative">
                {isLoadingPublicKey ? (
                  <div className="flex items-center justify-center h-32 border-2 border-primary/20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 border-2 border-primary/20 font-mono text-xs break-all max-h-32 overflow-y-auto">
                    {publicKeyContent}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyPublicKey}
                  disabled={isLoadingPublicKey || !publicKeyContent}
                  className="flex-1"
                  variant={isCopied ? 'default' : 'outline'}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Public Key
                    </>
                  )}
                </Button>
                <Button onClick={handleOpenPlatform} variant="default">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open {platform.name}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p className="font-medium">On {platform.name}:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click "New SSH Key" or "Add key"</li>
                <li>Give your key a title (e.g., "MacBook Pro")</li>
                <li>Paste the public key in the "Key" field</li>
                <li>Click "Add SSH Key" or "Add key"</li>
              </ol>
            </div>
          </div>
        )

      case 'config':
        return (
          <div className="space-y-4">
            {configCreated ? (
              <>
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Configuration already created
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Host "{suggestedAlias}" has been added to your SSH config.
                    Click "Next" to continue testing.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                This configuration will be added to your SSH config:
              </p>
            )}

            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <p className="text-muted-foreground">
                # {platform.name} SSH config
              </p>
              <p>
                Host <span className="text-primary">{suggestedAlias}</span>
              </p>
              <p className="pl-4">HostName {platform.hostname}</p>
              <p className="pl-4">User git</p>
              <p className="pl-4">IdentityFile ~/.ssh/{selectedKeyName}</p>
              <p className="pl-4">IdentitiesOnly yes</p>
            </div>

            {suggestedAlias !== platform.defaultAlias && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Multi-account usage
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  When cloning repos for this account, use:
                </p>
                <code className="block mt-2 text-xs bg-muted p-2 rounded">
                  git clone git@{suggestedAlias}:username/repo.git
                </code>
              </div>
            )}
          </div>
        )

      case 'test':
        return (
          <div className="space-y-4">
            {testResult === null ? (
              <>
                <p className="text-muted-foreground">
                  Let's verify your connection to {platform.name} works.
                </p>
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full"
                  size="lg"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing connection...
                    </>
                  ) : (
                    <>
                      <platform.icon className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </>
            ) : testResult.success ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-6">
                  <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">
                    Connected Successfully!
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    {testResult.message}
                  </p>
                </div>

                <GitCommandsPanel
                  hostAlias={suggestedAlias}
                  defaultExpanded={true}
                  className="border-green-500/30"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-6">
                  <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-lg font-medium text-red-600 dark:text-red-400">
                    Connection Failed
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-2 max-w-sm">
                    {testResult.message}
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <p className="font-medium">Common issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Public key not added to {platform.name} yet</li>
                    <li>Wrong key selected</li>
                    <li>Key passphrase required but not in SSH agent</li>
                  </ul>
                </div>

                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'platform':
        return true
      case 'welcome':
        return accountType !== 'custom' || customAlias.trim().length > 0
      case 'key':
        return !!selectedKeyName
      case 'copy':
        return true
      case 'config':
        return true
      case 'test':
        return testResult?.success ?? false
      default:
        return true
    }
  }

  // Confirmation dialog for closing
  if (showCloseConfirm) {
    return (
      <Dialog open={open} onOpenChange={() => handleCancelClose()}>
        <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Discard progress?</h3>
                <p className="text-sm text-muted-foreground">
                  Your setup is not complete yet.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancelClose}>
                Continue Setup
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmClose}
              >
                Discard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => {
          if (hasProgress) {
            e.preventDefault()
            setShowCloseConfirm(true)
          }
        }}
        onEscapeKeyDown={(e) => {
          if (hasProgress) {
            e.preventDefault()
            setShowCloseConfirm(true)
          }
        }}
      >
        {/* Header */}
        <div className="bg-primary/5 p-6 pb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <stepInfo.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{stepInfo.title}</h2>
              <p className="text-sm text-muted-foreground">
                {stepInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Progress and navigation */}
        <div className="border-t border-border p-4 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentStepIndex
                    ? 'w-4 bg-primary'
                    : index < currentStepIndex
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canProceed() || isCreatingConfig}
            >
              {isCreatingConfig ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : isLast ? (
                <>
                  Done
                  <Check className="h-4 w-4 ml-1" />
                </>
              ) : currentStep === 'config' && !configCreated ? (
                <>
                  Create Config
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper component for account type selection
function AccountOption({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  title: string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 border-2 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-primary/20 hover:border-primary/40'
      )}
    >
      <div
        className={cn(
          'h-4 w-4 rounded-full border-2 flex items-center justify-center',
          selected ? 'border-primary' : 'border-muted-foreground'
        )}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}
