import { HelpCircle, Info } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { getOptionHelp } from '@/lib/ssh-options-help'
import { cn } from '@/lib/utils'

interface FieldHelpProps {
  field: string
  className?: string
}

export function FieldHelp({ field, className }: FieldHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const help = getOptionHelp(field)

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, handleClickOutside])

  if (!help) return null

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
        aria-label={`Help for ${help.label}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-64 p-3 rounded-lg border border-border bg-popover shadow-lg',
            'top-full mt-2',
            'left-1/2 -translate-x-1/2'
          )}
        >
          <div className="space-y-2">
            <p className="font-medium text-sm">{help.label}</p>
            <p className="text-xs text-muted-foreground">{help.description}</p>
            {help.example && (
              <p className="text-xs">
                <span className="text-muted-foreground">Example: </span>
                <code className="bg-muted px-1 rounded">{help.example}</code>
              </p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-border rotate-45 top-0 -translate-y-1/2 border-l border-t" />
        </div>
      )}
    </div>
  )
}

// Inline help text shown below a field
interface InlineHelpProps {
  field: string
  showOnFocus?: boolean
  className?: string
}

export function InlineHelp({ field, className }: InlineHelpProps) {
  const help = getOptionHelp(field)
  if (!help) return null

  return (
    <p
      className={cn(
        'text-xs text-muted-foreground flex items-start gap-1',
        className
      )}
    >
      <Info className="h-3 w-3 mt-0.5 shrink-0" />
      <span>{help.description}</span>
    </p>
  )
}

// Combined label with help icon
interface LabelWithHelpProps {
  field: string
  required?: boolean
  className?: string
  children?: React.ReactNode
}

export function LabelWithHelp({
  field,
  required,
  className,
  children,
}: LabelWithHelpProps) {
  const help = getOptionHelp(field)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {children || <span>{help?.label || field}</span>}
      {required && <span className="text-destructive">*</span>}
      {help && <FieldHelp field={field} />}
    </div>
  )
}
