import type { CollectionConfig } from "payload";

export const GlossaryTerms: CollectionConfig = {
  slug: "glossary-terms",
  admin: {
    useAsTitle: "term",
  },
  access: {
    // `/glossario` exige assinatura (`requireAssinatura`), então a definição
    // dos termos é conteúdo pago. Com `read: () => true`, `GET
    // /api/glossary-terms` devolvia o glossário inteiro para anônimo pela REST
    // do Payload — a tela cobrava, a API não. O app lê pela Local API.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === "ADMIN",
  },
  fields: [
    {
      name: "term",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "definition",
      type: "textarea",
      required: true,
    },
    {
      name: "subject",
      type: "relationship",
      relationTo: "subjects",
    },
  ],
};
