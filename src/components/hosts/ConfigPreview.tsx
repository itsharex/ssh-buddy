import { useState } from 'react'
import {
  FileText,
  Check,
  X,
  AlertTriangle,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ValidationDisplay } from '@/components/common'
import { validateHost } from '@/lib/ssh-validation'
import type { SSHHostConfig } from '@/lib/ssh-config'
import { cn } from '@/lib/utils'

interface ConfigPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  oldConfig?: SSHHostConfig
  newConfig: SSHHostConfig
  mode: 'add' | 'edit'
  existingHosts: string[]
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function ConfigPreview({
  open,
  onOpenChange,
  oldConfig,
  newConfig,
  mode,
  existingHosts,
  onConfirm,
  isLoading = false,
}: ConfigPreviewProps) {
  const [showValidation, setShowValidation] = useState(true)

  // Validate the new configuration
  const validationResult = validateHost(
    newConfig,
    existingHosts.filter((h) => h !== oldConfig?.Host),
    mode === 'add'
  )

  // Generate diff
  const changes = generateChanges(oldConfig, newConfig)

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Review Changes
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Review the new host configuration before saving'
              : 'Review changes before updating the configuration'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Validation Section */}
          {validationResult.issues.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowValidation(!showValidation)}
                className="flex items-center gap-2 text-sm font-medium w-full"
              >
                <AlertTriangle
                  className={cn(
                    'h-4 w-4',
                    validationResult.hasBlockingErrors
                      ? 'text-destructive'
                      : 'text-amber-600'
                  )}
                />
                {validationResult.hasBlockingErrors
                  ? 'Errors must be fixed before saving'
                  : 'Warnings (optional to fix)'}
              </button>
              {showValidation && (
                <ValidationDisplay
                  result={validationResult}
                  showSummary={false}
                />
              )}
            </div>
          )}

          {/* Changes Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {mode === 'add' ? 'New Configuration' : 'Changes'}
            </h4>

            <div className="rounded-lg border border-border overflow-hidden">
              {/* Host name change or addition */}
              {mode === 'add' ? (
                <DiffLine type="add" label="Host" value={newConfig.Host} />
              ) : oldConfig?.Host !== newConfig.Host ? (
                <DiffLine
                  type="change"
                  label="Host"
                  oldValue={oldConfig?.Host}
                  newValue={newConfig.Host}
                />
              ) : (
                <DiffLine type="context" label="Host" value={newConfig.Host} />
              )}

              {/* Other fields */}
              {changes.map((change) => (
                <DiffLine
                  key={change.field}
                  type={change.type}
                  label={change.field}
                  value={change.type === 'add' ? change.newValue : undefined}
                  oldValue={
                    change.type === 'change' ? change.oldValue : undefined
                  }
                  newValue={
                    change.type === 'change' ? change.newValue : undefined
                  }
                />
              ))}

              {changes.length === 0 && mode === 'edit' && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No changes detected
                </div>
              )}
            </div>
          </div>

          {/* Config Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Config File Preview</h4>
            <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto">
              {formatConfigPreview(newConfig)}
            </pre>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || validationResult.hasBlockingErrors}
          >
            {isLoading ? (
              'Saving...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {mode === 'add' ? 'Add Host' : 'Apply Changes'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ChangeType = 'add' | 'remove' | 'change' | 'context'

interface Change {
  field: string
  type: ChangeType
  oldValue?: string
  newValue?: string
}

function generateChanges(
  oldConfig: SSHHostConfig | undefined,
  newConfig: SSHHostConfig
): Change[] {
  const changes: Change[] = []
  const allFields = new Set([
    ...Object.keys(oldConfig || {}),
    ...Object.keys(newConfig),
  ])

  // Skip 'Host' as it's handled separately
  allFields.delete('Host')

  for (const field of allFields) {
    const oldValue = oldConfig?.[field as keyof SSHHostConfig]
    const newValue = newConfig[field as keyof SSHHostConfig]

    const oldStr = formatValue(oldValue)
    const newStr = formatValue(newValue)

    if (!oldConfig) {
      // New host - all fields are additions
      if (newStr) {
        changes.push({ field, type: 'add', newValue: newStr })
      }
    } else if (!oldStr && newStr) {
      // Field added
      changes.push({ field, type: 'add', newValue: newStr })
    } else if (oldStr && !newStr) {
      // Field removed
      changes.push({ field, type: 'remove', oldValue: oldStr })
    } else if (oldStr !== newStr) {
      // Field changed
      changes.push({
        field,
        type: 'change',
        oldValue: oldStr,
        newValue: newStr,
      })
    }
    // Skip unchanged fields
  }

  return changes
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

interface DiffLineProps {
  type: ChangeType
  label: string
  value?: string
  oldValue?: string
  newValue?: string
}

function DiffLine({ type, label, value, oldValue, newValue }: DiffLineProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm font-mono border-b border-border last:border-b-0',
        type === 'add' && 'bg-success/10',
        type === 'remove' && 'bg-destructive/10',
        type === 'change' && 'bg-amber-500/10'
      )}
    >
      {type === 'add' && <Plus className="h-3 w-3 text-success shrink-0" />}
      {type === 'remove' && (
        <Minus className="h-3 w-3 text-destructive shrink-0" />
      )}
      {type === 'change' && (
        <ArrowRight className="h-3 w-3 text-amber-600 shrink-0" />
      )}
      {type === 'context' && <span className="w-3" />}

      <span className="text-muted-foreground w-28 shrink-0">{label}</span>

      {type === 'context' && <span>{value}</span>}
      {type === 'add' && <span className="text-success">{value}</span>}
      {type === 'remove' && (
        <span className="text-destructive line-through">{oldValue}</span>
      )}
      {type === 'change' && (
        <span>
          <span className="text-destructive line-through">{oldValue}</span>
          <span className="mx-1">→</span>
          <span className="text-success">{newValue}</span>
        </span>
      )}
    </div>
  )
}

function formatConfigPreview(config: SSHHostConfig): string {
  const lines: string[] = [`Host ${config.Host}`]

  for (const [key, value] of Object.entries(config)) {
    if (key === 'Host' || value === undefined || value === '') continue

    const formattedValue =
      typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value)
    lines.push(`  ${key} ${formattedValue}`)
  }

  return lines.join('\n')
}
