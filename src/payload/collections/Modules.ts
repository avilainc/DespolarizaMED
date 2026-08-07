import type { CollectionConfig } from "payload";

export const Modules: CollectionConfig = {
  slug: "modules",
  admin: {
    useAsTitle: "name",
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === "ADMIN",
  },
  fields: [
    {
      name: "subject",
      type: "relationship",
      relationTo: "subjects",
      required: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
    },
  ],
};
