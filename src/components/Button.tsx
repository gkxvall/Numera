import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-numera-blue text-white focus-visible:ring-numera-blue-dark",
  secondary: "bg-numera-yellow text-numera-outline focus-visible:ring-numera-yellow-dark",
  danger: "bg-numera-red text-white focus-visible:ring-numera-red-dark",
  success: "bg-numera-green text-numera-outline focus-visible:ring-numera-green-dark",
  ghost: "bg-numera-surface text-foreground focus-visible:ring-numera-blue",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-sm gap-1.5",
  md: "h-14 px-6 text-base gap-2",
  lg: "h-16 px-8 text-lg gap-2.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "font-display border-numera-outline shadow-chunky active:shadow-chunky-press rounded-chunky inline-flex touch-manipulation items-center justify-center border-4 tracking-wide transition-[transform,box-shadow] duration-100 select-none active:translate-y-[3px]",
        "hover:brightness-105",
        "focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
