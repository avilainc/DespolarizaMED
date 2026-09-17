import type { CollectionConfig } from "payload";

/**
 * Só anexos de conteúdo pago moram aqui: `lesson_materials.file` e o `.vtt` de
 * `captions`. Nenhuma imagem pública usa esta collection (o site estático vem
 * de /public), então abrir a leitura não servia a nada e furava o portão:
 * `LessonMaterials` exigia sessão, mas o ARQUIVO que ela aponta ficava
 * acessível por `/api/media/file/<nome>` para qualquer um.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  upload: {
    staticDir: "media",
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};
