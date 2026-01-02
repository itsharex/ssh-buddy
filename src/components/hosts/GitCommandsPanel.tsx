import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GitCommandsPanelProps {
  /** The SSH host alias (e.g., "github.com", "github-work") */
  hostAlias: string
  /** Whether the panel is expanded by default */
  defaultExpanded?: boolean
  /** Optional class name */
  className?: string
}

interface CommandRowProps {
  label: string
  command: string
  onCopy: () => void
  copied: boolean
}

function CommandRow({ label, command, onCopy, copied }: CommandRowProps) {
  return (
    <div className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <code className="text-xs font-mono text-foreground block truncate">
          {command}
        </code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        className={cn(
          'h-8 w-8 shrink-0 transition-colors',
          copied && 'text-success'
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}

export function GitCommandsPanel({
  hostAlias,
  defaultExpanded = false,
  className,
}: GitCommandsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [username, setUsername] = useState('')
  const [repository, setRepository] = useState('')
  const [remoteName, setRemoteName] = useState('origin')
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  // Generate the git URL base
  const gitUrlBase = `git@${hostAlias}`

  // Generate path with placeholders for empty fields
  const userPart = username || '<username>'
  const repoPart = repository || '<repository>'
  const repoPath = `${userPart}/${repoPart}.git`

  // Generate commands
  const commands = [
    {
      id: 'clone',
      label: 'Clone repository',
      command: `git clone ${gitUrlBase}:${repoPath}`,
    },
    {
      id: 'remote-add',
      label: `Add remote "${remoteName}"`,
      command: `git remote add ${remoteName} ${gitUrlBase}:${repoPath}`,
    },
    {
      id: 'remote-set-url',
      label: `Change "${remoteName}" URL`,
      command: `git remote set-url ${remoteName} ${gitUrlBase}:${repoPath}`,
    },
  ]

  const handleCopy = async (commandId: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedCommand(commandId)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div
      className={cn(
        'border-brutal border-primary/30 bg-card shadow-brutal-dark-sm',
        className
      )}
    >
      {/* Header - clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-3 w-full p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted border-2 border-primary/20">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Git Commands</p>
            <p className="text-xs text-muted-foreground">
              Quick copy git clone, remote add/set-url
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t-2 border-border p-4 space-y-4">
          {/* Remote/Username/Repository inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Remote
              </label>
              <input
                type="text"
                value={remoteName}
                onChange={(e) => setRemoteName(e.target.value || 'origin')}
                placeholder="origin"
                className="w-full px-3 py-1.5 text-sm font-mono border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-1.5 text-sm font-mono border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Repository
              </label>
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="repository"
                className="w-full px-3 py-1.5 text-sm font-mono border-2 border-primary/20 bg-background focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Commands list */}
          <div className="divide-y divide-border">
            {commands.map((cmd) => (
              <CommandRow
                key={cmd.id}
                label={cmd.label}
                command={cmd.command}
                onCopy={() => handleCopy(cmd.id, cmd.command)}
                copied={copiedCommand === cmd.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
