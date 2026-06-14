import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[rgb(255,255,255)] shadow-sm hover:bg-[var(--accent-hover)] rounded-[var(--radius-sm)]",
        destructive: "bg-[var(--status-danger)] text-[rgb(255,255,255)] shadow-sm hover:opacity-90 rounded-[var(--radius-sm)]",
        outline: "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--fg)] rounded-[var(--radius-sm)]",
        secondary: "bg-[var(--bg-card)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[var(--radius-sm)]",
        ghost: "text-[var(--fg-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] rounded-[var(--radius-sm)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
       data-qoder-id="qel-comp-6c61a0c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-comp-6c61a0c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ui/button.tsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;comp&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:7}}"/>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
