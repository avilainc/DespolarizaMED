# 🎬 Despolariza Content Automation - Setup Checklist

## O que preciso de você para PUBLICAR SOZINHO

### **1. CREDENCIAIS & ACESSO**

#### YouTube
- [ ] **Google Account com acesso ao canal Despolariza**
  - Preciso: Email + permissão pra eu usar YouTube Data API
  - Ou: Você cria uma "App Password" se usa 2FA
  - **Resultado:** Eu consigo postar vídeos/Shorts automaticamente

#### Instagram
- [ ] **Instagram Business Account (não pessoal)**
  - Preciso: Username + Access Token do Meta Business
  - **Como gerar:** Settings → Apps and Websites → Instagram → Generate Token
  - **Resultado:** Eu consigo postar fotos/carousels automaticamente
  
- [ ] **Ou simplesmente:** Você compartilha credenciais via app seguro (1Password, Bitwarden)
  - Preciso: Instagram username + senha (ou app-specific password)
  - **Resultado:** Automação direta via Meta API

---

### **2. TOM & VOICE**

#### Exemplos de Posts que você JÁ fez
- [ ] Link de 3-5 posts recentes no Instagram
- [ ] Links de 3-5 descrições recentes no YouTube

**Por quê?** Vou analisar padrões:
- Emojis que você usa
- Hashtags favoritas
- Tamanho dos captions
- Como você faz CTAs (call-to-action)
- Estrutura: hook → conteúdo → CTA

#### Ou descreva seu tom em 1-2 frases
- Exemplo: "Descontraído, usa muito emoji 🔥, emojis de fogo/check, hashtags educacionais, CTA pedindo pra seguir"

---

### **3. FREQUÊNCIA & FORMATO**

#### YouTube
- [ ] Quantos vídeos **novos** você publica por semana?
- [ ] Você quer postar:
  - [ ] Descrição otimizada pra SEO automaticamente?
  - [ ] Tags automáticas?
  - [ ] Thumbnails gerados? (precisa de setup extra)

#### Instagram
- [ ] Quantos posts por semana?
- [ ] Formato preferido:
  - [ ] Carousels (múltiplas imagens)?
  - [ ] Fotos únicas?
  - [ ] Vídeos/Reels?

#### YouTube Shorts
- [ ] Você quer que eu:
  - [ ] Gere **roteiros** pra você filmar depois?
  - [ ] Gere **prompts visuais** dos vídeos já prontos?
  - [ ] Corte automaticamente dos vídeos principais? (precisa de setup com FFmpeg)

---

### **4. CONTEÚDO ESPECÍFICO DO DESPOLARIZA**

#### Estrutura típica de um post
- [ ] **Prova:** FUVEST 2024, UNESP 2023, etc?
- [ ] **Matéria:** Biologia, Química, Física, Português?
- [ ] **Questão específica ou resolução completa?**

#### Exemplo de um vídeo
- [ ] Título: ?
- [ ] Descrição: ?
- [ ] Quantos minutos: ?
- [ ] Você quer caption automática nos Shorts?

---

### **5. INTEGRAÇÃO COM FERRAMENTA DE AUTOMAÇÃO**

Você vai usar:
- [ ] **n8n** (open source, mais controle)?
- [ ] **Zapier** (mais simples)?
- [ ] **Só Claude gerando conteúdo** (você publica manual)?

---

## Resumo: Qual é o FLUXO IDEAL pra você?

**Opção A - Totalmente Automático:**
```
Você me diz: "Resolvi FUVEST 2024 Química questão 15"
     ↓
Eu gero: Tweet + Instagram caption + YouTube description + Shorts roteiro
     ↓
Zapier/n8n publica SOZINHO em YouTube + Instagram
     ↓
Você só monitora analytics
```

**Opção B - Semi-Automático:**
```
Você me diz: "Resolvi FUVEST 2024 Química questão 15"
     ↓
Eu gero: Instagram caption + YouTube description + Shorts roteiro
     ↓
Você revisão rápida (2 min) e aprova
     ↓
Zapier/n8n publica
```

**Opção C - Eu gero, você publica:**
```
Você me diz: "Resolvi FUVEST 2024 Química questão 15"
     ↓
Eu gero: Post pronto pra copiar-colar
     ↓
Você publica manual (mas é super rápido)
```

---

## Próximo Passo

**Responda isso:**
1. Compartilhe 3-5 posts/vídeos recentes (links)
2. Diga qual opção (A/B/C) você prefere
3. Responda os checkboxes que conseguir
4. Para os que não sabe: "não tenho, você me guia"

Pronto! Vou estruturar tudo.
