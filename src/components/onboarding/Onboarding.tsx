import { useState } from 'react'
import {
  Server,
  Key,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Users,
  GitBranch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface OnboardingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface Step {
  id: string
  title: string
  description: string
  icon: typeof Server
  content: React.ReactNode
}

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to SSH Buddy',
    description: 'Your friendly SSH configuration manager',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          SSH Buddy helps you manage your SSH connections without the hassle of
          editing config files manually.
        </p>
        <div className="grid gap-3">
          <FeatureItem
            icon={Server}
            title="Manage Hosts"
            description="Add, edit, and organize your SSH hosts with ease"
          />
          <FeatureItem
            icon={Key}
            title="Handle Keys"
            description="Generate and manage SSH keys in one place"
          />
          <FeatureItem
            icon={Shield}
            title="Stay Secure"
            description="Get warnings about security issues in your config"
          />
        </div>
      </div>
    ),
  },
  {
    id: 'hosts',
    title: 'Understanding Hosts',
    description: 'SSH hosts are shortcuts to your servers',
    icon: Server,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Instead of typing{' '}
          <code className="bg-muted px-1 rounded">
            ssh user@192.168.1.100 -i ~/.ssh/mykey
          </code>
          every time, you can create a host called "myserver" and just type{' '}
          <code className="bg-muted px-1 rounded">ssh myserver</code>.
        </p>
        <div className="rounded-lg bg-muted p-4 font-mono text-sm">
          <p className="text-muted-foreground"># Your SSH config file</p>
          <p>Host myserver</p>
          <p className="pl-4">HostName 192.168.1.100</p>
          <p className="pl-4">User admin</p>
          <p className="pl-4">IdentityFile ~/.ssh/id_ed25519</p>
        </div>
        <p className="text-sm text-muted-foreground">
          SSH Buddy manages this file for you so you never have to edit it
          manually.
        </p>
      </div>
    ),
  },
  {
    id: 'keys',
    title: 'SSH Keys Explained',
    description: 'Keys are like passwords, but better',
    icon: Key,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          SSH keys let you log in without typing a password. They come in pairs:
        </p>
        <div className="grid gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium text-sm">Private Key</p>
            <p className="text-xs text-muted-foreground">
              Keep this secret! It stays on your computer and proves your
              identity.
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="font-medium text-sm">Public Key</p>
            <p className="text-xs text-muted-foreground">
              Share this with servers you want to access. It's like a lock that
              only your private key can open.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Use Ed25519 keys for the best security and
          performance.
        </p>
      </div>
    ),
  },
  {
    id: 'multi-account',
    title: 'Multi-Account Setup',
    description: 'One key opens one door',
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          If you have multiple accounts on the same platform (like GitHub), each
          account needs a different SSH key.
        </p>
        <div className="rounded-lg bg-muted p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-500">
              Personal
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <code className="text-xs bg-background px-2 py-1 rounded">
              id_personal
            </code>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-medium text-green-500">
              Work
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <code className="text-xs bg-background px-2 py-1 rounded">
              id_work
            </code>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Key concept:</strong> SSH servers identify you by your key.
          Same key = same account.
        </p>
      </div>
    ),
  },
  {
    id: 'scenarios',
    title: 'Common Scenarios',
    description: 'See how other developers set things up',
    icon: GitBranch,
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <ScenarioItem
            title="Personal + Work GitHub"
            description="Create a Host for each account with different keys"
            example="github-personal, github-work"
          />
          <ScenarioItem
            title="Multiple Cloud Servers"
            description="Create a Host for each server, can use the same key"
            example="prod-server, staging-server"
          />
          <ScenarioItem
            title="Jump Host Connection"
            description="Use ProxyJump to connect through a bastion to internal servers"
            example="bastion → internal-server"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Use the "Templates" feature to quickly create these common configs.
        </p>
      </div>
    ),
  },
  {
    id: 'ready',
    title: "You're Ready!",
    description: 'Start managing your SSH connections',
    icon: Check,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          You now know the basics. Here's how to get started:
        </p>
        <div className="space-y-3">
          <StepItem
            number={1}
            text="Use 'Connect Git' to set up GitHub/GitLab SSH"
          />
          <StepItem number={2} text="Or click + to add hosts manually" />
          <StepItem number={3} text="Generate new keys in the Keys tab" />
          <StepItem number={4} text="Add tags to organize your hosts" />
        </div>
        <div className="rounded-lg bg-primary/10 p-4 text-sm">
          <p className="text-primary font-medium">
            Everything stays on your computer
          </p>
          <p className="text-muted-foreground mt-1">
            SSH Buddy works completely offline. Your config and keys never leave
            your device.
          </p>
        </div>
      </div>
    ),
  },
]

export function Onboarding({
  open,
  onOpenChange,
  onComplete,
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
      onOpenChange(false)
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header with icon */}
        <div className="bg-primary/5 p-6 pb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{step.content}</div>

        {/* Progress and navigation */}
        <div className="border-t border-border p-4 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentStep
                    ? 'w-4 bg-primary'
                    : index < currentStep
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
            <Button size="sm" onClick={handleNext}>
              {isLast ? (
                <>
                  Get Started
                  <Check className="h-4 w-4 ml-1" />
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

interface FeatureItemProps {
  icon: typeof Server
  title: string
  description: string
}

function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

interface StepItemProps {
  number: number
  text: string
}

function StepItem({ number, text }: StepItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
        {number}
      </div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

interface ScenarioItemProps {
  title: string
  description: string
  example: string
}

function ScenarioItem({ title, description, example }: ScenarioItemProps) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      <p className="text-xs text-primary mt-1.5 font-mono">{example}</p>
    </div>
  )
}
