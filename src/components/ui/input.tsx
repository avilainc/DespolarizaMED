import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      // Altura, borda, foco e estado desabilitado vem da classe `.campo` em
      // globals.css, a mesma que serve <select> e <textarea>. Antes este
      // componente tinha 32px e as telas escreviam `h-9` a mao nos selects ao
      // lado: tres alturas diferentes na mesma linha de formulario.
      className={cn(
        "campo file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
