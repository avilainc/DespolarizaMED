import type { CollectionConfig } from "payload";

/**
 * A transcrição é a aula inteira em texto. `read: () => true` a entregava pela
 * REST do Payload (`GET /api/transcripts`) para qualquer anônimo — o mesmo
 * conteúdo que o HLS em /api/aulas cobra assinatura para servir.
 *
 * Fechar aqui não afeta nenhuma tela: o app lê o Payload só pela Local API
 * (`getPayloadClient()`), que roda com `overrideAccess: true`. Quem passa a
 * receber 403 é exclusivamente a REST — que nenhum código nosso chama.
 */
export const Transcripts: CollectionConfig = {
  slug: "transcripts",
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === "ADMIN",
  },
  fields: [
    {
      name: "lesson",
      type: "relationship",
      relationTo: "lessons",
      required: true,
      unique: true,
    },
    {
      name: "content",
      type: "textarea",
      required: true,
    },
  ],
};
