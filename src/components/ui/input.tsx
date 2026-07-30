import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 border border-[#262626] bg-[#1A1A1A] px-4 py-3 text-base text-[#FAFAFA] transition-colors duration-150 outline-none placeholder:text-[#737373] focus:border-[#FF3D00] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:h-14 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#FAFAFA] aria-invalid:border-[#DC2626]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
