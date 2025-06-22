import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-ring active-scale disabled:disabled-state",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive: "bg-error-500 text-white hover:bg-error-600 shadow-lg hover:shadow-xl",
        outline: "btn-secondary",
        secondary: "bg-neutral-100 text-gray-900 hover:bg-neutral-200 shadow-sm hover:shadow-md",
        ghost: "btn-ghost",
        link: "text-auction-600 underline-offset-4 hover:underline p-0 h-auto shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2.5 text-sm",
        sm: "h-8 px-3 py-2 text-xs rounded-lg",
        lg: "h-12 px-6 py-3 text-base rounded-xl",
        icon: "h-10 w-10 p-0",
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
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }