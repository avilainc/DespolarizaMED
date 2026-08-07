import type { CollectionConfig } from "payload";

export const Transcripts: CollectionConfig = {
  slug: "transcripts",
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
      unique: true,
    },
    {
      name: "content",
      type: "textarea",
      required: true,
    },
  ],
};
