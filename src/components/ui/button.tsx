import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 hover:border-primary/70 terminal-glow-sm hover:terminal-glow',
        destructive:
          'border border-destructive/50 bg-destructive/20 text-destructive hover:bg-destructive/30 hover:border-destructive/70 shadow-[0_0_10px_hsl(0_72%_50%/0.15)] hover:shadow-[0_0_15px_hsl(0_72%_50%/0.25)]',
        outline:
          'border border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50',
        secondary:
          'border border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50',
        ghost: 'hover:bg-primary/10 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
        terminal:
          'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 terminal-glow-sm hover:terminal-glow',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
