import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#FF3D00] text-[#0A0A0A]",
        secondary: "border-transparent bg-[#1A1A1A] text-[#FAFAFA]",
        destructive: "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]",
        outline: "border-[#262626] bg-transparent text-[#FAFAFA]",
        ghost: "border-transparent bg-transparent text-[#737373] hover:bg-[#1A1A1A] hover:text-[#FAFAFA]",
        link: "border-transparent bg-transparent text-[#FF3D00] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
