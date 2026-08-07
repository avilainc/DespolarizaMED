import type { CollectionConfig } from "payload";

export const GlossaryTerms: CollectionConfig = {
  slug: "glossary-terms",
  admin: {
    useAsTitle: "term",
  },
  access: {
    read: () => true,
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
