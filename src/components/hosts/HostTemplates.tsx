import { useState } from 'react'
import {
  Server,
  Shield,
  ArrowRightLeft,
  Network,
  ChevronRight,
  Check,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import type { SSHHostConfig } from '@/lib/ssh-config'
import { cn } from '@/lib/utils'

export type TemplateType = 'standard' | 'bastion' | 'port-forward' | 'jump-host'

// Known SSH config field names (without index signature)
type SSHConfigFieldName =
  | 'Host'
  | 'HostName'
  | 'User'
  | 'Port'
  | 'IdentityFile'
  | 'IdentitiesOnly'
  | 'ProxyJump'
  | 'ProxyCommand'
  | 'ForwardAgent'
  | 'AddKeysToAgent'
  | 'UseKeychain'
  | 'ServerAliveInterval'
  | 'ServerAliveCountMax'
  | 'StrictHostKeyChecking'
  | 'UserKnownHostsFile'
  | 'LogLevel'
  | 'Compression'

interface Template {
  id: TemplateType
  name: string
  description: string
  icon: typeof Server
  defaults: Partial<SSHHostConfig>
  requiredFields: SSHConfigFieldName[]
  optionalFields: SSHConfigFieldName[]
  helpText: Record<string, string>
}

const templates: Template[] = [
  {
    id: 'standard',
    name: 'Standard Host',
    description: 'Basic SSH connection to a server',
    icon: Server,
    defaults: {
      Port: 22,
    },
    requiredFields: ['Host', 'HostName'],
    optionalFields: ['User', 'Port', 'IdentityFile'],
    helpText: {
      Host: 'A short alias you\'ll use to connect (e.g., "myserver")',
      HostName: "The server's IP address or domain name",
      User: 'Your username on the remote server',
      Port: 'SSH port (default: 22)',
      IdentityFile: 'Path to your SSH private key',
    },
  },
  {
    id: 'bastion',
    name: 'Bastion / Jump Server',
    description: 'Secure gateway to access internal servers',
    icon: Shield,
    defaults: {
      Port: 22,
      ForwardAgent: true,
      AddKeysToAgent: true,
    },
    requiredFields: ['Host', 'HostName', 'User'],
    optionalFields: ['Port', 'IdentityFile'],
    helpText: {
      Host: 'Alias for your bastion server (e.g., "bastion")',
      HostName: "The bastion server's public IP or domain",
      User: 'Your username on the bastion server',
      Port: 'SSH port (default: 22)',
      IdentityFile: 'SSH key for bastion authentication',
    },
  },
  {
    id: 'port-forward',
    name: 'Port Forwarding',
    description: 'Forward local ports to remote services',
    icon: ArrowRightLeft,
    defaults: {
      Port: 22,
      ServerAliveInterval: 60,
      ServerAliveCountMax: 3,
    },
    requiredFields: ['Host', 'HostName'],
    optionalFields: ['User', 'Port', 'IdentityFile'],
    helpText: {
      Host: 'Alias for this connection (e.g., "db-tunnel")',
      HostName: 'The server to connect through',
      User: 'Your username on the server',
      Port: 'SSH port (default: 22)',
      IdentityFile: 'SSH key for authentication',
    },
  },
  {
    id: 'jump-host',
    name: 'Internal Server via Jump',
    description: 'Connect to internal servers through a bastion',
    icon: Network,
    defaults: {
      Port: 22,
    },
    requiredFields: ['Host', 'HostName', 'ProxyJump'],
    optionalFields: ['User', 'Port', 'IdentityFile'],
    helpText: {
      Host: 'Alias for the internal server (e.g., "internal-db")',
      HostName: 'Internal IP or hostname of the target server',
      ProxyJump: 'The bastion host alias to jump through',
      User: 'Your username on the internal server',
      Port: 'SSH port (default: 22)',
      IdentityFile: 'SSH key for the internal server',
    },
  },
]

interface HostTemplatesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (config: SSHHostConfig) => void
  existingHosts: string[]
}

