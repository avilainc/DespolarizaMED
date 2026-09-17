import type { CollectionConfig } from "payload";

export const Staff: CollectionConfig = {
  slug: "staff",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    // Collection de autenticação do painel: `read: () => true` publicava o
    // e-mail de cada professor/admin em `GET /api/staff`, que é exatamente o
    // identificador de login do /admin. O Payload já esconde hash e salt, mas
    // a lista de contas não deveria sair. A landing lê os professores pela
    // Local API, então continua funcionando.
    read: ({ req }) => Boolean(req.user),
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
