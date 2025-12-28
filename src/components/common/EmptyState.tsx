import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in',
        className
      )}
    >
      {/* Terminal-style ASCII decoration */}
      <div className="text-primary/20 text-xs mb-4 font-mono">
        {'>'} _ {'<'}
      </div>

      {/* Icon container with terminal style */}
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded border border-primary/30 bg-primary/5">
          <Icon className="h-8 w-8 text-primary/60" />
        </div>
        {/* Corner decorations */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/40" />
        <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/40" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-primary/40" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-primary/40" />
      </div>

      {/* Title with terminal comment style */}
      <h3 className="text-base font-semibold text-primary mb-2 text-glow-sm">
        // {title.toUpperCase().replace(/ /g, '_')}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              size="sm"
              className="terminal-glow-sm"
            >
              [{action.label}]
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary/80 hover:bg-primary/10 hover:text-primary"
            >
              [{secondaryAction.label}]
            </Button>
          )}
        </div>
      )}

      {/* Bottom decoration */}
      <div className="text-primary/15 text-xs mt-8 font-mono">
        ─────────────────
      </div>
    </div>
  )
}