export function HostTemplates({
  open,
  onOpenChange,
  onSelectTemplate,
  existingHosts,
}: HostTemplatesProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  )
  const [formData, setFormData] = useState<Partial<SSHHostConfig>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setFormData({ ...template.defaults })
    setErrors({})
    setStep('configure')
  }

  const handleBack = () => {
    setStep('select')
    setSelectedTemplate(null)
    setFormData({})
    setErrors({})
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset after close animation
    setTimeout(() => {
      setStep('select')
      setSelectedTemplate(null)
      setFormData({})
      setErrors({})
    }, 200)
  }

  const validateForm = (): boolean => {
    if (!selectedTemplate) return false

    const newErrors: Record<string, string> = {}

    for (const field of selectedTemplate.requiredFields) {
      const value = formData[field]
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field] = 'This field is required'
      }
    }

    // Check for duplicate host alias
    if (formData.Host && existingHosts.includes(formData.Host)) {
      newErrors.Host = 'This host alias already exists'
    }

    // Validate host alias format
    if (formData.Host && /\s/.test(formData.Host)) {
      newErrors.Host = 'Host alias cannot contain spaces'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!selectedTemplate || !validateForm()) return

    const config: SSHHostConfig = {
      Host: formData.Host as string,
      ...formData,
    }

    // Clean up empty optional fields
    Object.keys(config).forEach((key) => {
      const value = config[key as keyof SSHHostConfig]
      if (value === '' || value === undefined) {
        delete config[key as keyof SSHHostConfig]
      }
    })

    onSelectTemplate(config)
    handleClose()
  }

  const updateField = (
    field: keyof SSHHostConfig,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const allFields = selectedTemplate
    ? [...selectedTemplate.requiredFields, ...selectedTemplate.optionalFields]
    : []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'configure' && selectedTemplate ? (
              <>
                <selectedTemplate.icon className="h-5 w-5 text-primary" />
                {selectedTemplate.name}
              </>
            ) : (
              <>
                <Server className="h-5 w-5 text-primary" />
                Choose a Template
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'configure' && selectedTemplate
              ? selectedTemplate.description
              : 'Select a template to quickly set up your SSH host'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {step === 'select' ? (
            <div className="grid gap-3 py-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <template.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {template.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          ) : selectedTemplate ? (
            <div className="space-y-4 py-4">
              {allFields.map((field) => {
                const isRequired =
                  selectedTemplate.requiredFields.includes(field)
                const helpText = selectedTemplate.helpText[field]
                const error = errors[field]

                return (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="flex items-center gap-1">
                      {getFieldLabel(field)}
                      {isRequired && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <Input
                      id={field}
                      placeholder={getFieldPlaceholder(field)}
                      value={(formData[field] as string) || ''}
                      onChange={(e) => updateField(field, e.target.value)}
                      className={cn(error && 'border-destructive')}
                    />
                    {error ? (
                      <p className="text-xs text-destructive">{error}</p>
                    ) : helpText ? (
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        {helpText}
                      </p>
                    ) : null}
                  </div>
                )
              })}

              {/* Template-specific info */}
              {selectedTemplate.id === 'bastion' && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground">
                    This template enables agent forwarding so you can use your
                    local SSH keys when connecting to internal servers through
                    this bastion.
                  </p>
                </div>
              )}

              {selectedTemplate.id === 'port-forward' && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground">
                    After creating this host, use{' '}
                    <code className="text-xs bg-muted px-1 rounded">
                      ssh -L local:remote:port {formData.Host || 'alias'}
                    </code>{' '}
                    to forward ports.
                  </p>
                </div>
              )}

              {selectedTemplate.id === 'jump-host' && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground">
                    Make sure you've already configured the jump host (bastion)
                    before creating this entry. Use its alias in the ProxyJump
                    field.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'configure' ? (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleSubmit}>
                <Check className="h-4 w-4 mr-2" />
                Create Host
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    Host: 'Host Alias',
    HostName: 'Server Address',
    User: 'Username',
    Port: 'Port',
    IdentityFile: 'Identity File',
    ProxyJump: 'Jump Through',
    ProxyCommand: 'Proxy Command',
    ForwardAgent: 'Forward Agent',
  }
  return labels[field] || field
}

function getFieldPlaceholder(field: string): string {
  const placeholders: Record<string, string> = {
    Host: 'e.g., my-server',
    HostName: 'e.g., 192.168.1.100 or example.com',
    User: 'e.g., ubuntu',
    Port: '22',
    IdentityFile: 'e.g., ~/.ssh/id_ed25519',
    ProxyJump: 'e.g., bastion',
  }
  return placeholders[field] || ''
}

// Template selector button for inline use
interface TemplateButtonProps {
  onClick: () => void
  className?: string
}

export function TemplateButton({ onClick, className }: TemplateButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn('gap-2', className)}
    >
      <Server className="h-4 w-4" />
      Use Template
    </Button>
  )
}
