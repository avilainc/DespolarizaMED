import type { CollectionConfig } from "payload";

export const Lessons: CollectionConfig = {
  slug: "lessons",
  admin: {
    useAsTitle: "title",
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return { published: { equals: true } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === "ADMIN",
  },
  fields: [
    {
      name: "module",
      type: "relationship",
      relationTo: "modules",
      required: true,
    },
    {
      name: "teacher",
      type: "relationship",
      relationTo: "staff",
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "videoUrl",
      type: "text",
    },
    {
      name: "durationSeconds",
      type: "number",
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
