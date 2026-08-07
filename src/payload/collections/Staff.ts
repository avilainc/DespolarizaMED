import type { CollectionConfig } from "payload";

export const Staff: CollectionConfig = {
  slug: "staff",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === "ADMIN",
    update: ({ req }) => req.user?.role === "ADMIN",
    delete: ({ req }) => req.user?.role === "ADMIN",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "TEACHER",
      options: [
        { label: "Admin", value: "ADMIN" },
        { label: "Professor", value: "TEACHER" },
      ],
    },
  ],
};
