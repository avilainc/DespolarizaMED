import type { CollectionConfig } from "payload";

export const LessonMaterials: CollectionConfig = {
  slug: "lesson-materials",
  admin: {
    useAsTitle: "title",
  },
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
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Apostila", value: "APOSTILA" },
        { label: "Slides", value: "SLIDES" },
        { label: "Anotações", value: "ANOTACOES" },
        { label: "Lista de Exercícios", value: "LISTA_EXERCICIOS" },
        { label: "Resolução", value: "RESOLUCAO" },
      ],
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "file",
      type: "upload",
      relationTo: "media",
      required: true,
    },
  ],
};
