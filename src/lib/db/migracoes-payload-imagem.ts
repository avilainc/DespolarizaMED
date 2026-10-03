import { migrations } from "@/migrations";

/**
 * As migrations do Payload que esta build carrega, na ordem de execução — o
 * mesmo array que o adapter recebe em `prodMigrations` (ver
 * `src/payload/payload.config.ts`). Separado de `./migracoes-payload.ts`
 * porque importar `@/migrations` só funciona dentro do bundle do Next.
 */
export const MIGRACOES_PAYLOAD_DA_IMAGEM: string[] = migrations.map((m) => m.name);
