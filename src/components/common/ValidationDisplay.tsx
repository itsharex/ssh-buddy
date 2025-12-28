import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationResult, ValidationIssue } from '@/lib/ssh-validation'

interface ValidationDisplayProps {
  result: ValidationResult
  className?: string
  showSummary?: boolean
}

export function ValidationDisplay({
  result,
  className,
  showSummary = true,
}: ValidationDisplayProps) {
  if (result.issues.length === 0) {
    if (!showSummary) return null
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-success p-3 rounded-lg bg-success/10',
          className
        )}
      >
        <CheckCircle className="h-4 w-4" />
        <span>Configuration is valid</span>
      </div>
    )
  }

  const errors = result.issues.filter((i) => i.severity === 'error')
  const warnings = result.issues.filter((i) => i.severity === 'warning')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary */}
      {showSummary && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm p-3 rounded-lg',
            result.hasBlockingErrors
              ? 'bg-destructive/10 text-destructive'
              : 'bg-amber-500/10 text-amber-600'
          )}
        >
          {result.hasBlockingErrors ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span>
            {errors.length > 0 && (
              <>
                {errors.length} error{errors.length > 1 ? 's' : ''}
              </>
            )}
            {errors.length > 0 && warnings.length > 0 && ', '}
            {warnings.length > 0 && (
              <>
                {warnings.length} warning{warnings.length > 1 ? 's' : ''}
              </>
            )}
          </span>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((issue, index) => (
            <ValidationIssueItem key={`error-${index}`} issue={issue} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((issue, index) => (
            <ValidationIssueItem key={`warning-${index}`} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ValidationIssueItemProps {
  issue: ValidationIssue
}

function ValidationIssueItem({ issue }: ValidationIssueItemProps) {
  const isError = issue.severity === 'error'

  return (
    <div
      className={cn(
        'flex items-start gap-2 text-sm p-2 rounded-md',
        isError ? 'bg-destructive/5' : 'bg-amber-500/5'
      )}
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(isError ? 'text-destructive' : 'text-amber-600')}>
          {issue.field && <span className="font-medium">{issue.field}: </span>}
          {issue.message}
        </p>
        {issue.hint && (
          <p className="text-xs text-muted-foreground mt-0.5">{issue.hint}</p>
        )}
      </div>
    </div>
  )
}

// Inline field validation indicator
interface FieldValidationProps {
  issues: ValidationIssue[]
  className?: string
}

export function FieldValidation({ issues, className }: FieldValidationProps) {
  if (issues.length === 0) return null

  const hasError = issues.some((i) => i.severity === 'error')
  const firstIssue = issues[0]

  return (
    <div
      className={cn(
        'flex items-start gap-1.5 text-xs mt-1',
        hasError ? 'text-destructive' : 'text-amber-600',
        className
      )}
    >
      {hasError ? (
        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
      )}
      <div>
        <p>{firstIssue.message}</p>
        {firstIssue.hint && (
          <p className="text-muted-foreground">{firstIssue.hint}</p>
        )}
      </div>
    </div>
  )
}

// Simple validation indicator for lists
interface ValidationIndicatorProps {
  result: ValidationResult
  size?: 'sm' | 'md'
}

export function ValidationIndicator({
  result,
  size = 'sm',
}: ValidationIndicatorProps) {
  if (result.issues.length === 0) return null

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  if (result.hasBlockingErrors) {
    return (
      <div className="flex items-center gap-1 text-destructive">
        <AlertCircle className={iconSize} />
        {size === 'md' && (
          <span className="text-xs">
            {result.issues.filter((i) => i.severity === 'error').length} errors
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-amber-600">
      <AlertTriangle className={iconSize} />
      {size === 'md' && (
        <span className="text-xs">
          {result.issues.filter((i) => i.severity === 'warning').length}{' '}
          warnings
        </span>
      )}
    </div>
  )
}
