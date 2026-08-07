# server/jobs

Workers/processors do BullMQ: transcodificação de vídeo (FFmpeg), transcrição (faster-whisper), envio de e-mail (Resend).

Rodam como processo Node separado do Next.js (não dentro do request handler). Ver `docs/roadmap.md`.
