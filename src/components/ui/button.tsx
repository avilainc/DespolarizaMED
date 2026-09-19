import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const variantesDoBotao = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // A acao principal usa o azul do disco (brand-600), nao o azul-marinho
        // institucional: e a cor que a marca usa para "andar para frente".
        //
        // Isto ERA duas variantes. `default` pintava de azul-marinho e tinha
        // exatamente uma ocorrencia no produto inteiro; `brand` pintava de
        // azul do disco e tinha dezenove. Ou seja: o padrao do sistema era a
        // cor que ninguem usava, e todo `<Button>` escrito sem variante saia
        // errado em silencio. Agora ha um azul preenchido so, e ele e o
        // padrao.
        default: "bg-brand-600 text-white shadow-xs hover:bg-brand-500 active:bg-brand-700",
        outline:
          "border-border bg-surface shadow-xs hover:bg-surface-subtle hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Alturas subidas de 32/36px para 40/44px: o pedido de campo com
      // 42-46px no desktop vale para o botao ao lado dele, senao o formulario
      // fica com um controle alto e um baixo na mesma linha. `sm` continua
      // existindo para acao secundaria dentro de card.
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8125rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * As classes do botao, ja resolvidas pelo tailwind-merge.
 *
 * O `cn` aqui dentro NAO e redundancia: sem ele, `variant: "outline"` saia
 * SEM BORDA em todo lugar que chama esta funcao direto num `<Link>` — que e
 * como quase todo botao do produto e escrito. A base da cva declara
 * `border-transparent` e a variante `outline` declara `border-border`; o
 * `cx` interno da cva so concatena, entao as duas classes chegavam juntas ao
 * elemento e quem decidia era a ORDEM NO CSS gerado, nao a ordem no atributo.
 * O Tailwind emite `border-transparent` depois, e o botao de contorno ficava
 * branco sobre branco — visivel so pela sombra, e invisivel dentro de um
 * cartao branco (foi assim que apareceu, nos planos da landing).
 *
 * `<Button>` nunca teve o defeito porque ja passava por `cn`. Mover o `cn`
 * para ca faz os dois caminhos renderizarem a mesma coisa, que e o ponto.
 */
function buttonVariants(props?: Parameters<typeof variantesDoBotao>[0]) {
  return cn(variantesDoBotao(props))
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof variantesDoBotao>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
