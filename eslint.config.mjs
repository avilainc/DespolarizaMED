import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // Scripts .cjs rodam com `node --require`/CLI puro, fora do pipeline do
    // Next: precisam de `require()` real (não há interop ESM ali), então as
    // regras de import do `next/typescript` não se aplicam a eles.
    // `.next/**` é gerado (tipagem de rotas etc.); `compat.extends` não traz
    // os ignores padrão do Next para o flat config, então sem isto rodar
    // `pnpm lint` com um `.next` de build local na pasta produz milhares de
    // avisos em código que ninguém escreveu.
    ignores: ["scripts/**/*.cjs", ".next/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
