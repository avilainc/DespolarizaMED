"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MathExtension } from "@aarkue/tiptap-math-extension";
import "katex/dist/katex.min.css";
import { Bold, Italic, List, ListOrdered, Sigma } from "lucide-react";

/**
 * Editor de texto com fórmulas: escrever `$x^2$` vira LaTeX renderizado na
 * hora (a extensão troca o delimitador por um nó inline). O HTML salvo mantém
 * o LaTeX em `data-latex`, e `renderizarMath` (servidor) converte para KaTeX
 * na hora de mostrar ao aluno.
 */
export function RichEditor({
  valor,
  onChange,
  placeholder,
  minHeight = 120,
}: {
  valor: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false }),
      MathExtension.configure({ evaluation: false, delimiters: "dollar" }),
    ],
    content: valor,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none px-3 py-2 text-sm text-foreground outline-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5",
        style: `min-height:${minHeight}px`,
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return <div className="rounded-md border border-input bg-background" style={{ minHeight }} />;
  }

  const botao = (ativo: boolean) =>
    `rounded p-1.5 transition-colors ${ativo ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`;

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-[3px] focus-within:ring-ring/50">
      <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
        <button
          type="button"
          title="Negrito (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={botao(editor.isActive("bold"))}
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          title="Itálico (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={botao(editor.isActive("italic"))}
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          title="Lista"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={botao(editor.isActive("bulletList"))}
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          title="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={botao(editor.isActive("orderedList"))}
        >
          <ListOrdered className="size-4" />
        </button>
        <span className="ml-auto inline-flex items-center gap-1 pr-1 text-[11px] text-muted-foreground">
          <Sigma className="size-3.5" /> fórmula: escreva entre <code className="rounded bg-muted px-1">$</code>, ex.{" "}
          <code className="rounded bg-muted px-1">$H_2O$</code>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
