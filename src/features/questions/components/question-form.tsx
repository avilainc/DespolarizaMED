"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { RichEditor } from "./rich-editor";
import { salvarQuestao, type QuestaoInput } from "../actions";

const LETRAS = ["A", "B", "C", "D", "E"] as const;

export type QuestaoFormInicial = {
  id?: string;
  subjectId?: number;
  topic?: string;
  subtopic?: string | null;
  type?: "MULTIPLA_ESCOLHA" | "DISSERTATIVA";
  difficulty?: "FACIL" | "MEDIA" | "DIFICIL";
  vestibular?: string | null;
  year?: number | null;
  statement?: string;
  explanation?: string | null;
  alternativas?: { label: string; content: string; isCorrect: string }[];
};

const select =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function QuestionForm({
  disciplinas,
  temasSugeridos,
  inicial,
}: {
  disciplinas: { id: number; name: string }[];
  temasSugeridos: string[];
  inicial?: QuestaoFormInicial;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState(String(inicial?.subjectId ?? disciplinas[0]?.id ?? ""));
  const [topic, setTopic] = useState(inicial?.topic ?? "");
  const [subtopic, setSubtopic] = useState(inicial?.subtopic ?? "");
  const [type, setType] = useState<"MULTIPLA_ESCOLHA" | "DISSERTATIVA">(inicial?.type ?? "MULTIPLA_ESCOLHA");
  const [difficulty, setDifficulty] = useState<"FACIL" | "MEDIA" | "DIFICIL">(inicial?.difficulty ?? "MEDIA");
  const [vestibular, setVestibular] = useState(inicial?.vestibular ?? "");
  const [year, setYear] = useState(inicial?.year ? String(inicial.year) : "");
  const [statement, setStatement] = useState(inicial?.statement ?? "");
  const [explanation, setExplanation] = useState(inicial?.explanation ?? "");
  const [alternativas, setAlternativas] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const l of LETRAS) base[l] = inicial?.alternativas?.find((a) => a.label === l)?.content ?? "";
    return base;
  });
  const [correta, setCorreta] = useState<string>(
    inicial?.alternativas?.find((a) => a.isCorrect === "true")?.label ?? "A",
  );

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const input: QuestaoInput = {
      id: inicial?.id,
      subjectId,
      topic,
      subtopic,
      type,
      difficulty,
      vestibular,
      year: year || "",
      statement,
      explanation,
      alternativas: LETRAS.map((l) => ({ letra: l, content: alternativas[l] })),
      correta: correta as (typeof LETRAS)[number],
    };
    startTransition(async () => {
      const r = await salvarQuestao(input);
      if (r.ok) router.push("/professor/questoes");
      else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="subjectId">Disciplina</Label>
          <select id="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={select} required>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="topic">Tema</Label>
          <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} list="temas" required maxLength={120} placeholder="Citologia" />
          <datalist id="temas">
            {temasSugeridos.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subtopic">Subtema</Label>
          <Input id="subtopic" value={subtopic ?? ""} onChange={(e) => setSubtopic(e.target.value)} maxLength={120} placeholder="Membrana plasmática" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={select}>
              <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
              <option value="DISSERTATIVA">Dissertativa</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Dificuldade</Label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className={select}>
              <option value="FACIL">Fácil</option>
              <option value="MEDIA">Média</option>
              <option value="DIFICIL">Difícil</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vestibular">Vestibular</Label>
          <Input id="vestibular" value={vestibular ?? ""} onChange={(e) => setVestibular(e.target.value)} maxLength={60} placeholder="FUVEST (ou vazio se autoral)" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Ano</Label>
          <Input id="year" type="number" min={1990} max={2100} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Enunciado</Label>
        <RichEditor valor={statement} onChange={setStatement} minHeight={160} />
      </div>

      {type === "MULTIPLA_ESCOLHA" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Alternativas</legend>
          <p className="text-xs text-muted-foreground">
            Deixe em branco as que não usar. Fórmulas também funcionam aqui com <code>$…$</code>. Marque a correta.
          </p>
          {LETRAS.map((l) => (
            <div key={l} className="flex items-start gap-3">
              <label className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <input
                  type="radio"
                  name="correta"
                  value={l}
                  checked={correta === l}
                  onChange={() => setCorreta(l)}
                  aria-label={`Alternativa ${l} é a correta`}
                />
                {l})
              </label>
              <div className="flex-1">
                <RichEditor
                  valor={alternativas[l]}
                  onChange={(html) => setAlternativas((a) => ({ ...a, [l]: html }))}
                  minHeight={40}
                />
              </div>
            </div>
          ))}
        </fieldset>
      )}

      <div className="space-y-1.5">
        <Label>Resolução / comentário (opcional)</Label>
        <RichEditor valor={explanation ?? ""} onChange={setExplanation} minHeight={100} />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {inicial?.id ? "Salvar alterações" : "Publicar questão"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pendente}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
