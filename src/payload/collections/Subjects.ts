import type { CollectionConfig } from "payload";

export const Subjects: CollectionConfig = {
  slug: "subjects",
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
      name: "name",
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
      name: "description",
      type: "textarea",
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
    },
  ],
};
