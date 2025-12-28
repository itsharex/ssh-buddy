import React from 'react'
import Markdown from 'react-markdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Download,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  UpdateState,
  UpdateProgress,
  UpdateInfo,
} from '@/hooks/useUpdater'

interface UpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: UpdateState
  progress: UpdateProgress
  updateInfo: UpdateInfo | null
  error: string | null
  currentVersion: string
  onCheckForUpdates: () => void
  onStartUpdate: () => void
  onRestartApp: () => void
  onRetry: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getProgressPercentage(progress: UpdateProgress): number {
  if (!progress.totalBytes || progress.totalBytes === 0) return 0
  return Math.round((progress.downloadedBytes / progress.totalBytes) * 100)
}

const stateConfig: Record<
  UpdateState,
  {
    icon: React.ElementType
    iconColor: string
    bgColor: string
    borderColor: string
    label: string
    description: string
  }
> = {
  idle: {
    icon: RefreshCw,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border',
    label: 'Check for Updates',
    description: 'See if a new version is available',
  },
  checking: {
    icon: Loader2,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/30',
    label: 'Checking for Updates',
    description: 'Connecting to update server...',
  },
  available: {
    icon: Sparkles,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Update Available',
    description: 'A new version is ready to download',
  },
  downloading: {
    icon: Download,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/30',
    label: 'Downloading Update',
    description: 'Please wait while the update downloads...',
  },
  installing: {
    icon: Loader2,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/30',
    label: 'Installing Update',
    description: 'Applying the update...',
  },
  complete: {
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Update Complete',
    description: 'Restart to apply the changes',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Update Failed',
    description: 'Something went wrong',
  },
  up_to_date: {
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Up to Date',
    description: "You're running the latest version",
  },
}

export function UpdateDialog({
  open,
  onOpenChange,
  state,
  progress,
  updateInfo,
  error,
  currentVersion,
  onCheckForUpdates,
  onStartUpdate,
  onRestartApp,
  onRetry,
}: UpdateDialogProps) {
  const config = stateConfig[state]
  const percentage = getProgressPercentage(progress)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-primary/20">
        {/* Header with Logo and Version */}
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-start gap-4">
            {/* App Logo */}
            <div
              className={cn(
                'w-14 h-14 rounded-xl overflow-hidden ring-2 ring-offset-2 ring-offset-background transition-all duration-300 flex-shrink-0',
                state === 'available'
                  ? 'ring-yellow-500/50'
                  : state === 'complete' || state === 'up_to_date'
                    ? 'ring-green-500/50'
                    : state === 'error'
                      ? 'ring-red-500/50'
                      : 'ring-primary/30'
              )}
            >
              <img
                src="/logo.png"
                alt="SSH Buddy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Version Info */}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold">
                {config.label}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>

              {/* Version Display */}
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground">
                  v{currentVersion}
                </span>
                {updateInfo && state === 'available' && (
                  <>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-yellow-500/20 text-xs font-mono text-yellow-400 font-medium">
                      v{updateInfo.version}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          {/* Idle State - Prompt to check */}
          {state === 'idle' && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Click the button below to check for available updates.
              </p>
            </div>
          )}

          {/* Checking State */}
          {state === 'checking' && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">
                Checking for updates...
              </p>
            </div>
          )}

          {/* Up to Date Message */}
          {state === 'up_to_date' && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-400 mb-3" />
              <p className="text-sm text-green-400 font-medium">
                You're running the latest version!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                SSH Buddy v{currentVersion}
              </p>
            </div>
          )}

          {/* Update Available - Release Notes */}
          {state === 'available' && updateInfo && (
            <div className="space-y-4">
              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Release Notes
                  </div>
                  <ScrollArea className="h-56 rounded-lg border border-border bg-muted/20">
                    <div className="p-4">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <Markdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0 pb-2 border-b border-border">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-sm font-bold text-foreground mt-4 mb-2 first:mt-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">
                                {children}
                              </h3>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-none pl-0 my-2 space-y-1">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1.5 text-[8px]">
                                  ●
                                </span>
                                <span>{children}</span>
                              </li>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm text-muted-foreground my-2 leading-relaxed">
                                {children}
                              </p>
                            ),
                            hr: () => <hr className="my-4 border-border/50" />,
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="text-muted-foreground italic">
                                {children}
                              </em>
                            ),
                            code: ({ children }) => (
                              <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-xs font-mono">
                                {children}
                              </code>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-primary hover:underline inline-flex items-center gap-1"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ),
                          }}
                        >
                          {updateInfo.releaseNotes}
                        </Markdown>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Download Progress */}
          {(state === 'downloading' || state === 'installing') && (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">
                    {state === 'downloading'
                      ? 'Downloading...'
                      : 'Installing...'}
                  </span>
                  <span className="font-mono text-primary font-medium">
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                  {/* Glow Effect (behind) */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-primary/40 blur-sm transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                  {/* Main Progress Bar (front) */}
                  <div
                    className="relative z-10 h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Download Stats */}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{formatBytes(progress.downloadedBytes)}</span>
                  {progress.totalBytes && (
                    <span>{formatBytes(progress.totalBytes)}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Complete Message */}
          {state === 'complete' && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-400 mb-3" />
              <p className="text-sm text-green-400 font-medium">
                Update installed successfully!
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Restart the application to apply the changes.
              </p>
            </div>
          )}

          {/* Error Message */}
          {state === 'error' && error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">
                    Update failed
                  </p>
                  <p className="text-xs text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <DialogFooter className="p-6 pt-4 border-t border-border/50 bg-muted/20">
          {/* Idle - Check for updates */}
          {state === 'idle' && (
            <Button onClick={onCheckForUpdates} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check for Updates
            </Button>
          )}

          {/* Checking - Loading state */}
          {state === 'checking' && (
            <Button disabled className="w-full sm:w-auto">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </Button>
          )}

          {/* Available - Update now */}
          {state === 'available' && (
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Later
              </Button>
              <Button onClick={onStartUpdate} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Update Now
              </Button>
            </div>
          )}

          {/* Downloading/Installing - Progress */}
          {(state === 'downloading' || state === 'installing') && (
            <Button disabled className="w-full sm:w-auto">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {state === 'downloading' ? 'Downloading...' : 'Installing...'}
            </Button>
          )}

          {/* Complete - Restart */}
          {state === 'complete' && (
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Later
              </Button>
              <Button onClick={onRestartApp} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart Now
              </Button>
            </div>
          )}

          {/* Error - Retry */}
          {state === 'error' && (
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button onClick={onRetry} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {/* Up to date - Close */}
          {state === 'up_to_date' && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
