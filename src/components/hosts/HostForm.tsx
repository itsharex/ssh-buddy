import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Loader2,
  AlertCircle,
  Server,
  Info,
  ChevronDown,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { SSHHostConfig } from '@/lib/ssh-config'
import { cn } from '@/lib/utils'
import { ContextualTip } from '@/components/common/ContextualTip'
import {
  MULTI_ACCOUNT_PLATFORM_TIP,
  SAME_KEY_WARNING,
  isMultiAccountPlatform,
  getPlatformName,
} from '@/lib/guidance-tips'

interface SSHKeyOption {
  name: string
  path: string
  type: string
}

interface HostFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  host?: SSHHostConfig
  onSubmit: (host: SSHHostConfig) => Promise<void>
  mode: 'add' | 'edit'
  existingHosts?: string[]
  availableKeys?: SSHKeyOption[]
  allHosts?: SSHHostConfig[]
}

interface FormErrors {
  Host?: string
  HostName?: string
  User?: string
  Port?: string
  IdentityFile?: string
  ProxyJump?: string
}

export function HostForm({
  open,
  onOpenChange,
  host,
  onSubmit,
  mode,
  existingHosts = [],
  availableKeys = [],
  allHosts = [],
}: HostFormProps) {
  const [formData, setFormData] = useState<SSHHostConfig>({
    Host: '',
    HostName: '',
    User: '',
    Port: undefined,
    IdentityFile: '',
    ProxyJump: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showKeyDropdown, setShowKeyDropdown] = useState(false)
  const keyDropdownRef = useRef<HTMLDivElement>(null)

  // Check if current HostName is a multi-account platform
  const isMultiAccountHost = useMemo(() => {
    const hostName = formData.HostName?.trim() || ''
    return isMultiAccountPlatform(hostName)
  }, [formData.HostName])

  const currentPlatformName = useMemo(() => {
    const hostName = formData.HostName?.trim() || ''
    return getPlatformName(hostName)
  }, [formData.HostName])

  // Check if the selected IdentityFile is used by another host on the same platform
  const sameKeyConflict = useMemo(() => {
    const identityFile = formData.IdentityFile?.trim()
    const hostName = formData.HostName?.trim() || ''
    if (!identityFile || !hostName) return null

    // Find other hosts using the same key
    const conflictingHosts = allHosts.filter((h) => {
      // Skip current host in edit mode
      if (mode === 'edit' && h.Host === host?.Host) return false
      // Check if same identity file
      if (h.IdentityFile !== identityFile) return false
      // Check if targeting same platform
      const hHostName = h.HostName?.toLowerCase() || ''
      const currentHostName = hostName.toLowerCase()
      // Simple platform matching: check if both contain the same platform domain
      const platforms = [
        'github.com',
        'gitlab.com',
        'bitbucket.org',
        'ssh.dev.azure.com',
      ]
      return platforms.some(
        (p) => hHostName.includes(p) && currentHostName.includes(p)
      )
    })

    if (conflictingHosts.length === 0) return null
    return conflictingHosts.map((h) => h.Host)
  }, [formData.IdentityFile, formData.HostName, allHosts, mode, host?.Host])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        keyDropdownRef.current &&
        !keyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowKeyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset form when dialog opens/closes or host changes
  useEffect(() => {
    if (open) {
      setFormData(
        host || {
          Host: '',
          HostName: '',
          User: '',
          Port: undefined,
          IdentityFile: '',
          ProxyJump: '',
        }
      )
      setErrors({})
      setTouched({})
    }
  }, [open, host])

  // Validation functions
  const validateHost = useCallback(
    (value: string): string | undefined => {
      if (!value.trim()) {
        return 'Host alias is required'
      }
      if (/\s/.test(value)) {
        return 'Host alias cannot contain spaces'
      }
      if (mode === 'add' && existingHosts.includes(value.trim())) {
        return 'This host alias already exists'
      }
      return undefined
    },
    [mode, existingHosts]
  )

  const validateHostName = (value: string): string | undefined => {
    if (!value) return undefined
    // Basic hostname/IP validation
    const hostnameRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!hostnameRegex.test(value) && !ipRegex.test(value)) {
      return 'Please enter a valid hostname or IP address'
    }
    return undefined
  }

  const validateUser = (value: string): string | undefined => {
    if (!value) return undefined
    if (/\s/.test(value)) {
      return 'Username cannot contain spaces'
    }
    return undefined
  }

  const validatePort = (value: number | undefined): string | undefined => {
    if (value === undefined || value === null) return undefined
    if (isNaN(value) || value < 1 || value > 65535) {
      return 'Port must be between 1 and 65535'
    }
    return undefined
  }

  const validateIdentityFile = (value: string): string | undefined => {
    if (!value) return undefined
    // Basic path validation
    if (!value.startsWith('/') && !value.startsWith('~')) {
      return 'Please enter a valid file path (starting with / or ~)'
    }
    return undefined
  }

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      Host: validateHost(formData.Host),
      HostName: validateHostName(formData.HostName || ''),
      User: validateUser(formData.User || ''),
      Port: validatePort(formData.Port),
      IdentityFile: validateIdentityFile(formData.IdentityFile || ''),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== undefined)
  }, [formData, validateHost])

  // Handle field blur for validation
  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))

    let error: string | undefined
    switch (field) {
      case 'Host':
        error = validateHost(formData.Host)
        break
      case 'HostName':
        error = validateHostName(formData.HostName || '')
        break
      case 'User':
        error = validateUser(formData.User || '')
        break
      case 'Port':
        error = validatePort(formData.Port)
        break
      case 'IdentityFile':
        error = validateIdentityFile(formData.IdentityFile || '')
        break
    }

    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      Host: true,
      HostName: true,
      User: true,
      Port: true,
      IdentityFile: true,
      ProxyJump: true,
    })

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      // Clean up empty fields
      const cleanedData: SSHHostConfig = { Host: formData.Host.trim() }
      if (formData.HostName?.trim())
        cleanedData.HostName = formData.HostName.trim()
      if (formData.User?.trim()) cleanedData.User = formData.User.trim()
      if (formData.Port) cleanedData.Port = formData.Port
      if (formData.IdentityFile?.trim())
        cleanedData.IdentityFile = formData.IdentityFile.trim()
      if (formData.ProxyJump?.trim())
        cleanedData.ProxyJump = formData.ProxyJump.trim()

      await onSubmit(cleanedData)
      onOpenChange(false)
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        Host: err instanceof Error ? err.message : 'Failed to save',
      }))
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof SSHHostConfig, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {mode === 'add' ? 'Add Host' : 'Edit Host'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'add'
                  ? 'Create a new SSH host configuration'
                  : 'Modify existing host settings'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-5 py-4">
            {/* Host Alias */}
            <div className="space-y-2">
              <Label htmlFor="host" className="flex items-center gap-1">
                Host Alias <span className="text-destructive">*</span>
              </Label>
              <Input
                id="host"
                placeholder="e.g., my-server"
                value={formData.Host}
                onChange={(e) => updateField('Host', e.target.value)}
                onBlur={() => handleBlur('Host')}
                disabled={mode === 'edit' || loading}
                className={cn(
                  touched.Host &&
                    errors.Host &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {touched.Host && errors.Host ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.Host}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The alias used for connecting (ssh my-server)
                </p>
              )}
            </div>

            {/* HostName */}
            <div className="space-y-2">
              <Label htmlFor="hostname">Host Address</Label>
              <Input
                id="hostname"
                placeholder="e.g., 192.168.1.100 or example.com"
                value={formData.HostName || ''}
                onChange={(e) => updateField('HostName', e.target.value)}
                onBlur={() => handleBlur('HostName')}
                disabled={loading}
                className={cn(
                  touched.HostName &&
                    errors.HostName &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {touched.HostName && errors.HostName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.HostName}
                </p>
              )}
              {/* Multi-account platform tip */}
              {isMultiAccountHost && (
                <ContextualTip
                  id={`multi-account-${currentPlatformName?.toLowerCase() || 'platform'}`}
                  type={MULTI_ACCOUNT_PLATFORM_TIP.type}
                  title={`${currentPlatformName} Multi-Account Tip`}
                  description={MULTI_ACCOUNT_PLATFORM_TIP.description}
                  suggestions={MULTI_ACCOUNT_PLATFORM_TIP.suggestions}
                  details={MULTI_ACCOUNT_PLATFORM_TIP.details}
                  className="mt-2"
                />
              )}
            </div>

            {/* User and Port */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  placeholder="e.g., root"
                  value={formData.User || ''}
                  onChange={(e) => updateField('User', e.target.value)}
                  onBlur={() => handleBlur('User')}
                  disabled={loading}
                  className={cn(
                    touched.User &&
                      errors.User &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {touched.User && errors.User && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.User}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="22"
                  value={formData.Port || ''}
                  onChange={(e) =>
                    updateField(
                      'Port',
                      e.target.value ? parseInt(e.target.value) : ''
                    )
                  }
                  onBlur={() => handleBlur('Port')}
                  disabled={loading}
                  className={cn(
                    touched.Port &&
                      errors.Port &&
                      'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {touched.Port && errors.Port && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.Port}
                  </p>
                )}
              </div>
            </div>

            {/* Identity File */}
            <div className="space-y-2">
              <Label htmlFor="identityfile">Identity File</Label>
              <div className="relative" ref={keyDropdownRef}>
                <div className="relative">
                  <Input
                    id="identityfile"
                    placeholder="e.g., ~/.ssh/id_ed25519"
                    value={formData.IdentityFile || ''}
                    onChange={(e) =>
                      updateField('IdentityFile', e.target.value)
                    }
                    onFocus={() => setShowKeyDropdown(true)}
                    onBlur={() => handleBlur('IdentityFile')}
                    disabled={loading}
                    className={cn(
                      'pr-8',
                      touched.IdentityFile &&
                        errors.IdentityFile &&
                        'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                  {availableKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowKeyDropdown(!showKeyDropdown)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          showKeyDropdown && 'rotate-180'
                        )}
                      />
                    </button>
                  )}
                </div>
                {showKeyDropdown && availableKeys.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      {availableKeys.map((key) => (
                        <button
                          key={key.name}
                          type="button"
                          onClick={() => {
                            updateField('IdentityFile', key.path)
                            setShowKeyDropdown(false)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/5 text-left"
                        >
                          <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {key.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {key.path}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground uppercase shrink-0">
                            {key.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {touched.IdentityFile && errors.IdentityFile && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.IdentityFile}
                </p>
              )}
              {/* Same key warning */}
              {sameKeyConflict && sameKeyConflict.length > 0 && (
                <ContextualTip
                  id="same-key-warning"
                  type={SAME_KEY_WARNING.type}
                  title={SAME_KEY_WARNING.title}
                  description={`This key is already used by ${sameKeyConflict.join(', ')} for the same platform. ${SAME_KEY_WARNING.description}`}
                  suggestions={SAME_KEY_WARNING.suggestions}
                  details={SAME_KEY_WARNING.details}
                  dismissible={false}
                  className="mt-2"
                />
              )}
            </div>

            {/* ProxyJump */}
            <div className="space-y-2">
              <Label htmlFor="proxyjump">Jump Host (ProxyJump)</Label>
              <Input
                id="proxyjump"
                placeholder="e.g., bastion"
                value={formData.ProxyJump || ''}
                onChange={(e) => updateField('ProxyJump', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Connect through a relay host (must be configured first)
              </p>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Settings will be saved to ~/.ssh/config. Fields marked with *
                are required.
              </p>
            </div>
          </DialogBody>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading
                ? 'Saving...'
                : mode === 'add'
                  ? 'Add Host'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
