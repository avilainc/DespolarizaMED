/**
 * Pipeline de vídeo das aulas: Drive -> HLS -> servidor.
 *
 *   pnpm video:pipeline [--modulo N] [--aula N] [--so-baixar] [--forcar]
 *
 * Roda uma aula por vez e apaga o original ao terminar: o acervo inteiro tem
 * 55 GB e não precisa caber em disco de uma vez, só a aula da vez.
 *
 * A transcodificação acontece AQUI, não no servidor. O host de produção tem
 * 2 vCPUs dividindo com mais de vinte containers; transcodificar lá derrubaria
 * as outras apps por horas. É o mesmo princípio do deploy da casa: o trabalho
 * pesado é local, o servidor recebe o resultado.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { listarPasta, baixar } from "./drive.mjs";

const exec = promisify(execFile);

const PASTA_BIOLOGIA = "1Nn0SH-_X7-E8wdZpJncjXro9cRIFagz0";
const TRABALHO = process.env.VIDEO_WORKDIR ?? "C:/dm-video";
const FFMPEG =
  process.env.FFMPEG_BIN ??
  "C:/Users/nicol/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe";
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/, "ffprobe.exe");

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : null;
};
const flag = (nome) => args.includes(`--${nome}`);

const GB = 1024 ** 3;
const fmt = (b) => `${(b / GB).toFixed(2)} GB`;
const hhmmss = (s) =>
  `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** "aula 12 - núcleo e cromossomos.mp4" -> { numero: 12, titulo: "núcleo e cromossomos" } */
function interpretarNome(nome) {
  const m = nome.match(/^aula\s+(\d+)\s*[-–]\s*(.+)\.mp4$/i);
  if (!m) return null;
  return { numero: Number(m[1]), titulo: m[2].trim() };
}

async function duracao(arquivo) {
  const { stdout } = await exec(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    arquivo,
  ]);
  return Number(stdout.trim());
}

/**
 * Transcodifica para HLS numa única faixa 720p.
 *
 * Uma faixa só, e não ABR com três resoluções: triplicaria o tempo de
 * processamento e o espaço, e a aula é slide com narração — o gargalo de quem
 * assiste é a banda, não a resolução. Quando houver medição de abandono por
 * buffering, aí vale a pena.
 *
 * `h264_qsv` (Quick Sync) quando existir: nesta máquina ele é ~6x mais rápido
 * que libx264 e a diferença de qualidade em slide é imperceptível.
 */
async function paraHls(entrada, saida, usarQsv) {
  try {
    await encodar(entrada, saida, usarQsv);
  } catch (erro) {
    // O Quick Sync aloca buffers grandes e falha com "Cannot allocate memory"
    // quando a máquina está apertada (esta tem 7,7 GB). O libx264 usa bem
    // menos RAM em troca de ser mais lento: melhor lento que interrompido no
    // meio de um lote de 29 aulas.
    if (!usarQsv || !/allocate memory|Error allocating/i.test(String(erro))) throw erro;
    console.log("\n  QSV sem memória; refazendo com libx264 (mais lento)");
    await rm(saida, { recursive: true, force: true });
    await encodar(entrada, saida, false);
  }
}

async function encodar(entrada, saida, usarQsv) {
  await mkdir(saida, { recursive: true });

  const video = usarQsv
    ? ["-c:v", "h264_qsv", "-preset", "medium", "-global_quality", "26", "-look_ahead", "1"]
    : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "24"];

  await exec(
    FFMPEG,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", entrada,
      "-vf", "scale=-2:720",
      ...video,
      "-maxrate", "2000k", "-bufsize", "4000k",
      "-c:a", "aac", "-b:a", "128k", "-ac", "2",
      // 6 s por segmento: o padrão da Apple, e o que dá troca de rede rápida
      // sem encher o diretório de arquivos.
      "-f", "hls",
      "-hls_time", "6",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(saida, "s%04d.ts"),
      path.join(saida, "index.m3u8"),
    ],
    { maxBuffer: 1024 * 1024 * 32 },
  );
}

async function tamanhoPasta(dir) {
  let total = 0;
  for (const f of await readdir(dir)) total += (await stat(path.join(dir, f))).size;
  return total;
}

async function main() {
  const modulos = await listarPasta(PASTA_BIOLOGIA);
  const filtroModulo = opcao("modulo");
  const filtroAula = opcao("aula") ? Number(opcao("aula")) : null;

  await mkdir(`${TRABALHO}/originais`, { recursive: true });
  await mkdir(`${TRABALHO}/hls`, { recursive: true });

  const usarQsv = !flag("sem-qsv");
  console.log(`ffmpeg: ${usarQsv ? "h264_qsv (hardware)" : "libx264 (CPU)"}`);
  console.log(`trabalho em ${TRABALHO}\n`);

  for (const modulo of modulos) {
    if (filtroModulo && !modulo.name.startsWith(`módulo ${filtroModulo}`)) continue;

    const aulas = (await listarPasta(modulo.id))
      .filter((a) => a.mimeType === "video/mp4")
      .map((a) => ({ ...a, meta: interpretarNome(a.name) }))
      .filter((a) => a.meta)
      .sort((a, b) => a.meta.numero - b.meta.numero);

    for (const aula of aulas) {
      const n = aula.meta.numero;
      if (filtroAula && n !== filtroAula) continue;

      const slug = `aula-${String(n).padStart(2, "0")}`;
      const destinoHls = `${TRABALHO}/hls/${slug}`;
      const original = `${TRABALHO}/originais/${slug}.mp4`;

      if (existsSync(path.join(destinoHls, "index.m3u8")) && !flag("forcar")) {
        console.log(`${slug}: já processada, pulando`);
        continue;
      }

      const t0 = Date.now();
      process.stdout.write(`${slug} "${aula.meta.titulo}" · baixando ${fmt(Number(aula.size))}`);

      if (!existsSync(original)) {
        await baixar(aula.id, original, (b, t) =>
          process.stdout.write(`\r${slug} "${aula.meta.titulo}" · baixando ${Math.round((b / t) * 100)}%   `),
        );
      }
      const tDown = (Date.now() - t0) / 1000;
      const dur = await duracao(original);
      process.stdout.write(`\r${slug} "${aula.meta.titulo}" · ${hhmmss(dur)} · baixado em ${hhmmss(tDown)}\n`);

      if (flag("so-baixar")) continue;

      const t1 = Date.now();
      process.stdout.write(`  transcodificando...`);
      await paraHls(original, destinoHls, usarQsv);
      const tEnc = (Date.now() - t1) / 1000;
      const tam = await tamanhoPasta(destinoHls);

      console.log(
        `\r  HLS pronto: ${fmt(tam)} (${((tam / Number(aula.size)) * 100).toFixed(0)}% do original)` +
          ` em ${hhmmss(tEnc)} · ${(dur / tEnc).toFixed(1)}x tempo real`,
      );

      // O original sai do disco assim que o HLS existe: 55 GB não cabem, e o
      // master continua no Drive.
      if (!flag("guardar-original")) await rm(original, { force: true });
    }
  }
}

main().catch((e) => {
  console.error("\nfalhou:", e.message);
  process.exit(1);
});
