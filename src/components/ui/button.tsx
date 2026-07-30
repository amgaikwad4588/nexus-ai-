"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#FF3D00] text-[#0A0A0A] hover:bg-[#FF3D00]/90",
        outline:
          "border-[#FAFAFA] bg-transparent text-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]",
        secondary:
          "border-transparent bg-[#1A1A1A] text-[#FAFAFA] hover:bg-[#262626]",
        ghost:
          "border-transparent bg-transparent text-[#737373] hover:text-[#FAFAFA] underline-on-hover",
        destructive:
          "border-transparent bg-[#DC2626] text-[#FAFAFA] hover:bg-[#DC2626]/90",
        link: "border-transparent bg-transparent text-[#FF3D00] underline-offset-4 hover:underline",
        primary:
          "border-transparent bg-transparent text-[#FF3D00] uppercase tracking-wider animate-underline",
      },
      size: {
        default: "h-10 gap-2 px-5",
        sm: "h-8 gap-1.5 px-4 text-xs",
        lg: "h-12 gap-2.5 px-8 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
