// Alternativa ao Panda Video pra não travar o teste da plataforma numa
// conta que ainda não existe. Funciona com o ID do arquivo no Google
// Drive (da URL .../file/d/AQUI/view) — o arquivo precisa estar
// compartilhado como "Qualquer pessoa com o link" e, no compartilhamento
// avançado, com "baixar/copiar" desativado pra quem só visualiza.
// Risco real: cota diária de visualização do Drive pode bloquear o vídeo
// se muitos alunos assistirem no mesmo dia — ok pra teste, não pra produção.
export function DriveEmbed({ fileId }: { fileId: string }) {
  return (
    <iframe
      src={`https://drive.google.com/file/d/${fileId}/preview`}
      className="w-full h-full border-0"
      allow="autoplay"
      allowFullScreen
      title={`Aula (Drive ${fileId})`}
    />
  )
}
