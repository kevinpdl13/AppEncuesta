import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      danger: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm",
      success: "bg-success text-success-foreground hover:bg-success/90 shadow-md",
      outline: "border-2 border-primary text-primary hover:bg-primary/5 bg-transparent",
      ghost: "hover:bg-muted text-foreground",
    };

    const sizes = {
      default: "h-11 px-6 font-semibold",
      sm: "h-9 rounded-lg px-4 text-sm font-medium",
      lg: "h-14 rounded-2xl px-8 text-lg font-bold",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
