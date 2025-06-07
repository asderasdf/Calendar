import * as React from "react"
import { X } from "lucide-react"

export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, action, open = true, onOpenChange }, ref) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        className="relative flex w-full max-w-sm items-start rounded-md border border-gray-300 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex flex-col flex-1 gap-1">
          {title && <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>}
          {description && <div className="text-sm text-gray-700 dark:text-gray-300">{description}</div>}
          {action}
        </div>
        <button
          onClick={() => onOpenChange?.(false)}
          className="ml-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
)

Toast.displayName = "Toast"
