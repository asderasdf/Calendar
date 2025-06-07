import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, action, className, open = true, onOpenChange, ...props }, ref) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          "bg-white text-black shadow-lg rounded-lg border border-gray-300 px-4 py-3 w-[300px] animate-fade-in-up",
          className
        )}
        role="alert"
        {...props}
      >
        {title && <div className="font-semibold text-sm mb-1">{title}</div>}
        {description && <div className="text-sm text-gray-600">{description}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    )
  }
)

Toast.displayName = "Toast"
