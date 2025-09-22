import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string
  removable?: boolean
  onRemove?: () => void
  size?: "sm" | "md" | "lg"
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, color = "#3B82F6", removable = false, onRemove, size = "md", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "text-xs px-2 py-1",
      md: "text-sm px-3 py-1",
      lg: "text-base px-4 py-2"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium border transition-colors",
          sizeClasses[size],
          className
        )}
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
          color: color
        }}
        {...props}
      >
        <span>{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }
)
Tag.displayName = "Tag"

export { Tag }