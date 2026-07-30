import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full border border-[#262626] bg-[#1A1A1A] px-4 py-3 text-base text-[#FAFAFA] transition-colors duration-150 outline-none placeholder:text-[#737373] focus:border-[#FF3D00] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#DC2626] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
