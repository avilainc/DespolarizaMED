import type { CollectionConfig } from "payload";

/**
 * Legenda de aula paga. Mesma razão de `Transcripts`: pela REST, `read: () =>
 * true` entregava a legenda (e, por profundidade, a aula e o professor) a
 * qualquer anônimo. O app lê pela Local API e não é afetado.
 */
export const Captions: CollectionConfig = {
  slug: "captions",
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
    },
    {
      name: "language",
      type: "text",
      defaultValue: "pt-BR",
    },
    {
      name: "vttFile",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "reviewed",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
