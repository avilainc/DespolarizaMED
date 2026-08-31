<#
  Sobe o acervo de provas para o Google Drive via rclone.

  Pre-requisito (uma unica vez):
      rclone config create despolariza drive scope=drive
  ...e autorizar no navegador. Depois disso este script roda sozinho.

  A pasta de destino ja existe no Drive:
      DespolarizaMED - Acervo de Provas
      https://drive.google.com/drive/folders/17mkCgx9sMN9NThP7aZpxKe8szqaTGL4L
#>
param(
    [string]$Remoto  = "despolariza",
    [string]$PastaId = "17mkCgx9sMN9NThP7aZpxKe8szqaTGL4L",
    [switch]$Simular          # -Simular = dry run, nao envia nada
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

# origem local -> subpasta no Drive
# Cada destino e' o ID da pasta ja' criada no Drive.
# Fora daqui de proposito:
#   data\listas\listas.zip   -> zip de tudo que ja' vai avulso.
#   data\questions.jsonl     -> intermediario, superado por questions_final.
#   data\*.log               -> log de execucao do pipeline.
$envios = @(
    @{ Local = "data\listas\cadernos-por-materia"; Nome = "Cadernos por materia"; Id = "100BJDSTeCFA9jwLwMAUOU2UllZczURkk" }
    @{ Local = "data\listas\cadernos-por-tema";    Nome = "Cadernos por tema";    Id = "1BYLoZBM7LBKFDjuNzkHa2VgpB6PQxiyY" }
    # geracao de 20/08, anterior as correcoes de capa de prova, questoes
    # fundidas e classificacao. Vai para uma pasta com nome que avisa.
    @{ Local = "data\listas\cadernos";             Nome = "Versao anterior (20-08) - SUPERADA"; Id = "1kadBYhwPzV2JeYV9QlgAzHjAfwoNGFdz" }
    @{ Local = "data\listas";                       Nome = "Rascunhos de layout"; Id = "1bGY29utSJh80iQr_iRQd2_S1WZG7za7t"
       Extra = @("--max-depth", "1") }
    @{ Local = "docs";                               Nome = "Documentacao e dados"; Id = "1ZmlgyoF24-QmqSzsoJMaiqnZdkkSr4D0" }
    @{ Local = "assets";                             Nome = "Documentacao e dados"; Id = "1ZmlgyoF24-QmqSzsoJMaiqnZdkkSr4D0" }
    @{ Local = "data";                               Nome = "Documentacao e dados"; Id = "1ZmlgyoF24-QmqSzsoJMaiqnZdkkSr4D0"
       Extra = @("--max-depth", "1", "--include", "*.jsonl", "--include", "validacao.html",
                 "--include", "gold-review.html", "--include", "gold-chaves.txt",
                 "--exclude", "questions.jsonl") }
)

$comuns = @(
    "--transfers=4"          # 4 uploads simultaneos; o Drive limita acima disso
    "--checkers=8"
    "--drive-chunk-size=64M" # menos requisicoes por arquivo grande
    "--progress"
    "--stats=10s"
)
if ($Simular) { $comuns += "--dry-run" }

foreach ($e in $envios) {
    $local = Join-Path $raiz $e.Local
    if (-not (Test-Path $local)) { Write-Warning "pulando (nao existe): $($e.Local)"; continue }

    $arquivos = Get-ChildItem $local -Recurse -File
    $mb = [math]::Round((($arquivos | Measure-Object Length -Sum).Sum / 1MB), 1)
    Write-Host "`n=== $($e.Local) -> $($e.Nome)  ($($arquivos.Count) arquivos, $mb MB) ===" -ForegroundColor Cyan

    # copy (nao sync): nunca apaga nada que ja esteja no Drive
    $extra = if ($e.Extra) { $e.Extra } else { @() }
    & rclone copy $local "${Remoto}:" "--drive-root-folder-id=$($e.Id)" @extra @comuns
    if ($LASTEXITCODE -ne 0) { Write-Warning "rclone terminou com codigo $LASTEXITCODE em '$($e.Local)'" }
}

Write-Host "`nPronto: https://drive.google.com/drive/folders/$PastaId" -ForegroundColor Green
