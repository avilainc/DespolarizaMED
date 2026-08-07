import type { CollectionConfig } from "payload";

export const Captions: CollectionConfig = {
  slug: "captions",
  access: {
    read: () => true,
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
