# -*- coding: utf-8 -*-
"""
Legendas das aulas: pnpm video:legendas [--aula N] [--modelo small] [--forcar]

Gera legendas.vtt ao lado do HLS de cada aula, transcrevendo com
faster-whisper. Roda nesta maquina pelo mesmo motivo da transcodificacao: o
servidor tem 2 vCPUs dividindo com vinte containers.

O audio vem do proprio HLS ja gerado, nao do MP4 original: o original e
apagado assim que a aula e transcodificada, e o audio do HLS (AAC 128k) e mais
que suficiente para reconhecimento de fala.

O modelo padrao e o `small`. O `base` erra termo tecnico demais numa aula de
biologia ("aneuploidia", "eucromatina") e o `medium` custa 3x o tempo para um
ganho que a revisao humana cobre. Quem quiser trocar usa --modelo.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

TRABALHO = Path(os.environ.get("VIDEO_WORKDIR", "C:/dm-video"))
HLS = TRABALHO / "hls"
FFMPEG = Path(
    os.environ.get(
        "FFMPEG_BIN",
        "C:/Users/nicol/AppData/Local/Microsoft/WinGet/Packages/"
        "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe",
    )
)


def hhmmssm(segundos: float) -> str:
    """Timestamp do WebVTT: HH:MM:SS.mmm (ponto, nao virgula, ao contrario do SRT)."""
    ms = int(round(segundos * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def extrair_audio(pasta_hls: Path, destino: Path) -> None:
    """Concatena os segmentos e extrai audio mono 16 kHz, que e o que o modelo usa."""
    subprocess.run(
        [
            str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(pasta_hls / "index.m3u8"),
            "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
            str(destino),
        ],
        check=True,
    )


def escrever_vtt(segmentos, destino: Path) -> int:
    linhas = ["WEBVTT", ""]
    n = 0
    for seg in segmentos:
        texto = seg.text.strip()
        if not texto:
            continue
        n += 1
        linhas.append(f"{hhmmssm(seg.start)} --> {hhmmssm(seg.end)}")
        linhas.append(texto)
        linhas.append("")
    destino.write_text("\n".join(linhas), encoding="utf-8")
    return n


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--aula", type=int, help="so esta aula")
    p.add_argument("--modelo", default="small")
    p.add_argument("--forcar", action="store_true", help="refaz legenda existente")
    args = p.parse_args()

    if not HLS.exists():
        print(f"nada em {HLS}: rode o pipeline de video antes")
        return 1

    pastas = sorted(d for d in HLS.iterdir() if d.is_dir() and (d / "index.m3u8").exists())
    if args.aula:
        pastas = [d for d in pastas if d.name == f"aula-{args.aula:02d}"]

    pendentes = [d for d in pastas if args.forcar or not (d / "legendas.vtt").exists()]
    if not pendentes:
        print("nenhuma aula pendente de legenda.")
        return 0

    from faster_whisper import WhisperModel

    print(f"carregando modelo {args.modelo}...")
    # int8 na CPU: metade da memoria e cerca do dobro da velocidade do float32,
    # com perda de qualidade que nao aparece em fala clara de aula gravada.
    modelo = WhisperModel(args.modelo, device="cpu", compute_type="int8")

    for pasta in pendentes:
        t0 = time.time()
        print(f"{pasta.name}: extraindo audio...", end="", flush=True)
        audio = TRABALHO / f"{pasta.name}.wav"
        extrair_audio(pasta, audio)

        print("\r" + " " * 60 + f"\r{pasta.name}: transcrevendo...", end="", flush=True)
        segmentos, info = modelo.transcribe(
            str(audio),
            language="pt",
            vad_filter=True,          # corta silencio: aula tem pausa longa entre slides
            beam_size=5,
            condition_on_previous_text=False,  # evita o modelo repetir frase quando trava
        )
        n = escrever_vtt(segmentos, pasta / "legendas.vtt")
        audio.unlink(missing_ok=True)

        gasto = time.time() - t0
        vel = info.duration / gasto if gasto else 0
        print(
            f"\r{pasta.name}: {n} falas em {gasto/60:.1f} min "
            f"({vel:.1f}x tempo real, audio de {info.duration/60:.0f} min)"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
