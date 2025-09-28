import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "btn"
    const variantClasses = {
      default: "btn-primary",
      destructive: "btn-destructive", 
      outline: "btn-outline",
      secondary: "btn-secondary",
      ghost: "",
      link: ""
    }
    const sizeClasses = {
      default: "",
      sm: "btn-sm",
      lg: "btn-lg", 
      icon: "btn-sm"
    }

    const buttonClassName = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      variant === "ghost" && "hover:bg-gray-50",
      variant === "link" && "text-blue-600 hover:underline",
      size === "icon" && "w-9 h-9",
      className
    )

    return (
      <button
        className={buttonClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }