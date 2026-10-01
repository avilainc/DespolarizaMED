-- Perfis (Supabase Auth já cria auth.users; isso guarda dados extras)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP DEFAULT now()
);

-- Cursos (ex: Biologia, Geografia — um por matéria/trilha)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Módulos dentro de um curso (agrupam aulas por tema)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Aulas (o vídeo em si mora no provedor de streaming escolhido —
-- video_provider + video_id apontam pra lá, nunca um arquivo local).
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_provider TEXT CHECK (video_provider IN ('drive', 'panda', 'bunny', 'vimeo', 'youtube')),
  video_id TEXT,
  duration_seconds INTEGER,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Planos de assinatura (provider-agnóstico — Stripe ou Mercado Pago)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  provider TEXT CHECK (provider IN ('stripe', 'mercadopago')),
  provider_price_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Assinaturas ativas dos alunos
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago')),
  provider_subscription_id TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Progresso do aluno por aula
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Índices
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Catálogo público (curso publicado é visível pra todo mundo, logado ou não —
-- precisa pra landing page/vitrine funcionar sem auth)
CREATE POLICY "Published courses are viewable by everyone" ON courses FOR SELECT USING (published = true);
CREATE POLICY "Modules of published courses are viewable by everyone" ON modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.published = true)
);
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (active = true);

-- Aulas: metadado (título) é público, mas o video_id só deve ser lido
-- server-side (via service role, checando assinatura ativa) — não expor
-- direto pro client anônimo. Aqui liberamos só a leitura de preview grátis.
CREATE POLICY "Free preview lessons are viewable by everyone" ON lessons FOR SELECT USING (is_free_preview = true);
CREATE POLICY "Subscribers can view lessons" ON lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.user_id = auth.uid() AND subscriptions.status = 'active'
  )
);

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Perfil de aluno cria sozinho no cadastro (senão fica orfão até
-- alguém inserir manual) + campos de escola/cursinho pedidos pro
-- perfil, e função is_admin() reutilizada pelas policies de admin.
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_type TEXT CHECK (school_type IN ('escola', 'cursinho'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_years INTEGER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admin passa a poder criar/editar/apagar catálogo (faltava — o painel
-- /admin já faz esses inserts pelo client normal, então sem isso o RLS
-- bloquearia tudo silenciosamente).
CREATE POLICY "Admins manage courses" ON courses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage modules" ON modules FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage lessons" ON lessons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage plans" ON plans FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT USING (public.is_admin());

-- ============================================================
-- Calendário — evento único e flexível (prova, compromisso, lembrete
-- etc.) marcado por cor/categoria, no estilo grade de mês do SinapseMed
-- (mesmo padrão visual, mas aqui gravado no Supabase em vez de
-- localStorage, já que é produto pago e precisa sincronizar entre
-- dispositivos).
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  color TEXT NOT NULL DEFAULT 'blue',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calendar events" ON calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Glossário — admin cadastra, todo aluno logado lê. 3 categorias de
-- renderização, combinadas com Paulo antes de construir:
--   'definicao' — termo + definição + exemplos, sem imagem (maioria das
--                 matérias, incluindo redação/literatura)
--   'pessoa'    — figura histórica: imagem + biografia (nascimento, o
--                 que fez) no campo definition
--   'visual'    — conceito que ganha com imagem (geografia: rocha; ou
--                 fórmula/diagrama de matemática/física), com um campo
--                 extra pra aplicação/exemplo de uso
-- ============================================================
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'definicao' CHECK (category IN ('definicao', 'pessoa', 'visual')),
  examples TEXT,
  image_url TEXT,
  extra_info TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_glossary_terms_subject ON glossary_terms(subject);
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Glossary is viewable by everyone" ON glossary_terms FOR SELECT USING (true);
CREATE POLICY "Admins manage glossary" ON glossary_terms FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Gamificação: desafio diário de questões rápidas + conquistas.
-- O log de daily_challenge_log também serve de base pra tabela de
-- desempenho/progressão dia a dia.
-- ============================================================
CREATE TABLE IF NOT EXISTS quick_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE quick_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quick questions viewable by authenticated users" ON quick_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage quick questions" ON quick_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS daily_challenge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_answered INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);
CREATE INDEX idx_daily_challenge_user_id ON daily_challenge_log(user_id);
ALTER TABLE daily_challenge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily challenge log" ON daily_challenge_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own unlocked achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users unlock own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket pra foto de perfil
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Catálogo de conquistas — categorias inspiradas em padrões comuns de
-- gamificação educacional: consistência (streak), maestria (nível),
-- registro pessoal (madrugador, volta por cima) e prêmio (pódio do
-- ranking). Ver [[despolarizamed-gamification-research]] na memória.
INSERT INTO achievements (code, title, description, icon) VALUES
  ('streak_3', 'Consistência', '3 dias seguidos respondendo o desafio diário', 'flame'),
  ('streak_7', 'Uma semana!', '7 dias seguidos respondendo o desafio diário', 'flame'),
  ('streak_30', 'Imparável', '30 dias seguidos respondendo o desafio diário', 'trophy'),
  ('streak_100', 'Centenário', '100 dias seguidos respondendo o desafio diário', 'trophy'),
  ('first_lesson', 'Primeiro passo', 'Assistiu à primeira aula', 'play-circle'),
  ('perfect_day', 'Gabarito', 'Acertou 100% do desafio diário', 'target'),
  ('perfect_week', 'Sabe tudo', 'Gabaritou o desafio diário 7 vezes', 'target'),
  ('level_max', 'Topo da cadeia', 'Chegou no nível máximo: Lenda do Vestibular', 'trophy'),
  ('top_3', 'Pódio', 'Chegou entre os 3 primeiros do ranking', 'trophy'),
  ('early_bird', 'Madrugador(a)', 'Respondeu o desafio diário antes das 8h', 'flame'),
  ('comeback', 'De volta ao jogo', 'Voltou a estudar depois de alguns dias parado', 'flame')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- XP + níveis + ranking — inspirado em Duolingo (XP/streak com
-- perda evitável) e Khan Academy (pontos por esforço, não só acerto).
-- Funções SECURITY DEFINER pra: (1) somar XP sem race condition e sem
-- dar UPDATE livre no cliente, (2) expor só as 4 colunas do ranking
-- pra todo mundo autenticado sem abrir profiles inteiro via RLS.
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_xp(amount INTEGER)
RETURNS INTEGER AS $$
  UPDATE public.profiles SET xp = COALESCE(xp, 0) + amount WHERE id = auth.uid()
  RETURNING xp;
$$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.increment_xp TO authenticated;

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(id UUID, name TEXT, avatar_url TEXT, xp INTEGER) AS $$
  SELECT id, name, avatar_url, COALESCE(xp, 0) FROM public.profiles ORDER BY xp DESC NULLS LAST LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
GRANT EXECUTE ON FUNCTION public.get_leaderboard TO authenticated;

-- ============================================================
-- Plantões — encontros semanais ao vivo (link do Meet definido
-- pelo admin depois; pode ter dia fixo da semana ou uma data avulsa).
-- ============================================================
CREATE TABLE IF NOT EXISTS office_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  weekday INTEGER CHECK (weekday BETWEEN 0 AND 6),
  time TIME,
  specific_date DATE,
  meet_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE office_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Office hours are viewable by authenticated users" ON office_hours FOR SELECT USING (auth.role() = 'authenticated' AND active = true);
CREATE POLICY "Admins manage office hours" ON office_hours FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Streak freeze (Duolingo) — perdoa 1 dia perdido sem quebrar a
-- sequência. streak_freeze_uses registra QUAL dia foi coberto, pra
-- currentStreak() no client saber contar aquele dia mesmo sem log de
-- desafio, e pra nunca consumir duas vezes o mesmo dia.
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS streak_freeze_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, used_date)
);
ALTER TABLE streak_freeze_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own streak freeze uses" ON streak_freeze_uses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Matérias iniciais — Biologia já tem as 35 aulas gravadas (ver
-- MÓDULOS/bio despolariza no Desktop do Paulo); as outras entram como
-- rascunho (published=false) até terem conteúdo real, o admin publica
-- quando estiver pronto.
-- ============================================================
INSERT INTO courses (slug, title, subject, description, published, sort_order) VALUES
  ('biologia', 'Biologia para Vestibular', 'Biologia', 'Da bioquímica à genética — trilha completa em videoaulas.', true, 0),
  ('matematica', 'Matemática para Vestibular', 'Matemática', 'Em produção.', false, 1),
  ('fisica', 'Física para Vestibular', 'Física', 'Em produção.', false, 2),
  ('quimica', 'Química para Vestibular', 'Química', 'Em produção.', false, 3),
  ('geografia', 'Geografia para Vestibular', 'Geografia', 'Em produção.', false, 4),
  ('historia', 'História para Vestibular', 'História', 'Em produção.', false, 5),
  ('redacao', 'Redação para Vestibular', 'Redação', 'Em produção.', false, 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Plantões fixos que Paulo pediu pra já deixar configurados (mesma
-- sala do Meet pras três sessões semanais).
-- ============================================================
INSERT INTO office_hours (title, weekday, time, meet_url, active) VALUES
  ('Plantão de dúvidas', 1, '17:00', 'https://meet.google.com/rwe-jydk-ocs', true),
  ('Planejamento de estudos', 2, '14:00', 'https://meet.google.com/rwe-jydk-ocs', true),
  ('Tutoria com o mentor', 5, '14:00', 'https://meet.google.com/rwe-jydk-ocs', true);

-- ============================================================
-- Perfil: curso desejado e faculdades-alvo (Configurações → Perfil)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS desired_course TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_universities TEXT[] DEFAULT '{}';

-- ============================================================
-- Glossário — primeiras 20 entradas de Biologia (as próximas matérias
-- entram nas próximas passadas: Química, Física, Matemática, História,
-- Geografia, Inglês). Imagens de Mendel, Darwin, mitocôndria e célula
-- animal vêm do Wikimedia Commons (domínio público / CC0).
-- ============================================================
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Célula', 'Biologia', 'visual',
   'Unidade estrutural e funcional básica de todos os seres vivos, delimitada por uma membrana plasmática que controla a entrada e saída de substâncias. Pode ser procariótica (sem núcleo individualizado, como as bactérias) ou eucariótica (com núcleo delimitado por carioteca, como nas células animais e vegetais).',
   'Hemácias, neurônios e células musculares são exemplos de células eucarióticas animais altamente especializadas.',
   'https://upload.wikimedia.org/wikipedia/commons/4/48/Animal_cell_structure_en.svg',
   'Entender a estrutura celular é a base pra estudar genética, fisiologia e a maioria dos processos metabólicos cobrados no vestibular.'),

  ('Mitocôndria', 'Biologia', 'visual',
   'Organela citoplasmática responsável pela respiração celular aeróbica, processo que converte a energia dos nutrientes em ATP. Possui dupla membrana — a interna forma dobras chamadas cristas mitocondriais, que aumentam a superfície de produção de energia — e DNA próprio.',
   'Células com alta demanda energética, como as musculares e os neurônios, têm grande quantidade de mitocôndrias.',
   'https://upload.wikimedia.org/wikipedia/commons/b/b5/Mitochondrion_mini.svg',
   'É na mitocôndria que a maior parte do ATP do corpo é gerada — ligue esse conceito direto com a aula de respiração celular.'),

  ('Mitose', 'Biologia', 'definicao',
   'Divisão celular que origina duas células-filhas geneticamente idênticas à célula-mãe, cada uma com o mesmo número de cromossomos (2n). Ocorre em quatro fases — prófase, metáfase, anáfase e telófase — e é responsável pelo crescimento e pela reposição de células do corpo.',
   'A cicatrização de um corte na pele depende de sucessivas mitoses das células epiteliais.', NULL, NULL),

  ('Meiose', 'Biologia', 'definicao',
   'Divisão celular que reduz o número de cromossomos à metade (de 2n para n), originando quatro células geneticamente diferentes entre si. Ocorre na formação dos gametas e é a base da variabilidade genética, por causa do crossing-over e da segregação independente dos cromossomos.',
   'A produção de espermatozoides e óvulos (gametogênese) depende da meiose.', NULL, NULL),

  ('Fotossíntese', 'Biologia', 'definicao',
   'Processo pelo qual organismos clorofilados (plantas, algas e algumas bactérias) convertem energia luminosa em energia química, produzindo glicose e oxigênio a partir de gás carbônico e água. Ocorre nos cloroplastos, em duas etapas: fase clara (fotoquímica) e fase escura (ciclo de Calvin).',
   'Equação geral: 6CO2 + 6H2O + luz → C6H12O6 + 6O2.', NULL, NULL),

  ('Respiração celular', 'Biologia', 'definicao',
   'Processo pelo qual as células quebram moléculas orgânicas (principalmente glicose) na presença de oxigênio para liberar energia na forma de ATP. Ocorre em três etapas principais: glicólise (no citoplasma), ciclo de Krebs e cadeia respiratória (ambas na mitocôndria).',
   'Ao contrário da fermentação, a respiração celular aeróbica libera muito mais energia por molécula de glicose.', NULL, NULL),

  ('DNA (Ácido desoxirribonucleico)', 'Biologia', 'definicao',
   'Molécula que armazena a informação genética dos seres vivos, formada por duas fitas antiparalelas enroladas em dupla-hélice, unidas por bases nitrogenadas complementares (adenina-timina e citosina-guanina). Está localizado no núcleo das células eucarióticas.',
   'A sequência de bases do DNA determina, por meio da síntese proteica, quais proteínas cada célula vai produzir.', NULL, NULL),

  ('RNA (Ácido ribonucleico)', 'Biologia', 'definicao',
   'Molécula derivada do DNA, geralmente em fita simples, que participa da síntese proteica. Os três principais tipos são RNA mensageiro (RNAm, carrega a informação do DNA até o ribossomo), RNA transportador (RNAt, transporta aminoácidos) e RNA ribossômico (RNAr, compõe o ribossomo).',
   'Diferente do DNA, o RNA usa uracila no lugar de timina.', NULL, NULL),

  ('Osmose', 'Biologia', 'definicao',
   'Movimento passivo de água através de uma membrana semipermeável, de um meio menos concentrado (hipotônico) para um mais concentrado (hipertônico), até o equilíbrio das concentrações. Não gasta energia da célula (transporte passivo).',
   'Uma célula vegetal em água pura incha por osmose; hemácias em soro muito concentrado murcham pelo mesmo processo.', NULL, NULL),

  ('Difusão facilitada', 'Biologia', 'definicao',
   'Transporte passivo de substâncias através da membrana plasmática com o auxílio de proteínas carreadoras ou canais proteicos, a favor do gradiente de concentração e sem gasto de energia.',
   'A entrada de glicose em muitas células depende de proteínas transportadoras específicas (GLUT), caracterizando difusão facilitada.', NULL, NULL),

  ('Ribossomo', 'Biologia', 'definicao',
   'Organela não membranosa formada por RNA ribossômico e proteínas, responsável pela síntese de proteínas (tradução). Pode estar livre no citoplasma ou aderido ao retículo endoplasmático rugoso.',
   'Células com alta produção de proteínas, como as do pâncreas, têm grande quantidade de ribossomos.', NULL, NULL),

  ('Hemácia (Eritrócito)', 'Biologia', 'definicao',
   'Célula sanguínea anucleada (nos mamíferos) responsável pelo transporte de oxigênio dos pulmões aos tecidos, graças à hemoglobina presente em seu citoplasma. É produzida na medula óssea vermelha.',
   'A anemia é caracterizada pela redução do número de hemácias ou da quantidade de hemoglobina no sangue.', NULL, NULL),

  ('Leucócito', 'Biologia', 'definicao',
   'Célula sanguínea (glóbulo branco) responsável pela defesa do organismo contra agentes infecciosos e substâncias estranhas. Inclui tipos como linfócitos, neutrófilos e macrófagos, cada um com uma função específica na resposta imune.',
   'Um exame de sangue com leucócitos elevados costuma indicar uma infecção em curso.', NULL, NULL),

  ('Sistema ABO', 'Biologia', 'definicao',
   'Sistema de tipagem sanguínea determinado pela presença ou ausência dos antígenos A e B na membrana das hemácias, controlado por três alelos (IA, IB e i). Define os tipos A, B, AB e O, relevantes em transfusões por causa dos anticorpos anti-A e/ou anti-B no plasma.',
   'O tipo O é considerado "doador universal" porque suas hemácias não têm antígenos A nem B.', NULL, NULL),

  ('Gregor Mendel', 'Biologia', 'pessoa',
   'Monge agostiniano e naturalista austríaco considerado o "pai da Genética". Entre 1856 e 1863, realizou experimentos de cruzamento com ervilhas (Pisum sativum) no mosteiro onde vivia, observando como características como cor e textura da semente eram transmitidas entre gerações. A partir desses experimentos, formulou as duas Leis de Mendel — da segregação dos fatores e da segregação independente — que se tornaram a base da genética clássica. Seu trabalho só foi reconhecido cientificamente décadas depois de sua morte.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Gregor_Mendel_2.jpg/250px-Gregor_Mendel_2.jpg', '1822 – 1884'),

  ('Charles Darwin', 'Biologia', 'pessoa',
   'Naturalista britânico que, após uma viagem de cinco anos a bordo do navio HMS Beagle observando a diversidade de espécies (com destaque para as ilhas Galápagos), desenvolveu a teoria da evolução pela seleção natural. Publicou suas ideias em 1859 no livro "A Origem das Espécies", propondo que os seres vivos mudam ao longo de gerações porque indivíduos com características mais vantajosas para o ambiente sobrevivem e se reproduzem mais — a base da biologia evolutiva moderna.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Charles_Darwin_seated_crop.jpg', '1809 – 1882'),

  ('Homeostase', 'Biologia', 'definicao',
   'Capacidade dos organismos de manter o equilíbrio do seu meio interno (temperatura, pH, concentração de substâncias etc.) relativamente constante, mesmo diante de variações do ambiente externo. Envolve mecanismos de retroalimentação (feedback), regulados principalmente pelos sistemas nervoso e endócrino.',
   'A regulação da temperatura corporal humana em torno de 36,5°C, mesmo em dias muito quentes ou frios, é um exemplo clássico de homeostase.', NULL, NULL),

  ('Cariótipo', 'Biologia', 'definicao',
   'Conjunto de cromossomos de uma célula, organizado e fotografado durante a metáfase da divisão celular, ordenado por tamanho e forma. É usado para identificar alterações no número ou na estrutura dos cromossomos.',
   'O cariótipo de uma pessoa com síndrome de Down mostra 47 cromossomos, com três cópias do cromossomo 21 (trissomia do 21).', NULL, NULL),

  ('Gameta', 'Biologia', 'definicao',
   'Célula reprodutiva haploide (n), ou seja, com metade do número de cromossomos da espécie, produzida por meiose. Nos animais, os gametas masculino e feminino são o espermatozoide e o óvulo; sua união (fecundação) restaura o número diploide (2n).',
   'Um ser humano tem 46 cromossomos (2n), mas seus gametas têm apenas 23 (n).', NULL, NULL),

  ('Zigoto', 'Biologia', 'definicao',
   'Célula diploide (2n) resultante da fecundação, formada pela união do gameta masculino com o gameta feminino. É a primeira célula de um novo indivíduo e passa por sucessivas divisões mitóticas (clivagem) para formar o embrião.',
   'Em humanos, o zigoto se forma na trompa uterina e leva cerca de 5 a 7 dias para se implantar no útero.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Flashcards — revisão rápida (frente/verso, autoavaliação "lembrei/não
-- lembrei"), diferente do quiz: não é certo/errado, é repetição
-- espaçada. Entra no desafio diário junto com o quiz por matéria.
-- ============================================================
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_flashcards_subject ON flashcards(subject);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flashcards viewable by authenticated users" ON flashcards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage flashcards" ON flashcards FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Flashcards criados pelo próprio aluno (tela /flashcards, aba "Meus
-- Flashcards") — cada aluno só enxerga e mexe nos seus próprios, via RLS.
CREATE TABLE IF NOT EXISTS user_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_user_flashcards_user ON user_flashcards(user_id);
CREATE INDEX idx_user_flashcards_subject ON user_flashcards(subject);
ALTER TABLE user_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own flashcards" ON user_flashcards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Progresso de repetição espaçada por aluno+flashcard. flashcard_id é TEXT
-- (sem FK) porque referencia tanto o banco global (flashcards) quanto os
-- criados pelo aluno (user_flashcards) e o fallback local (ids tipo 'fb-...').
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id TEXT NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_difficulty TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);
CREATE INDEX idx_flashcard_reviews_user ON flashcard_reviews(user_id);
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own flashcard reviews" ON flashcard_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Conquista nova do desafio multi-matéria
INSERT INTO achievements (code, title, description, icon) VALUES
  ('multidisciplinar', 'Multidisciplinar', 'Completou o desafio diário de todas as matérias disponíveis no mesmo dia', 'trophy')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Questões rápidas (quiz) — 5 por matéria, simples e diretas, pra
-- alimentar "1 questão por matéria" no desafio diário.
-- ============================================================
INSERT INTO quick_questions (subject, question, options, correct_option) VALUES
  ('Biologia', 'Qual organela é responsável pela respiração celular?',
   '[{"letra":"A","texto":"Ribossomo"},{"letra":"B","texto":"Mitocôndria"},{"letra":"C","texto":"Complexo de Golgi"},{"letra":"D","texto":"Vacúolo"}]', 'B'),
  ('Biologia', 'O processo de divisão celular que forma os gametas é chamado de:',
   '[{"letra":"A","texto":"Mitose"},{"letra":"B","texto":"Meiose"},{"letra":"C","texto":"Fecundação"},{"letra":"D","texto":"Mutação"}]', 'B'),
  ('Biologia', 'Qual molécula carrega a informação genética das células?',
   '[{"letra":"A","texto":"RNA"},{"letra":"B","texto":"ATP"},{"letra":"C","texto":"DNA"},{"letra":"D","texto":"Glicose"}]', 'C'),
  ('Biologia', 'As hemácias são responsáveis principalmente por transportar:',
   '[{"letra":"A","texto":"Nutrientes"},{"letra":"B","texto":"Oxigênio"},{"letra":"C","texto":"Hormônios"},{"letra":"D","texto":"Anticorpos"}]', 'B'),
  ('Biologia', 'O processo pelo qual as plantas produzem seu próprio alimento é a:',
   '[{"letra":"A","texto":"Respiração"},{"letra":"B","texto":"Fotossíntese"},{"letra":"C","texto":"Digestão"},{"letra":"D","texto":"Excreção"}]', 'B'),

  ('Matemática', 'Quanto é 7 ao quadrado (7²)?',
   '[{"letra":"A","texto":"14"},{"letra":"B","texto":"49"},{"letra":"C","texto":"21"},{"letra":"D","texto":"77"}]', 'B'),
  ('Matemática', 'Qual é o valor aproximado de π (pi)?',
   '[{"letra":"A","texto":"3,14"},{"letra":"B","texto":"2,71"},{"letra":"C","texto":"1,61"},{"letra":"D","texto":"4,20"}]', 'A'),
  ('Matemática', 'Numa PA de razão 3 começando em 2 (2, 5, 8...), qual é o 4º termo?',
   '[{"letra":"A","texto":"8"},{"letra":"B","texto":"11"},{"letra":"C","texto":"9"},{"letra":"D","texto":"14"}]', 'B'),
  ('Matemática', 'Qual é a raiz quadrada de 144?',
   '[{"letra":"A","texto":"11"},{"letra":"B","texto":"13"},{"letra":"C","texto":"12"},{"letra":"D","texto":"14"}]', 'C'),
  ('Matemática', 'Se x + 5 = 12, quanto vale x?',
   '[{"letra":"A","texto":"5"},{"letra":"B","texto":"6"},{"letra":"C","texto":"7"},{"letra":"D","texto":"17"}]', 'C'),

  ('Física', 'Qual é a unidade de medida de força no Sistema Internacional?',
   '[{"letra":"A","texto":"Joule"},{"letra":"B","texto":"Newton"},{"letra":"C","texto":"Watt"},{"letra":"D","texto":"Pascal"}]', 'B'),
  ('Física', 'A velocidade da luz no vácuo é aproximadamente:',
   '[{"letra":"A","texto":"300 mil km/s"},{"letra":"B","texto":"30 mil km/s"},{"letra":"C","texto":"3 mil km/s"},{"letra":"D","texto":"3 milhões km/s"}]', 'A'),
  ('Física', 'Qual lei de Newton diz que "para toda ação existe uma reação"?',
   '[{"letra":"A","texto":"1ª lei"},{"letra":"B","texto":"2ª lei"},{"letra":"C","texto":"3ª lei"},{"letra":"D","texto":"Lei da gravitação"}]', 'C'),
  ('Física', 'A energia cinética de um corpo depende de:',
   '[{"letra":"A","texto":"Massa e velocidade"},{"letra":"B","texto":"Só da massa"},{"letra":"C","texto":"Só da altura"},{"letra":"D","texto":"Temperatura"}]', 'A'),
  ('Física', 'O que um termômetro mede?',
   '[{"letra":"A","texto":"Pressão"},{"letra":"B","texto":"Temperatura"},{"letra":"C","texto":"Volume"},{"letra":"D","texto":"Densidade"}]', 'B'),

  ('Química', 'Qual é o símbolo químico do sódio?',
   '[{"letra":"A","texto":"So"},{"letra":"B","texto":"Sd"},{"letra":"C","texto":"Na"},{"letra":"D","texto":"S"}]', 'C'),
  ('Química', 'A água é formada por quais elementos?',
   '[{"letra":"A","texto":"Hidrogênio e Oxigênio"},{"letra":"B","texto":"Carbono e Oxigênio"},{"letra":"C","texto":"Hidrogênio e Nitrogênio"},{"letra":"D","texto":"Oxigênio e Nitrogênio"}]', 'A'),
  ('Química', 'O pH considerado neutro é igual a:',
   '[{"letra":"A","texto":"0"},{"letra":"B","texto":"14"},{"letra":"C","texto":"7"},{"letra":"D","texto":"1"}]', 'C'),
  ('Química', 'Qual é a menor partícula que mantém as propriedades químicas de um elemento?',
   '[{"letra":"A","texto":"Molécula"},{"letra":"B","texto":"Átomo"},{"letra":"C","texto":"Elétron"},{"letra":"D","texto":"Íon"}]', 'B'),
  ('Química', 'Uma reação exotérmica é aquela que:',
   '[{"letra":"A","texto":"Absorve calor"},{"letra":"B","texto":"Libera calor"},{"letra":"C","texto":"Não envolve calor"},{"letra":"D","texto":"Só ocorre em gases"}]', 'B'),

  ('Geografia', 'Qual é o maior bioma brasileiro em extensão?',
   '[{"letra":"A","texto":"Cerrado"},{"letra":"B","texto":"Mata Atlântica"},{"letra":"C","texto":"Amazônia"},{"letra":"D","texto":"Caatinga"}]', 'C'),
  ('Geografia', 'O Brasil é dividido em quantas regiões oficiais?',
   '[{"letra":"A","texto":"4"},{"letra":"B","texto":"5"},{"letra":"C","texto":"6"},{"letra":"D","texto":"7"}]', 'B'),
  ('Geografia', 'Qual é a capital do Brasil?',
   '[{"letra":"A","texto":"Rio de Janeiro"},{"letra":"B","texto":"São Paulo"},{"letra":"C","texto":"Brasília"},{"letra":"D","texto":"Salvador"}]', 'C'),
  ('Geografia', 'O que é o Efeito Estufa?',
   '[{"letra":"A","texto":"Resfriamento da Terra"},{"letra":"B","texto":"Retenção de calor na atmosfera"},{"letra":"C","texto":"Formação de furacões"},{"letra":"D","texto":"Derretimento de rochas"}]', 'B'),
  ('Geografia', 'Qual oceano banha o litoral leste do Brasil?',
   '[{"letra":"A","texto":"Pacífico"},{"letra":"B","texto":"Índico"},{"letra":"C","texto":"Atlântico"},{"letra":"D","texto":"Ártico"}]', 'C'),

  ('História', 'Em que ano o Brasil se tornou independente?',
   '[{"letra":"A","texto":"1822"},{"letra":"B","texto":"1889"},{"letra":"C","texto":"1500"},{"letra":"D","texto":"1888"}]', 'A'),
  ('História', 'Quem proclamou a independência do Brasil?',
   '[{"letra":"A","texto":"Dom Pedro I"},{"letra":"B","texto":"Dom Pedro II"},{"letra":"C","texto":"Tiradentes"},{"letra":"D","texto":"Getúlio Vargas"}]', 'A'),
  ('História', 'Em que ano foi abolida a escravidão no Brasil?',
   '[{"letra":"A","texto":"1822"},{"letra":"B","texto":"1889"},{"letra":"C","texto":"1888"},{"letra":"D","texto":"1500"}]', 'C'),
  ('História', 'A Proclamação da República no Brasil ocorreu em:',
   '[{"letra":"A","texto":"1822"},{"letra":"B","texto":"1889"},{"letra":"C","texto":"1888"},{"letra":"D","texto":"1930"}]', 'B'),
  ('História', 'Qual evento marcou o fim da Segunda Guerra Mundial no Japão?',
   '[{"letra":"A","texto":"Revolução Francesa"},{"letra":"B","texto":"Queda do Muro de Berlim"},{"letra":"C","texto":"Rendição do Japão"},{"letra":"D","texto":"Guerra Fria"}]', 'C'),

  ('Redação', 'Uma redação dissertativo-argumentativa (padrão ENEM) deve ter no mínimo quantos parágrafos?',
   '[{"letra":"A","texto":"2"},{"letra":"B","texto":"3"},{"letra":"C","texto":"4"},{"letra":"D","texto":"5"}]', 'C'),
  ('Redação', 'O que é uma tese, no contexto da redação dissertativa?',
   '[{"letra":"A","texto":"Um exemplo"},{"letra":"B","texto":"O ponto de vista defendido pelo autor"},{"letra":"C","texto":"A conclusão do texto"},{"letra":"D","texto":"Uma citação"}]', 'B'),
  ('Redação', 'A proposta de intervenção deve aparecer em qual parte do texto?',
   '[{"letra":"A","texto":"Introdução"},{"letra":"B","texto":"Primeiro parágrafo de desenvolvimento"},{"letra":"C","texto":"Conclusão"},{"letra":"D","texto":"Não é obrigatória"}]', 'C'),
  ('Redação', 'Repetir a mesma palavra várias vezes seguidas prejudica principalmente qual competência do ENEM?',
   '[{"letra":"A","texto":"Domínio da norma culta"},{"letra":"B","texto":"Coesão textual"},{"letra":"C","texto":"Conhecimento de mundo"},{"letra":"D","texto":"Proposta de intervenção"}]', 'B'),
  ('Redação', 'O que caracteriza um argumento de autoridade?',
   '[{"letra":"A","texto":"Uma opinião pessoal"},{"letra":"B","texto":"Uma citação de especialista ou dado oficial"},{"letra":"C","texto":"Um exemplo do cotidiano"},{"letra":"D","texto":"Uma pergunta retórica"}]', 'B');

-- ============================================================
-- Flashcards — 5 por matéria, revisão rápida (frente/verso).
-- ============================================================
INSERT INTO flashcards (subject, front, back) VALUES
  ('Biologia', 'Mitocôndria', 'Organela responsável pela respiração celular — produz a maior parte do ATP (energia) da célula.'),
  ('Biologia', 'O que é osmose?', 'Passagem de água através de uma membrana semipermeável, do meio menos concentrado para o mais concentrado.'),
  ('Biologia', 'Diferença entre mitose e meiose', 'Mitose gera 2 células idênticas (2n); meiose gera 4 células diferentes com metade dos cromossomos (n), usada na formação de gametas.'),
  ('Biologia', 'Sistema ABO', 'Sistema de tipagem sanguínea (A, B, AB, O) definido pelos antígenos presentes nas hemácias.'),
  ('Biologia', 'Gregor Mendel', 'Considerado o pai da Genética — formulou as Leis de Mendel estudando cruzamentos de ervilhas.'),

  ('Matemática', 'Fórmula de Bhaskara', 'x = (-b ± √(b²-4ac)) / 2a — usada para resolver equações do 2º grau.'),
  ('Matemática', 'Teorema de Pitágoras', 'Em um triângulo retângulo: a² = b² + c² (hipotenusa² = soma dos catetos ao quadrado).'),
  ('Matemática', 'O que é uma função do 1º grau?', 'Função no formato f(x) = ax + b, cujo gráfico é sempre uma reta.'),
  ('Matemática', 'Área do círculo', 'A = π × r² (pi vezes o raio ao quadrado).'),
  ('Matemática', 'O que é uma progressão geométrica (PG)?', 'Sequência em que cada termo é obtido multiplicando o anterior por uma razão constante.'),

  ('Física', '1ª Lei de Newton', 'Lei da Inércia: um corpo em repouso ou em movimento tende a continuar assim, a menos que uma força atue sobre ele.'),
  ('Física', 'Fórmula da velocidade média', 'Vm = Δs / Δt (variação do espaço dividida pela variação do tempo).'),
  ('Física', 'O que é energia potencial gravitacional?', 'Energia armazenada por um objeto devido à sua altura em relação ao solo: Ep = m × g × h.'),
  ('Física', 'Diferença entre calor e temperatura', 'Temperatura mede o grau de agitação das partículas; calor é a energia térmica transferida entre corpos de temperaturas diferentes.'),
  ('Física', 'O que é uma onda eletromagnética?', 'Onda que se propaga mesmo no vácuo, sem precisar de meio material (ex: luz, ondas de rádio).'),

  ('Química', 'O que é um átomo?', 'Menor partícula que mantém as propriedades químicas de um elemento, formada por prótons, nêutrons e elétrons.'),
  ('Química', 'Escala de pH', 'Vai de 0 a 14: menor que 7 é ácido, igual a 7 é neutro, maior que 7 é básico (alcalino).'),
  ('Química', 'O que são isótopos?', 'Átomos do mesmo elemento (mesmo número de prótons) mas com números de nêutrons diferentes.'),
  ('Química', 'Reação exotérmica x endotérmica', 'Exotérmica libera calor; endotérmica absorve calor do ambiente.'),
  ('Química', 'O que é uma ligação covalente?', 'Ligação química em que dois átomos compartilham elétrons entre si.'),

  ('Geografia', 'O que é o Efeito Estufa?', 'Fenômeno natural em que gases da atmosfera retêm calor — o aumento desses gases por ação humana intensifica o aquecimento global.'),
  ('Geografia', 'Biomas brasileiros', 'Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal.'),
  ('Geografia', 'O que é urbanização?', 'Crescimento das cidades em relação à população rural, comum em países em desenvolvimento ao longo do século XX.'),
  ('Geografia', 'O que são placas tectônicas?', 'Grandes blocos da crosta terrestre que se movimentam lentamente, causando terremotos e vulcões nas bordas.'),
  ('Geografia', 'O que é o Meridiano de Greenwich?', 'Linha imaginária que marca o ponto de referência 0° de longitude, usada para definir os fusos horários.'),

  ('História', 'Independência do Brasil', 'Proclamada por Dom Pedro I em 7 de setembro de 1822.'),
  ('História', 'O que foi a Era Vargas?', 'Período em que Getúlio Vargas governou o Brasil (1930-1945 e 1951-1954), marcado por mudanças trabalhistas e industrialização.'),
  ('História', 'O que foi a Revolução Industrial?', 'Processo de mecanização da produção iniciado na Inglaterra no século 18, que transformou a economia mundial.'),
  ('História', 'O que foi a Guerra Fria?', 'Disputa política e ideológica entre EUA (capitalismo) e URSS (socialismo) após a 2ª Guerra Mundial, sem confronto militar direto entre eles.'),
  ('História', 'Abolição da escravidão no Brasil', 'Assinada pela Lei Áurea em 13 de maio de 1888, pela Princesa Isabel.'),

  ('Redação', 'Estrutura dissertativo-argumentativa', 'Introdução (apresenta a tese) → Desenvolvimento (argumentos) → Conclusão (retoma a tese + proposta de intervenção).'),
  ('Redação', 'O que é coesão textual?', 'A conexão lógica entre frases e parágrafos, usando conectivos (portanto, além disso, entretanto etc.).'),
  ('Redação', 'Proposta de intervenção', 'Parte da conclusão que propõe uma solução para o problema discutido, indicando agente, ação, modo e efeito.'),
  ('Redação', 'O que é um argumento de autoridade?', 'Uso de uma citação, dado ou opinião de um especialista/fonte confiável para reforçar o argumento.'),
  ('Redação', 'Repertório sociocultural', 'Conhecimentos fora do senso comum (livros, filmes, dados, fatos históricos) usados para enriquecer a argumentação.');

-- ============================================================
-- Glossário — Química (20 verbetes, segundo bloco de matéria depois de
-- Biologia). Imagens de Lavoisier, Mendeleev, tabela periódica e modelo
-- de Bohr vêm do Wikimedia Commons (domínio público / CC0/CC-BY-SA).
-- ============================================================
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Átomo', 'Química', 'visual',
   'Menor unidade que constitui a matéria, mantendo as propriedades químicas de um elemento. É formado por um núcleo central (com prótons, de carga positiva, e nêutrons, sem carga) rodeado por elétrons (carga negativa) que giram em camadas ao redor do núcleo, segundo o modelo de Bohr.',
   'O átomo de hidrogênio tem 1 próton e 1 elétron; o de hélio tem 2 prótons, 2 nêutrons e 2 elétrons.',
   'https://upload.wikimedia.org/wikipedia/commons/7/76/Bohr_atom_model_%28mul%29.svg',
   'O modelo de Bohr, apesar de simplificado, ainda é o mais usado no Ensino Médio pra explicar como os elétrons se organizam e participam das ligações químicas.'),

  ('Tabela Periódica', 'Química', 'visual',
   'Organização de todos os elementos químicos conhecidos, ordenados por número atômico crescente e agrupados por propriedades semelhantes em linhas (períodos) e colunas (famílias/grupos).',
   'Os gases nobres (última coluna) são os elementos mais estáveis, com pouca tendência a formar ligações.',
   'https://upload.wikimedia.org/wikipedia/commons/d/d6/Periodic_table_simple_en.svg',
   'Elementos da mesma família (coluna) tendem a ter propriedades químicas parecidas — por isso os metais alcalinos (família 1A) reagem de forma semelhante entre si.'),

  ('Antoine Lavoisier', 'Química', 'pessoa',
   'Químico francês considerado o "pai da Química moderna". Formulou a Lei da Conservação das Massas ("na natureza, nada se cria, nada se perde, tudo se transforma") e ajudou a estabelecer o método científico experimental na química, encerrando a era da alquimia.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Antoine_Lavoisier_by_Jacques-Louis_David_%28cropped%29.jpg', '1743 – 1794'),

  ('Dmitri Mendeleev', 'Química', 'pessoa',
   'Químico russo que, em 1869, organizou os elementos químicos conhecidos até então em ordem crescente de massa atômica, criando a base da Tabela Periódica moderna. Sua organização foi tão precisa que ele conseguiu prever a existência e as propriedades de elementos ainda não descobertos.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/a/af/Dmitri_Mendeleev.jpg', '1834 – 1907'),

  ('Ligação iônica', 'Química', 'definicao',
   'Ligação química formada pela transferência definitiva de elétrons de um átomo (geralmente um metal) para outro (geralmente um ametal), gerando íons de cargas opostas que se atraem eletrostaticamente.',
   'O cloreto de sódio (NaCl, sal de cozinha) se forma quando o sódio doa um elétron para o cloro.', NULL, NULL),

  ('Ligação covalente', 'Química', 'definicao',
   'Ligação química em que dois átomos (geralmente ametais) compartilham um ou mais pares de elétrons, em vez de transferi-los completamente.',
   'A molécula de água (H2O) e o gás oxigênio (O2) são formados por ligações covalentes.', NULL, NULL),

  ('Ligação metálica', 'Química', 'definicao',
   'Ligação presente nos metais, em que os elétrons da última camada ficam livres para se mover entre os átomos, formando uma espécie de "mar de elétrons". Isso explica propriedades como condutividade elétrica e brilho dos metais.',
   'O cobre usado em fios elétricos conduz corrente graças à liberdade dos elétrons na ligação metálica.', NULL, NULL),

  ('pH', 'Química', 'definicao',
   'Escala que mede o grau de acidez ou basicidade de uma solução, variando de 0 a 14. Valores menores que 7 indicam solução ácida, igual a 7 indica neutra, e maiores que 7 indicam básica (alcalina).',
   'O suco de limão tem pH em torno de 2 (ácido); a água pura tem pH 7 (neutro); a soda cáustica tem pH próximo de 14 (muito básica).', NULL, NULL),

  ('Ácidos', 'Química', 'definicao',
   'Substâncias que, em solução aquosa, liberam íons H+ (cátion hidrogênio) como único tipo de cátion. Geralmente têm sabor azedo e conduzem eletricidade em solução.',
   'Ácido clorídrico (HCl), presente no suco gástrico do estômago, e o ácido acético (vinagre).', NULL, NULL),

  ('Bases (Hidróxidos)', 'Química', 'definicao',
   'Substâncias que, em solução aquosa, liberam íons OH- (hidroxila) como único tipo de ânion. Geralmente têm sabor amargo e sensação escorregadia ao toque.',
   'Hidróxido de sódio (soda cáustica) e hidróxido de magnésio (leite de magnésia).', NULL, NULL),

  ('Sais', 'Química', 'definicao',
   'Compostos formados pela reação entre um ácido e uma base (reação de neutralização), liberando também água. São formados por pelo menos um cátion diferente de H+ e um ânion diferente de OH-.',
   'O cloreto de sódio (NaCl) é o sal mais comum, usado no dia a dia como sal de cozinha.', NULL, NULL),

  ('Óxidos', 'Química', 'definicao',
   'Compostos binários (formados por 2 elementos) em que o oxigênio é o elemento mais eletronegativo, ligado a outro elemento.',
   'O gás carbônico (CO2) e a ferrugem (óxido de ferro) são exemplos de óxidos do cotidiano.', NULL, NULL),

  ('Mol', 'Química', 'definicao',
   'Unidade de medida usada na química para contar uma quantidade muito grande de partículas (átomos, moléculas, íons). Um mol equivale a 6,02 × 10²³ partículas — o Número de Avogadro.',
   'Um mol de átomos de carbono pesa exatamente 12 gramas (sua massa molar).', NULL, NULL),

  ('Número de Avogadro', 'Química', 'definicao',
   'Constante que representa a quantidade de partículas presentes em 1 mol de qualquer substância: 6,02 × 10²³. Batizada em homenagem ao cientista italiano Amedeo Avogadro.',
   'Usado para converter entre "quantidade de matéria" (mols) e "número de partículas" em cálculos estequiométricos.', NULL, NULL),

  ('Isótopos', 'Química', 'definicao',
   'Átomos de um mesmo elemento químico (mesmo número de prótons) que possuem números diferentes de nêutrons, e portanto massas atômicas diferentes.',
   'O carbono-12 e o carbono-14 são isótopos do carbono — o carbono-14 é usado para datação de fósseis.', NULL, NULL),

  ('Estequiometria', 'Química', 'definicao',
   'Parte da química que estuda as proporções (em massa, mol ou volume) entre reagentes e produtos numa reação química, permitindo calcular quanto de cada substância é consumido ou formado.',
   'Calcular quantos gramas de água são formados a partir de uma certa quantidade de hidrogênio e oxigênio é um problema de estequiometria.', NULL, NULL),

  ('Solução (Soluto e Solvente)', 'Química', 'definicao',
   'Mistura homogênea entre duas ou mais substâncias: o soluto (o que é dissolvido, geralmente em menor quantidade) e o solvente (o que dissolve, geralmente em maior quantidade).',
   'No soro fisiológico, o sal (soluto) está dissolvido em água (solvente).', NULL, NULL),

  ('Densidade', 'Química', 'definicao',
   'Grandeza física que relaciona a massa de uma substância com o volume que ela ocupa. Calculada pela fórmula d = m/V (densidade = massa dividida pelo volume).',
   'O óleo boia na água porque sua densidade é menor que a da água.', NULL, NULL),

  ('Entalpia (reação exo/endotérmica)', 'Química', 'definicao',
   'Entalpia é a energia associada a uma substância ou sistema. Numa reação exotérmica, a entalpia dos produtos é menor que a dos reagentes e há liberação de calor; numa endotérmica, ocorre o contrário — o sistema absorve calor do ambiente.',
   'A combustão (queima) é sempre uma reação exotérmica; o derretimento do gelo é um processo endotérmico.', NULL, NULL),

  ('Eletroquímica (Pilha)', 'Química', 'definicao',
   'Área da química que estuda a relação entre reações químicas e corrente elétrica. Uma pilha (célula galvânica) transforma energia de uma reação de oxirredução espontânea em energia elétrica.',
   'As pilhas e baterias que usamos no dia a dia (como as de um controle remoto) funcionam com base em princípios de eletroquímica.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Glossário — Física (20 verbetes, terceiro bloco). Imagens de Newton,
-- Einstein e um diagrama de circuito elétrico (Wikimedia Commons,
-- domínio público / CC-BY-SA).
-- ============================================================
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Isaac Newton', 'Física', 'pessoa',
   'Físico e matemático inglês considerado um dos maiores cientistas da história. Formulou as três leis do movimento e a Lei da Gravitação Universal, publicadas no livro "Principia Mathematica" (1687), que se tornaram a base da mecânica clássica.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Sir_Isaac_Newton_by_Sir_Godfrey_Kneller%2C_Bt_%28cropped%29.jpg', '1643 – 1727'),

  ('Albert Einstein', 'Física', 'pessoa',
   'Físico alemão que revolucionou a física no século 20 com a Teoria da Relatividade (restrita e geral), mudando a forma como entendemos espaço, tempo e gravidade. Recebeu o Prêmio Nobel de Física em 1921 pela explicação do efeito fotoelétrico.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg', '1879 – 1955'),

  ('Circuito elétrico', 'Física', 'visual',
   'Caminho fechado por onde a corrente elétrica circula, formado basicamente por uma fonte de energia (como uma pilha), condutores (fios) e um ou mais receptores (como uma lâmpada), podendo incluir um interruptor pra abrir/fechar o circuito.',
   'Uma lanterna simples é um circuito elétrico: pilha + fio + lâmpada + interruptor.',
   'https://upload.wikimedia.org/wikipedia/commons/b/b9/Simple-electric-circuit.svg',
   'Entender circuitos simples é a base pra estudar associação de resistores em série e em paralelo.'),

  ('Movimento Uniforme (MU)', 'Física', 'definicao',
   'Movimento em que a velocidade permanece constante ao longo do tempo (aceleração igual a zero). A posição varia de forma linear em relação ao tempo: S = S0 + v.t.',
   'Um carro andando a 80 km/h constantes numa estrada reta, sem acelerar nem frear.', NULL, NULL),

  ('Movimento Uniformemente Variado (MUV)', 'Física', 'definicao',
   'Movimento em que a velocidade varia de forma constante ao longo do tempo (aceleração constante e diferente de zero), descrito pela função horária S = S0 + v0.t + (a.t²)/2.',
   'Um objeto em queda livre próximo à superfície da Terra tem MUV, com aceleração igual à da gravidade (~10 m/s²).', NULL, NULL),

  ('1ª Lei de Newton (Inércia)', 'Física', 'definicao',
   'Todo corpo tende a permanecer em repouso ou em movimento retilíneo uniforme, a menos que uma força resultante externa atue sobre ele, alterando esse estado.',
   'Quando um carro freia bruscamente, os passageiros são jogados pra frente — o corpo deles "tende" a continuar em movimento.', NULL, NULL),

  ('2ª Lei de Newton', 'Física', 'definicao',
   'Relaciona força, massa e aceleração: a força resultante aplicada sobre um corpo é igual ao produto de sua massa pela aceleração adquirida (F = m . a).',
   'Quanto maior a massa de um objeto, maior a força necessária pra dar a ele a mesma aceleração.', NULL, NULL),

  ('3ª Lei de Newton (Ação e Reação)', 'Física', 'definicao',
   'Para toda força de ação aplicada por um corpo sobre outro, existe uma força de reação de mesma intensidade e direção, mas sentido oposto, aplicada pelo segundo corpo sobre o primeiro.',
   'Ao nadar, você empurra a água pra trás (ação) e a água te empurra pra frente (reação).', NULL, NULL),

  ('Energia cinética', 'Física', 'definicao',
   'Energia associada ao movimento de um corpo, calculada por Ec = (m . v²) / 2, onde m é a massa e v é a velocidade.',
   'Um carro em alta velocidade tem mais energia cinética do que o mesmo carro parado.', NULL, NULL),

  ('Energia potencial gravitacional', 'Física', 'definicao',
   'Energia armazenada por um corpo devido à sua posição (altura) em relação a um referencial, calculada por Ep = m . g . h.',
   'Uma pedra no topo de um penhasco tem energia potencial gravitacional, que se transforma em cinética ao cair.', NULL, NULL),

  ('Conservação da Energia Mecânica', 'Física', 'definicao',
   'Em um sistema sem forças dissipativas (como o atrito), a soma da energia cinética e potencial permanece constante ao longo do movimento — a energia se transforma, mas não se perde.',
   'Num pêndulo ideal (sem atrito), a energia se transforma entre cinética e potencial, mas a soma total não muda.', NULL, NULL),

  ('Trabalho (Física)', 'Física', 'definicao',
   'Grandeza física que mede a energia transferida por uma força quando ela desloca um corpo, calculada por W = F . d . cos(θ), onde θ é o ângulo entre a força e o deslocamento.',
   'Empurrar uma caixa e movê-la realiza trabalho; segurar a caixa parada no ar não realiza trabalho físico, mesmo cansando o braço.', NULL, NULL),

  ('Potência', 'Física', 'definicao',
   'Grandeza que mede a rapidez com que um trabalho é realizado ou energia é transferida, calculada por P = W / t. Medida em watts (W).',
   'Duas lâmpadas podem realizar o mesmo trabalho, mas a de maior potência faz isso mais rápido (ou consome mais energia por segundo).', NULL, NULL),

  ('Calor e Temperatura', 'Física', 'definicao',
   'Temperatura mede o grau de agitação das partículas de um corpo; calor é a energia térmica transferida entre dois corpos com temperaturas diferentes, sempre do mais quente para o mais frio.',
   'Uma xícara de café quente perde calor para o ambiente até atingir o equilíbrio térmico.', NULL, NULL),

  ('Dilatação térmica', 'Física', 'definicao',
   'Aumento nas dimensões (comprimento, área ou volume) de um material quando sua temperatura aumenta, devido à maior agitação das partículas.',
   'Trilhos de trem têm pequenos espaços entre os segmentos pra permitir a dilatação nos dias quentes, sem empenar.', NULL, NULL),

  ('Lei de Ohm', 'Física', 'definicao',
   'Relaciona tensão (U), corrente (i) e resistência elétrica (R) num condutor: U = R . i. Quanto maior a resistência, menor a corrente para uma mesma tensão.',
   'Um chuveiro elétrico no inverno (mais resistência) aquece mais a água, mas reduz a corrente comparado ao verão.', NULL, NULL),

  ('Ondas', 'Física', 'definicao',
   'Perturbações que se propagam transportando energia, sem transportar matéria. Podem ser mecânicas (precisam de um meio, como o som) ou eletromagnéticas (se propagam até no vácuo, como a luz).',
   'O som não se propaga no vácuo espacial porque é uma onda mecânica; a luz do Sol chega até nós porque é uma onda eletromagnética.', NULL, NULL),

  ('Efeito Doppler', 'Física', 'definicao',
   'Mudança aparente na frequência de uma onda percebida por um observador, causada pelo movimento relativo entre a fonte da onda e o observador.',
   'O som de uma ambulância parece mais agudo quando ela se aproxima e mais grave quando se afasta.', NULL, NULL),

  ('Reflexão e Refração da luz', 'Física', 'definicao',
   'Reflexão é o retorno da luz ao atingir uma superfície (como um espelho); refração é a mudança de direção da luz ao passar de um meio pra outro com densidades ópticas diferentes (como do ar pra água).',
   'Um lápis parece "quebrado" dentro de um copo de água por causa da refração da luz.', NULL, NULL),

  ('Empuxo (Princípio de Arquimedes)', 'Física', 'definicao',
   'Força vertical, de baixo para cima, exercida por um fluido (líquido ou gás) sobre um corpo nele imerso, igual ao peso do volume de fluido deslocado pelo corpo.',
   'Um navio de aço flutua porque o empuxo da água é igual ao seu peso — o formato do casco desloca um grande volume de água, mesmo o aço sendo mais denso que ela.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Glossário — Matemática (20 verbetes, quarto bloco). Imagens de
-- Pitágoras e do círculo trigonométrico (Wikimedia Commons, domínio
-- público / CC-BY-SA).
-- ============================================================
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Pitágoras', 'Matemática', 'pessoa',
   'Filósofo e matemático grego que viveu por volta do século 6 a.C., fundador de uma escola filosófica-matemática (os pitagóricos). É mais conhecido pelo Teorema de Pitágoras — embora a relação entre os lados de um triângulo retângulo já fosse conhecida por outras civilizações antes dele, sua escola foi quem formalizou e demonstrou essa relação matematicamente.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/f/f6/3_Pythagoras.jpg', 'Cerca de 570 a.C. – 495 a.C.'),

  ('Teorema de Pitágoras', 'Matemática', 'definicao',
   'Em todo triângulo retângulo, o quadrado da medida da hipotenusa é igual à soma dos quadrados das medidas dos catetos: a² = b² + c².',
   'Um triângulo com catetos 3 e 4 tem hipotenusa 5, pois 3² + 4² = 9 + 16 = 25 = 5².', NULL, NULL),

  ('Círculo Trigonométrico', 'Matemática', 'visual',
   'Circunferência de raio 1 centrada na origem de um plano cartesiano, usada para representar os valores de seno, cosseno e tangente de qualquer ângulo, de 0° a 360° (ou 0 a 2π radianos).',
   'No primeiro quadrante (0° a 90°), tanto o seno quanto o cosseno são positivos.',
   'https://upload.wikimedia.org/wikipedia/commons/7/71/C%C3%ADrculo_trigonom%C3%A9trico.svg',
   'É a ferramenta usada pra visualizar em qual quadrante um ângulo está e se o seno/cosseno dele é positivo ou negativo.'),

  ('Função do 1º grau', 'Matemática', 'definicao',
   'Função no formato f(x) = ax + b, com a≠0, cujo gráfico é sempre uma reta. O coeficiente "a" indica a inclinação da reta e "b" o ponto onde ela cruza o eixo y.',
   'f(x) = 2x + 3 é uma função do 1º grau; quando x=0, f(x)=3.', NULL, NULL),

  ('Função do 2º grau', 'Matemática', 'definicao',
   'Função no formato f(x) = ax² + bx + c, com a≠0, cujo gráfico é uma parábola. Se a>0, a concavidade é pra cima; se a<0, pra baixo.',
   'f(x) = x² - 4 tem raízes em x=2 e x=-2, onde a parábola cruza o eixo x.', NULL, NULL),

  ('Fórmula de Bhaskara', 'Matemática', 'definicao',
   'Fórmula usada pra encontrar as raízes de uma equação do 2º grau (ax²+bx+c=0): x = (-b ± √(b²-4ac)) / 2a. O termo dentro da raiz (b²-4ac) é chamado de discriminante (Δ).',
   'Se Δ > 0, a equação tem duas raízes reais diferentes; se Δ = 0, uma raiz dupla; se Δ < 0, não tem raízes reais.', NULL, NULL),

  ('Progressão Aritmética (PA)', 'Matemática', 'definicao',
   'Sequência numérica em que cada termo (a partir do segundo) é obtido somando um valor constante (razão) ao termo anterior.',
   'A sequência 2, 5, 8, 11... é uma PA de razão 3.', NULL, NULL),

  ('Progressão Geométrica (PG)', 'Matemática', 'definicao',
   'Sequência numérica em que cada termo (a partir do segundo) é obtido multiplicando o termo anterior por um valor constante (razão).',
   'A sequência 2, 6, 18, 54... é uma PG de razão 3.', NULL, NULL),

  ('Seno, Cosseno e Tangente', 'Matemática', 'definicao',
   'Razões trigonométricas de um ângulo num triângulo retângulo: seno = cateto oposto / hipotenusa; cosseno = cateto adjacente / hipotenusa; tangente = cateto oposto / cateto adjacente (ou seno/cosseno).',
   'Num ângulo de 30°, o seno vale 0,5.', NULL, NULL),

  ('Logaritmo', 'Matemática', 'definicao',
   'Operação inversa da potenciação: o logaritmo de um número b na base a (log_a b) é o expoente ao qual se deve elevar a para obter b.',
   'log₂ 8 = 3, porque 2³ = 8.', NULL, NULL),

  ('Porcentagem', 'Matemática', 'definicao',
   'Forma de expressar uma razão (fração) tendo 100 como denominador. O símbolo % representa "por cento", ou seja, "a cada cem".',
   '50% de 200 é o mesmo que 50/100 × 200 = 100.', NULL, NULL),

  ('Regra de três', 'Matemática', 'definicao',
   'Método usado pra resolver problemas envolvendo grandezas proporcionais (diretamente ou inversamente), relacionando duas razões numa proporção.',
   'Se 3 operários fazem um trabalho em 12 dias, quantos dias levam 6 operários? (regra de três inversa) — Resposta: 6 dias.', NULL, NULL),

  ('Juros simples', 'Matemática', 'definicao',
   'Tipo de juros calculado sempre sobre o capital inicial (não sobre juros acumulados), pela fórmula J = C . i . t (capital × taxa × tempo).',
   'R$1000 a 2% ao mês, juros simples, por 3 meses: J = 1000 × 0,02 × 3 = R$60.', NULL, NULL),

  ('Juros compostos', 'Matemática', 'definicao',
   'Tipo de juros calculado sobre o capital acumulado (capital inicial + juros já gerados), crescendo de forma exponencial ao longo do tempo: M = C . (1+i)^t.',
   'Investimentos, financiamentos e a maioria dos produtos bancários usam juros compostos, não simples.', NULL, NULL),

  ('Probabilidade', 'Matemática', 'definicao',
   'Medida numérica (entre 0 e 1, ou 0% e 100%) da chance de um evento ocorrer, calculada por P = (casos favoráveis) / (casos possíveis).',
   'A probabilidade de tirar um número par num dado de 6 faces é 3/6 = 0,5 = 50%.', NULL, NULL),

  ('Análise Combinatória (Fatorial)', 'Matemática', 'definicao',
   'Ramo da matemática que estuda formas de contar agrupamentos (arranjos, combinações, permutações) sem precisar listar todos os casos. O fatorial de n (n!) é o produto de todos os inteiros positivos até n.',
   '5! = 5×4×3×2×1 = 120. Usado pra calcular de quantas formas 5 pessoas podem se sentar em 5 cadeiras.', NULL, NULL),

  ('Matriz', 'Matemática', 'definicao',
   'Tabela retangular de números organizados em linhas e colunas, usada pra representar e resolver sistemas de equações, entre outras aplicações.',
   'Uma matriz 2x3 tem 2 linhas e 3 colunas, totalizando 6 elementos.', NULL, NULL),

  ('Determinante', 'Matemática', 'definicao',
   'Número associado a uma matriz quadrada, calculado a partir de seus elementos, usado pra saber se um sistema de equações tem solução única, entre outras aplicações.',
   'Se o determinante de uma matriz é zero, o sistema associado não tem solução única.', NULL, NULL),

  ('MDC e MMC', 'Matemática', 'definicao',
   'MDC (Máximo Divisor Comum) é o maior número que divide dois ou mais números ao mesmo tempo; MMC (Mínimo Múltiplo Comum) é o menor número que é múltiplo de dois ou mais números ao mesmo tempo.',
   'MDC entre 12 e 18 é 6; MMC entre 4 e 6 é 12.', NULL, NULL),

  ('Números primos', 'Matemática', 'definicao',
   'Números naturais maiores que 1 que têm exatamente dois divisores: 1 e ele mesmo. Não podem ser escritos como produto de dois números naturais menores que ele.',
   '2, 3, 5, 7, 11, 13 são números primos; o número 2 é o único primo par.', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Tiradentes', 'História', 'pessoa',
   'Joaquim José da Silva Xavier, alferes e dentista, principal líder da Inconfidência Mineira (1789), conspiração pela independência de Minas Gerais. Foi enforcado e esquartejado pela Coroa Portuguesa, tornando-se símbolo da luta pela independência do Brasil.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Pedro_Am%C3%A9rico_-_Tiradentes_Esquartejado.jpg', '1746 – 1792'),

  ('Dom Pedro I', 'História', 'pessoa',
   'Primeiro imperador do Brasil, proclamou a Independência em 7 de setembro de 1822 ("Grito do Ipiranga") e governou até 1831, quando abdicou em favor do filho, Dom Pedro II.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Manuel_de_Ara%C3%BAjo_Porto_Alegre_-_Retrato_de_D._Pedro_I.jpg', '1798 – 1834'),

  ('Getúlio Vargas', 'História', 'pessoa',
   'Político gaúcho que governou o Brasil por 18 anos em dois períodos (1930-1945 e 1951-1954), marcados pela Era Vargas, o Estado Novo (ditadura de 1937-1945) e a criação da CLT. Suicidou-se em 1954 em meio a uma crise política.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/5/51/Getulio_Vargas_%281930%29_%28cropped_2%29.jpg', '1882 – 1954'),

  ('Napoleão Bonaparte', 'História', 'pessoa',
   'General e imperador francês que dominou boa parte da Europa no início do século 19. Suas conquistas espalharam ideais da Revolução Francesa, mas também provocaram guerras que redesenharam o mapa europeu.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/7/76/Jacques-Louis_David_-_The_Coronation_of_Napoleon_%281805-1807%29_Cropped.jpg', '1769 – 1821'),

  ('Revolução Francesa', 'História', 'definicao',
   'Movimento revolucionário (1789-1799) que derrubou a monarquia absolutista na França, sob o lema "Liberdade, Igualdade, Fraternidade", influenciando ideais liberais e democráticos em todo o mundo.',
   'A queda da Bastilha, em 14 de julho de 1789, é considerada o marco inicial da revolução.', NULL, NULL),

  ('Independência do Brasil', 'História', 'definicao',
   'Processo político que rompeu os laços coloniais entre Brasil e Portugal, proclamado por Dom Pedro I em 7 de setembro de 1822, às margens do rio Ipiranga, em São Paulo.',
   NULL, NULL, NULL),

  ('Inconfidência Mineira', 'História', 'definicao',
   'Movimento separatista ocorrido em Minas Gerais em 1789, articulado por elites locais (incluindo Tiradentes) insatisfeitas com a cobrança de impostos pela Coroa Portuguesa, especialmente a "derrama".',
   'Inspirada pelos ideais iluministas e pela independência dos Estados Unidos.', NULL, NULL),

  ('Era Vargas', 'História', 'definicao',
   'Período de 1930 a 1945 em que Getúlio Vargas governou o Brasil, incluindo o Governo Provisório, o Governo Constitucional e o Estado Novo (ditadura), marcado por industrialização e leis trabalhistas.',
   NULL, NULL, NULL),

  ('Ditadura Militar Brasileira', 'História', 'definicao',
   'Regime autoritário que governou o Brasil de 1964 a 1985, instaurado por um golpe militar, marcado por censura, perseguição política, AI-5 e repressão a opositores.',
   'O AI-5 (1968) suspendeu diversas garantias constitucionais e ampliou a repressão.', NULL, NULL),

  ('Revolução Industrial', 'História', 'definicao',
   'Processo de transformação econômica iniciado na Inglaterra no século 18, que substituiu a produção manual por máquinas, dando origem à sociedade industrial e urbana moderna.',
   'A máquina a vapor de James Watt foi uma das tecnologias-chave desse processo.', NULL, NULL),

  ('Primeira Guerra Mundial', 'História', 'definicao',
   'Conflito global (1914-1918) entre as potências da Tríplice Aliança e da Tríplice Entente, desencadeado pelo assassinato do arquiduque Francisco Ferdinando, com milhões de mortos e mudanças profundas no mapa mundial.',
   NULL, NULL, NULL),

  ('Segunda Guerra Mundial', 'História', 'definicao',
   'Maior conflito armado da história (1939-1945), envolvendo os Aliados e o Eixo (Alemanha nazista, Itália fascista e Japão), marcado pelo Holocausto e pelo uso de bombas atômicas no Japão.',
   NULL, NULL, NULL),

  ('Guerra Fria', 'História', 'definicao',
   'Período de tensão política, ideológica e militar (1947-1991) entre Estados Unidos (capitalismo) e União Soviética (socialismo), sem confronto direto entre as duas potências, mas com diversos conflitos indiretos.',
   'A Guerra da Coreia e a Guerra do Vietnã foram conflitos indiretos da Guerra Fria.', NULL, NULL),

  ('Feudalismo', 'História', 'definicao',
   'Sistema socioeconômico predominante na Europa medieval, baseado em relações de servidão entre servos e senhores feudais, em troca de proteção e uso da terra.',
   NULL, NULL, NULL),

  ('Renascimento', 'História', 'definicao',
   'Movimento cultural e artístico que floresceu na Europa entre os séculos 14 e 16, retomando valores da Antiguidade Clássica e valorizando o humanismo, a razão e a ciência.',
   'Leonardo da Vinci e Michelangelo são dois dos maiores nomes do Renascimento italiano.', NULL, NULL),

  ('Escravidão no Brasil', 'História', 'definicao',
   'Sistema de trabalho forçado que explorou milhões de africanos escravizados no Brasil por mais de 300 anos, até a assinatura da Lei Áurea em 1888, deixando marcas profundas na estrutura social do país.',
   NULL, NULL, NULL),

  ('Lei Áurea', 'História', 'definicao',
   'Lei assinada pela Princesa Isabel em 13 de maio de 1888, que aboliu formalmente a escravidão no Brasil, o último país do continente americano a fazer isso.',
   NULL, NULL, NULL),

  ('Proclamação da República', 'História', 'definicao',
   'Evento de 15 de novembro de 1889, liderado pelo Marechal Deodoro da Fonseca, que pôs fim ao Império e instaurou a República no Brasil.',
   NULL, NULL, NULL),

  ('Colonização do Brasil', 'História', 'definicao',
   'Processo de ocupação e exploração do território brasileiro por Portugal a partir de 1500, baseado inicialmente na extração de pau-brasil e depois na economia açucareira e mineradora, sustentada pelo trabalho escravo.',
   NULL, NULL, NULL),

  ('Iluminismo', 'História', 'definicao',
   'Movimento filosófico do século 18 que defendia a razão, a ciência e os direitos individuais contra o absolutismo e o poder da Igreja, influenciando a Revolução Francesa e a Independência dos Estados Unidos.',
   'Voltaire, Rousseau e Montesquieu são alguns dos principais pensadores iluministas.', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Placas Tectônicas', 'Geografia', 'definicao',
   'Grandes blocos rígidos que formam a litosfera terrestre e se movem lentamente sobre o manto, causando terremotos, vulcões e a formação de cadeias montanhosas nas bordas onde colidem ou se afastam.',
   'O Círculo de Fogo do Pacífico concentra boa parte da atividade sísmica e vulcânica do planeta.', NULL, NULL),

  ('Relevo', 'Geografia', 'definicao',
   'Conjunto das formas da superfície terrestre (planícies, planaltos, montanhas, depressões), moldado por processos internos (tectônica, vulcanismo) e externos (erosão, intemperismo).',
   NULL, NULL, NULL),

  ('Clima', 'Geografia', 'definicao',
   'Conjunto de condições atmosféricas (temperatura, umidade, pressão, ventos) que se repetem numa região ao longo de um período longo, diferente do tempo (condição momentânea).',
   'O Brasil tem predomínio de clima tropical, mas também apresenta clima equatorial, semiárido e subtropical.', NULL, NULL),

  ('Bioma', 'Geografia', 'definicao',
   'Grande conjunto de ecossistemas com vegetação, fauna e clima característicos numa determinada região. O Brasil tem 6 biomas: Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal.',
   NULL, NULL, NULL),

  ('Amazônia', 'Geografia', 'definicao',
   'Maior floresta tropical do mundo, cobrindo parte de 9 países da América do Sul (60% em território brasileiro), com altíssima biodiversidade e papel fundamental no equilíbrio climático global.',
   NULL, NULL, NULL),

  ('Cerrado', 'Geografia', 'definicao',
   'Segundo maior bioma brasileiro, savana tropical com vegetação de árvores baixas e tortuosas, considerado o "berço das águas" do Brasil por abrigar nascentes de grandes bacias hidrográficas.',
   NULL, NULL, NULL),

  ('Mata Atlântica', 'Geografia', 'definicao',
   'Bioma que originalmente cobria boa parte do litoral brasileiro, hoje reduzido a menos de 15% de sua área original devido à urbanização e ao desmatamento histórico, sendo um dos mais ameaçados do país.',
   NULL, NULL, NULL),

  ('Efeito Estufa', 'Geografia', 'definicao',
   'Fenômeno natural em que gases da atmosfera (CO2, metano, vapor d''água) retêm parte do calor irradiado pela Terra, mantendo a temperatura do planeta habitável. O problema é sua intensificação pela ação humana.',
   'A queima de combustíveis fósseis aumenta a concentração de CO2, intensificando o efeito estufa.', NULL, NULL),

  ('Aquecimento Global', 'Geografia', 'definicao',
   'Aumento da temperatura média do planeta ao longo do tempo, associado à intensificação do efeito estufa por ação humana, causando degelo, elevação do nível do mar e eventos climáticos extremos.',
   NULL, NULL, NULL),

  ('Camadas da Atmosfera', 'Geografia', 'visual',
   'A atmosfera terrestre é dividida em camadas: troposfera (onde ocorrem os fenômenos climáticos), estratosfera (com a camada de ozônio), mesosfera, termosfera e exosfera, cada uma com características de temperatura e pressão distintas.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/9/90/Camadas_da_atmosfera.png',
   'A troposfera concentra quase todo o vapor d''água e é onde vivemos e onde se formam as nuvens.'),

  ('Ciclo da Água', 'Geografia', 'visual',
   'Circulação contínua da água entre a atmosfera, a superfície terrestre e os oceanos, através de evaporação, condensação, precipitação e infiltração.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Ciclo_da_%C3%A1gua.jpg',
   'Fundamental pra entender disponibilidade de água doce, chuvas e o próprio clima regional.'),

  ('Erosão', 'Geografia', 'definicao',
   'Processo de desgaste e transporte de rochas e solo pela ação da água, vento, gelo ou seres vivos, podendo ser intensificado por desmatamento e uso inadequado do solo.',
   NULL, NULL, NULL),

  ('Desertificação', 'Geografia', 'definicao',
   'Processo de degradação de terras em áreas secas, causado por fatores climáticos e por atividades humanas como desmatamento e uso excessivo do solo, resultando em perda de fertilidade e vegetação.',
   'No Brasil, parte do Nordeste semiárido está em processo de desertificação.', NULL, NULL),

  ('Fuso Horário', 'Geografia', 'definicao',
   'Cada uma das 24 faixas em que a Terra é dividida (a cada 15° de longitude), usadas pra padronizar a hora local em diferentes regiões do planeta.',
   'O Brasil chegou a ter 4 fusos horários; hoje usa oficialmente 3.', NULL, NULL),

  ('Coordenadas Geográficas', 'Geografia', 'definicao',
   'Sistema de latitude (distância angular ao norte ou sul da Linha do Equador) e longitude (distância angular a leste ou oeste do Meridiano de Greenwich) usado pra localizar qualquer ponto na superfície terrestre.',
   NULL, NULL, NULL),

  ('Escala Cartográfica', 'Geografia', 'definicao',
   'Relação matemática entre uma medida no mapa e a medida real correspondente no terreno, indicando o quanto a realidade foi reduzida na representação.',
   'Numa escala 1:100.000, 1 cm no mapa equivale a 100.000 cm (1 km) na realidade.', NULL, NULL),

  ('Urbanização', 'Geografia', 'definicao',
   'Processo de crescimento das cidades e da população urbana em relação à população rural, frequentemente acelerado e desigual nos países em desenvolvimento, gerando desafios como moradia e mobilidade.',
   NULL, NULL, NULL),

  ('Globalização', 'Geografia', 'definicao',
   'Processo de integração econômica, cultural e tecnológica entre países, intensificado a partir do final do século 20, que aumenta a interdependência entre nações mas também aprofunda desigualdades.',
   NULL, NULL, NULL),

  ('Milton Santos', 'Geografia', 'pessoa',
   'Geógrafo brasileiro, considerado um dos maiores pensadores da geografia mundial, conhecido por seus estudos sobre urbanização, globalização e o espaço geográfico nos países em desenvolvimento. Primeiro latino-americano a receber o Prêmio Vautrin Lud, o "Nobel da Geografia".',
   NULL, NULL, '1926 – 2001'),

  ('IDH (Índice de Desenvolvimento Humano)', 'Geografia', 'definicao',
   'Indicador que mede o desenvolvimento de um país combinando renda, educação e expectativa de vida, variando de 0 (menor desenvolvimento) a 1 (maior desenvolvimento).',
   'O Brasil tem IDH considerado alto, mas com grandes desigualdades regionais.', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('False Cognates (Falsos Cognatos)', 'Inglês', 'definicao',
   'Palavras em inglês parecidas com palavras em português, mas com significado diferente — um dos temas mais cobrados em provas de vestibular.',
   '"Pretend" não significa "pretender" e sim "fingir"; "actually" não significa "atualmente" e sim "na verdade".', NULL, NULL),

  ('Cognates (Cognatos)', 'Inglês', 'definicao',
   'Palavras em inglês parecidas com o português e que têm o mesmo significado, facilitando a compreensão de textos mesmo sem dominar o idioma.',
   '"Important" (importante), "hospital" (hospital), "information" (informação).', NULL, NULL),

  ('Simple Present', 'Inglês', 'definicao',
   'Tempo verbal usado pra hábitos, rotinas, fatos gerais e verdades permanentes.',
   '"She studies every day." (Ela estuda todos os dias.)', NULL, NULL),

  ('Present Continuous', 'Inglês', 'definicao',
   'Tempo verbal (to be + verbo com -ing) usado pra ações acontecendo no momento da fala ou planos futuros já combinados.',
   '"I am studying for the exam right now." (Estou estudando pra prova agora.)', NULL, NULL),

  ('Simple Past', 'Inglês', 'definicao',
   'Tempo verbal usado pra ações completamente terminadas no passado, geralmente com uma referência de tempo específica.',
   '"She studied English last year." (Ela estudou inglês no ano passado.)', NULL, NULL),

  ('Present Perfect', 'Inglês', 'definicao',
   'Tempo verbal (have/has + particípio) usado pra ações passadas que têm relação com o presente, sem tempo específico definido.',
   '"I have already read this book." (Eu já li esse livro.)', NULL, NULL),

  ('Modal Verbs', 'Inglês', 'definicao',
   'Verbos auxiliares (can, could, must, should, may, might, will, would) que expressam capacidade, possibilidade, permissão, obrigação ou conselho.',
   '"You should study more." (Você deveria estudar mais.)', NULL, NULL),

  ('Passive Voice (Voz Passiva)', 'Inglês', 'definicao',
   'Construção em que o sujeito da frase recebe a ação, em vez de praticá-la, formada com to be + particípio passado.',
   '"The book was written by a famous author." (O livro foi escrito por um autor famoso.)', NULL, NULL),

  ('Conditional Sentences (If Clauses)', 'Inglês', 'definicao',
   'Estruturas condicionais com "if", divididas em tipos: zero (fatos gerais), primeiro (futuro provável), segundo (hipotético presente) e terceiro (hipotético passado).',
   '"If I study hard, I will pass the exam." (Se eu estudar bastante, vou passar na prova.)', NULL, NULL),

  ('Phrasal Verbs', 'Inglês', 'definicao',
   'Combinação de verbo + partícula (preposição ou advérbio) que forma um significado geralmente diferente do verbo isolado.',
   '"Give up" (desistir), "look for" (procurar), "find out" (descobrir).', NULL, NULL),

  ('Reported Speech (Discurso Indireto)', 'Inglês', 'definicao',
   'Estrutura usada pra relatar o que alguém disse sem citar as palavras exatas, geralmente exigindo mudança de tempo verbal.',
   '"I am tired" → "She said she was tired." (Ela disse que estava cansada.)', NULL, NULL),

  ('Comparative and Superlative', 'Inglês', 'definicao',
   'Formas usadas pra comparar (comparativo) ou destacar o maior/menor grau (superlativo) entre elementos.',
   '"Bigger" (maior), "the biggest" (o maior); "more important", "the most important".', NULL, NULL),

  ('Gerund and Infinitive', 'Inglês', 'definicao',
   'Formas verbais usadas após certos verbos: gerúndio (verbo + -ing) ou infinitivo (to + verbo), cada uma seguindo verbos específicos.',
   '"I enjoy reading" (gerúndio) vs. "I want to read" (infinitivo).', NULL, NULL),

  ('Question Tags', 'Inglês', 'definicao',
   'Pequenas perguntas adicionadas ao final de uma afirmação pra confirmar informação, formadas com o auxiliar oposto ao da frase principal.',
   '"You like English, don''t you?" (Você gosta de inglês, não gosta?)', NULL, NULL),

  ('Prefixes and Suffixes', 'Inglês', 'definicao',
   'Afixos adicionados antes (prefixo) ou depois (sufixo) de uma palavra pra formar novas palavras ou mudar seu sentido/classe gramatical.',
   '"Un-" + "happy" = "unhappy"; "teach" + "-er" = "teacher".', NULL, NULL),

  ('Skimming and Scanning', 'Inglês', 'definicao',
   'Técnicas de leitura: skimming é ler rapidamente pra captar a ideia geral do texto; scanning é procurar uma informação específica sem ler tudo.',
   'Muito úteis pra economizar tempo em provas de compreensão de texto, como no Enem.', NULL, NULL),

  ('Connectors of Contrast (Contraste)', 'Inglês', 'definicao',
   'Conectores usados pra opor duas ideias, mostrando contraste entre elas — um dos grupos mais cobrados em interpretação de texto.',
   'But, however, although, though, nevertheless, yet, on the other hand, even though, despite, in spite of.', NULL, NULL),

  ('Connectors of Addition (Adição)', 'Inglês', 'definicao',
   'Conectores usados pra somar informações ou ideias semelhantes dentro de um texto.',
   'And, also, moreover, furthermore, in addition, besides, as well as, not only... but also.', NULL, NULL),

  ('Connectors of Cause (Causa)', 'Inglês', 'definicao',
   'Conectores usados pra indicar o motivo ou a razão de algo acontecer.',
   'Because, since, as, due to, owing to, because of.', NULL, NULL),

  ('Connectors of Result (Consequência)', 'Inglês', 'definicao',
   'Conectores usados pra indicar o efeito ou resultado de algo mencionado antes na frase.',
   'So, therefore, thus, as a result, consequently, hence.', NULL, NULL),

  ('Connectors of Conclusion/Sequence (Conclusão)', 'Inglês', 'definicao',
   'Conectores usados pra concluir uma ideia ou organizar uma sequência de eventos/argumentos num texto.',
   'Finally, in conclusion, to sum up, in short, first, then, next, after that.', NULL, NULL),

  ('Possessive Case', 'Inglês', 'definicao',
   'Forma usada pra indicar posse, geralmente com apóstrofo + s (''s) pra pessoas/seres vivos, ou "of" pra objetos/coisas.',
   '"Maria''s book" (o livro da Maria); "the color of the car" (a cor do carro).', NULL, NULL),

  ('Articles (a / an / the)', 'Inglês', 'definicao',
   'Palavras usadas antes de substantivos: "a"/"an" (artigo indefinido, algo não específico) e "the" (artigo definido, algo específico ou já mencionado).',
   '"I saw a dog." vs. "The dog was barking." (o cachorro específico mencionado antes)', NULL, NULL),

  ('Idioms (Expressões Idiomáticas)', 'Inglês', 'definicao',
   'Expressões cujo sentido não pode ser entendido pela tradução literal de cada palavra, exigindo conhecimento do significado como um todo.',
   '"It''s raining cats and dogs" (está chovendo muito, não literalmente gatos e cachorros).', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: Biologia (genética, ecologia, fisiologia, microbiologia)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Alelo', 'Biologia', 'definicao',
   'Cada uma das formas alternativas de um mesmo gene, localizadas na mesma posição (lócus) em cromossomos homólogos, responsáveis pela variação de características hereditárias.',
   'O gene da cor da semente de ervilha tem o alelo "amarelo" (dominante) e o alelo "verde" (recessivo).', NULL, NULL),

  ('Genótipo e Fenótipo', 'Biologia', 'definicao',
   'Genótipo é a constituição genética de um indivíduo (os alelos que ele possui); fenótipo é a característica observável resultante da expressão desse genótipo, somada à influência do ambiente.',
   'Genótipo "Aa" pode gerar o fenótipo "flor roxa" se A (roxo) for dominante sobre a (branco).', NULL, NULL),

  ('Cromossomo', 'Biologia', 'visual',
   'Estrutura formada por DNA condensado e proteínas (histonas), visível durante a divisão celular, que carrega a informação genética organizada em genes.',
   'O ser humano tem 46 cromossomos (23 pares) em suas células somáticas.',
   'https://upload.wikimedia.org/wikipedia/commons/a/aa/Chromosome_structure.png',
   'Diagrama com termos em inglês (telomere, centromere, chromatid), mas a estrutura é a mesma cobrada em genética no vestibular: telômero, centrômero e cromátide.'),

  ('1ª Lei de Mendel', 'Biologia', 'definicao',
   'Lei da segregação dos fatores: cada característica é determinada por um par de fatores (alelos) que se separam na formação dos gametas, cada gameta recebendo apenas um deles.',
   'Cruzamento de ervilhas Aa x Aa gera proporção 3:1 (dominante:recessivo) na geração seguinte.', NULL, NULL),

  ('2ª Lei de Mendel', 'Biologia', 'definicao',
   'Lei da segregação independente: características diferentes (em cromossomos distintos) são herdadas de forma independente umas das outras.',
   'A cor da semente e a textura da semente da ervilha são herdadas independentemente.', NULL, NULL),

  ('Herança ligada ao sexo', 'Biologia', 'definicao',
   'Padrão de herança de genes localizados nos cromossomos sexuais (X ou Y), fazendo a característica se manifestar com frequências diferentes entre homens e mulheres.',
   'Daltonismo e hemofilia são exemplos clássicos de herança ligada ao cromossomo X, mais comuns em homens.', NULL, NULL),

  ('Cadeia Alimentar', 'Biologia', 'definicao',
   'Sequência linear de transferência de energia e matéria entre organismos, começando por produtores, passando por consumidores até os decompositores.',
   'Capim → gafanhoto → sapo → cobra → gavião.', NULL, NULL),

  ('Nicho Ecológico', 'Biologia', 'definicao',
   'Conjunto de funções, recursos utilizados e relações que uma espécie desempenha dentro de um ecossistema — "a profissão" da espécie, diferente do habitat (o "endereço").',
   NULL, NULL, NULL),

  ('Sucessão Ecológica', 'Biologia', 'definicao',
   'Processo gradual de mudança na composição de espécies de uma comunidade ao longo do tempo, até atingir um estado de equilíbrio relativo (clímax).',
   'Após um incêndio florestal, gramíneas colonizam primeiro, depois arbustos, até a floresta se reestabelecer.', NULL, NULL),

  ('Ciclo do Carbono', 'Biologia', 'definicao',
   'Circulação do carbono entre atmosfera, seres vivos, solo e oceanos, através de processos como fotossíntese, respiração, decomposição e queima de combustíveis fósseis.',
   'A fotossíntese remove CO2 da atmosfera; a respiração e a queima de combustíveis o devolvem.', NULL, NULL),

  ('Ciclo do Nitrogênio', 'Biologia', 'definicao',
   'Circulação do nitrogênio entre atmosfera, solo e seres vivos, dependente de bactérias fixadoras (transformam N2 em compostos utilizáveis) e decompositoras.',
   'Bactérias do gênero Rhizobium fixam nitrogênio nas raízes de leguminosas.', NULL, NULL),

  ('Sistema Circulatório', 'Biologia', 'visual',
   'Conjunto de coração, vasos sanguíneos e sangue responsável por transportar oxigênio, nutrientes, hormônios e resíduos pelo corpo. No ser humano, é fechado e duplo (circulação pulmonar e sistêmica).',
   'O coração humano tem 4 câmaras: 2 átrios e 2 ventrículos.',
   'https://upload.wikimedia.org/wikipedia/commons/b/b2/Diagram_of_the_human_heart_%28cropped%29_pt.svg', NULL),

  ('Sistema Digestório', 'Biologia', 'definicao',
   'Conjunto de órgãos responsáveis por processar o alimento, quebrando-o em nutrientes absorvíveis: boca, esôfago, estômago, intestino delgado, intestino grosso, além de glândulas anexas (fígado, pâncreas).',
   NULL, NULL, NULL),

  ('Sistema Nervoso', 'Biologia', 'definicao',
   'Sistema formado por encéfalo, medula espinhal e nervos, responsável por captar estímulos, processar informações e comandar respostas do corpo, através de células especializadas: os neurônios.',
   NULL, NULL, NULL),

  ('Sistema Endócrino (Hormônios)', 'Biologia', 'definicao',
   'Conjunto de glândulas que produzem hormônios, substâncias químicas liberadas na corrente sanguínea que regulam funções do corpo como crescimento, metabolismo e reprodução.',
   'A insulina, produzida pelo pâncreas, regula os níveis de glicose no sangue.', NULL, NULL),

  ('Sistema Imunológico', 'Biologia', 'definicao',
   'Conjunto de células, tecidos e órgãos que defendem o corpo contra agentes invasores (vírus, bactérias, fungos), incluindo imunidade inata (resposta geral e rápida) e adaptativa (específica, com memória).',
   NULL, NULL, NULL),

  ('Vacina', 'Biologia', 'definicao',
   'Preparado biológico que estimula o sistema imunológico a produzir defesa (anticorpos e memória imunológica) contra um agente infeccioso, sem causar a doença em si.',
   'Vacinas podem usar o agente enfraquecido/inativado, apenas partes dele, ou instruções genéticas (como as vacinas de mRNA).', NULL, NULL),

  ('Vírus', 'Biologia', 'visual',
   'Agente infeccioso microscópico, formado basicamente por material genético (DNA ou RNA) envolto por uma cápsula proteica (capsídeo). Não tem metabolismo próprio — depende de uma célula hospedeira pra se replicar, o que gera debate se são ou não considerados seres vivos.',
   'HIV, influenza e os coronavírus são exemplos de vírus com envelope (camada lipídica extra ao redor do capsídeo).',
   'https://upload.wikimedia.org/wikipedia/commons/7/7a/Simple_diagram_of_virus_%28blank%29.svg', NULL),

  ('Bactéria', 'Biologia', 'definicao',
   'Organismo unicelular procarioto (sem núcleo individualizado), um dos primeiros tipos de vida a surgir na Terra, podendo ser benéfico (decompositores, flora intestinal) ou causar doenças (patogênico).',
   'Escherichia coli, presente no intestino humano, e Mycobacterium tuberculosis, causadora da tuberculose.', NULL, NULL),

  ('Biotecnologia', 'Biologia', 'definicao',
   'Uso de organismos vivos ou seus componentes pra desenvolver produtos e tecnologias, incluindo técnicas modernas como CRISPR (edição genética), clonagem e produção de transgênicos.',
   'Insulina humana produzida por bactérias geneticamente modificadas é um exemplo clássico de biotecnologia aplicada à saúde.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: Química (orgânica, radioatividade, cinética, redox)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Hidrocarbonetos', 'Química', 'definicao',
   'Compostos orgânicos formados exclusivamente por carbono e hidrogênio, a base da química orgânica e dos combustíveis fósseis.',
   'Metano (CH4), o mais simples dos hidrocarbonetos, e a gasolina (mistura de hidrocarbonetos).', NULL, NULL),

  ('Álcool (Função Orgânica)', 'Química', 'definicao',
   'Função orgânica caracterizada pela presença do grupo hidroxila (-OH) ligado a um carbono saturado.',
   'Etanol (CH3-CH2-OH), usado como combustível e em bebidas alcoólicas.', NULL, NULL),

  ('Ácido Carboxílico', 'Química', 'definicao',
   'Função orgânica caracterizada pelo grupo carboxila (-COOH), responsável pelo caráter ácido de muitos compostos orgânicos.',
   'Ácido acético (vinagre) e ácido cítrico (frutas cítricas) são ácidos carboxílicos comuns.', NULL, NULL),

  ('Isomeria', 'Química', 'definicao',
   'Fenômeno em que dois ou mais compostos têm a mesma fórmula molecular, mas estruturas (e propriedades) diferentes.',
   'Álcool etílico e éter dimetílico têm a mesma fórmula (C2H6O) mas estruturas completamente diferentes.', NULL, NULL),

  ('Cadeia Carbônica', 'Química', 'definicao',
   'Sequência de átomos de carbono ligados entre si numa molécula orgânica, podendo ser classificada como aberta ou fechada, normal ou ramificada, saturada ou insaturada.',
   NULL, NULL, NULL),

  ('Polímeros', 'Química', 'definicao',
   'Macromoléculas formadas pela repetição de unidades menores (monômeros) ligadas quimicamente, presentes em plásticos e também em moléculas biológicas.',
   'O polietileno (usado em sacolas plásticas) e o DNA (um polímero de nucleotídeos) são exemplos de polímeros.', NULL, NULL),

  ('Radioatividade', 'Química', 'definicao',
   'Fenômeno em que núcleos atômicos instáveis emitem radiação (partículas alfa, beta ou raios gama) espontaneamente, transformando-se em outros elementos.',
   'O urânio-235, usado em usinas nucleares, é um elemento radioativo.', NULL, NULL),

  ('Marie Curie', 'Química', 'pessoa',
   'Física e química polonesa-francesa, pioneira no estudo da radioatividade (termo que ela cunhou). Única pessoa a ganhar Prêmio Nobel em duas ciências diferentes: Física (1903) e Química (1911).',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Marie_Curie_c1920.jpg', '1867 – 1934'),

  ('Eletronegatividade', 'Química', 'definicao',
   'Capacidade que um átomo tem de atrair elétrons pra si numa ligação química. Aumenta da esquerda pra direita e de baixo pra cima na tabela periódica.',
   'O flúor é o elemento mais eletronegativo da tabela periódica.', NULL, NULL),

  ('Energia de Ionização', 'Química', 'definicao',
   'Energia mínima necessária pra remover um elétron de um átomo neutro no estado gasoso, transformando-o num íon positivo.',
   'Gases nobres têm alta energia de ionização, por já terem a camada de valência completa.', NULL, NULL),

  ('Raio Atômico', 'Química', 'definicao',
   'Medida aproximada do tamanho de um átomo, geralmente a distância do núcleo até a camada eletrônica mais externa. Aumenta de cima pra baixo e da direita pra esquerda na tabela periódica.',
   NULL, NULL, NULL),

  ('Pontes de Hidrogênio', 'Química', 'definicao',
   'Tipo de força intermolecular forte que ocorre quando o hidrogênio está ligado a átomos muito eletronegativos (flúor, oxigênio ou nitrogênio).',
   'As pontes de hidrogênio entre moléculas de água explicam seu alto ponto de ebulição.', NULL, NULL),

  ('Forças de Van der Waals', 'Química', 'definicao',
   'Forças intermoleculares fracas, presentes em todas as substâncias, resultantes de atrações elétricas temporárias entre moléculas.',
   'É por causa dessas forças que gases nobres conseguem se liquefazer em temperaturas muito baixas.', NULL, NULL),

  ('Catalisador', 'Química', 'definicao',
   'Substância que aumenta a velocidade de uma reação química sem ser consumida no processo, diminuindo a energia de ativação necessária.',
   'Catalisadores automotivos reduzem a emissão de gases poluentes dos escapamentos.', NULL, NULL),

  ('Velocidade de Reação (Cinética Química)', 'Química', 'definicao',
   'Ramo da química que estuda a rapidez com que uma reação ocorre e os fatores que a influenciam: concentração, temperatura, superfície de contato e catalisadores.',
   NULL, NULL, NULL),

  ('Equilíbrio Químico', 'Química', 'definicao',
   'Estado de uma reação reversível em que as velocidades das reações direta e inversa se igualam, fazendo as concentrações dos reagentes e produtos permanecerem constantes.',
   NULL, NULL, NULL),

  ('Reações de Oxirredução (Redox)', 'Química', 'definicao',
   'Reações em que há transferência de elétrons entre espécies químicas: uma sofre oxidação (perde elétrons) e outra sofre redução (ganha elétrons).',
   'A ferrugem é resultado da oxidação do ferro em contato com oxigênio e umidade.', NULL, NULL),

  ('Nox (Número de Oxidação)', 'Química', 'definicao',
   'Carga elétrica que um átomo assumiria se todas as ligações da molécula fossem consideradas iônicas — usado pra identificar oxidação e redução numa reação.',
   NULL, NULL, NULL),

  ('Lei da Conservação das Massas', 'Química', 'definicao',
   'Lei de Lavoisier: "Na natureza nada se cria, nada se perde, tudo se transforma" — a massa total dos reagentes é igual à massa total dos produtos numa reação química em sistema fechado.',
   NULL, NULL, NULL),

  ('Alotropia', 'Química', 'definicao',
   'Fenômeno em que um mesmo elemento químico forma substâncias simples diferentes, com propriedades distintas, devido à organização diferente dos átomos.',
   'O carbono forma grafite (macio, condutor) e diamante (duríssimo, isolante) — dois alótropos do mesmo elemento.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: Física (gravitação, eletromagnetismo, termodinâmica, quântica)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Lei da Gravitação Universal', 'Física', 'definicao',
   'Lei formulada por Newton segundo a qual todo corpo com massa atrai qualquer outro corpo com massa, com força proporcional ao produto das massas e inversamente proporcional ao quadrado da distância entre eles.',
   'É essa lei que explica tanto a queda de uma maçã quanto a órbita dos planetas ao redor do Sol.', NULL, NULL),

  ('Impulso e Quantidade de Movimento', 'Física', 'definicao',
   'Quantidade de movimento (momentum) é o produto da massa pela velocidade de um corpo; impulso é a variação dessa quantidade, causada por uma força atuando durante um intervalo de tempo.',
   'Um airbag aumenta o tempo de colisão, reduzindo a força do impacto sobre o corpo pra um mesmo impulso.', NULL, NULL),

  ('Colisões Mecânicas', 'Física', 'definicao',
   'Choques entre corpos, classificados em elásticos (conservam energia cinética total), inelásticos (parte da energia se transforma em calor/deformação) e perfeitamente inelásticos (corpos ficam grudados após o choque).',
   NULL, NULL, NULL),

  ('Pressão Hidrostática (Princípio de Pascal)', 'Física', 'definicao',
   'Pressão exercida por um fluido em repouso, que aumenta com a profundidade. O Princípio de Pascal diz que uma pressão aplicada a um fluido em um recipiente fechado se transmite integralmente a todos os pontos do fluido.',
   'É o princípio usado em elevadores e freios hidráulicos.', NULL, NULL),

  ('Lentes (Convergentes e Divergentes)', 'Física', 'definicao',
   'Objetos transparentes que desviam raios de luz por refração. Lentes convergentes concentram os raios num ponto (usadas pra corrigir hipermetropia); divergentes espalham os raios (usadas pra corrigir miopia).',
   NULL, NULL, NULL),

  ('Espelhos Esféricos', 'Física', 'definicao',
   'Superfícies refletoras curvas, classificadas em côncavos (refletem pro lado interno da curva, usados em faróis e telescópios) e convexos (refletem pro lado externo, usados em espelhos retrovisores por ampliarem o campo de visão).',
   NULL, NULL, NULL),

  ('Galileu Galilei', 'Física', 'pessoa',
   'Físico, matemático e astrônomo italiano, considerado o "pai da ciência moderna" por defender o método experimental. Aperfeiçoou o telescópio e defendeu o heliocentrismo, o que o colocou em conflito com a Igreja Católica.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg', '1564 – 1642'),

  ('Michael Faraday', 'Física', 'pessoa',
   'Físico e químico inglês, um dos maiores cientistas experimentais da história, responsável por descobertas fundamentais em eletromagnetismo, incluindo a indução eletromagnética — base dos geradores elétricos modernos.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Michael_Faraday.jpg', '1791 – 1867'),

  ('Campo Elétrico', 'Física', 'definicao',
   'Região do espaço ao redor de uma carga elétrica onde outra carga sofre uma força elétrica. Representado por linhas de campo que saem de cargas positivas e entram em cargas negativas.',
   NULL, NULL, NULL),

  ('Campo Magnético', 'Física', 'definicao',
   'Região do espaço ao redor de um ímã ou corrente elétrica onde outras cargas ou ímãs sofrem força magnética. Representado por linhas de campo que saem do polo norte e entram no polo sul.',
   'A bússola funciona porque sua agulha se alinha ao campo magnético terrestre.', NULL, NULL),

  ('Indução Eletromagnética', 'Física', 'definicao',
   'Fenômeno descoberto por Faraday em que a variação de um campo magnético através de um circuito gera uma corrente elétrica induzida — princípio por trás de geradores e transformadores.',
   NULL, NULL, NULL),

  ('Corrente Alternada e Contínua', 'Física', 'definicao',
   'Corrente contínua (CC) flui sempre no mesmo sentido (como em pilhas); corrente alternada (CA) inverte o sentido periodicamente (como a energia da rede elétrica residencial).',
   NULL, NULL, NULL),

  ('Resistores em Série e Paralelo', 'Física', 'definicao',
   'Em série, os resistores formam um único caminho pra corrente e suas resistências se somam; em paralelo, formam caminhos alternativos e a resistência equivalente diminui.',
   NULL, NULL, NULL),

  ('Leis da Termodinâmica', 'Física', 'definicao',
   'Conjunto de leis que regem a energia térmica: a 1ª Lei trata da conservação de energia (a energia não se perde, se transforma); a 2ª Lei estabelece que a entropia (desordem) do universo tende sempre a aumentar.',
   NULL, NULL, NULL),

  ('Máquinas Térmicas', 'Física', 'definicao',
   'Dispositivos que convertem energia térmica em trabalho mecânico, através de ciclos de expansão e compressão de um fluido, nunca com 100% de eficiência (parte da energia sempre se perde como calor).',
   'O motor a combustão de um carro é um exemplo de máquina térmica.', NULL, NULL),

  ('Efeito Fotoelétrico', 'Física', 'definicao',
   'Fenômeno em que elétrons são ejetados de um material quando exposto à luz, explicado por Einstein ao propor que a luz se comporta como pacotes de energia (fótons) — descoberta que lhe rendeu o Prêmio Nobel de Física.',
   NULL, NULL, NULL),

  ('Física Quântica', 'Física', 'definicao',
   'Ramo da física que estuda o comportamento da matéria e energia em escala atômica e subatômica, onde partículas podem se comportar como onda e partícula ao mesmo tempo (dualidade onda-partícula).',
   NULL, NULL, NULL),

  ('Teoria da Relatividade', 'Física', 'definicao',
   'Teoria de Einstein dividida em restrita (relaciona espaço, tempo e velocidade da luz, com a famosa equação E=mc²) e geral (descreve a gravidade como uma curvatura do espaço-tempo causada pela massa).',
   NULL, NULL, NULL),

  ('Movimento Circular Uniforme (MCU)', 'Física', 'definicao',
   'Movimento em trajetória circular com velocidade escalar constante, mas direção sempre mudando — por isso existe aceleração centrípeta, direcionada pro centro da trajetória.',
   'As pás de um ventilador em velocidade constante descrevem um MCU.', NULL, NULL),

  ('Pressão Atmosférica', 'Física', 'definicao',
   'Peso da coluna de ar da atmosfera exercido sobre a superfície terrestre, que diminui com o aumento da altitude.',
   'É por isso que a água ferve numa temperatura mais baixa em altitudes elevadas, como em Machu Picchu.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: Matemática (funções, geometria, estatística)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Função Exponencial', 'Matemática', 'definicao',
   'Função no formato f(x) = a^x (a > 0 e a ≠ 1), em que a variável aparece no expoente, usada pra modelar crescimento ou decaimento acelerado.',
   'Juros compostos e crescimento populacional são modelados por funções exponenciais.', NULL, NULL),

  ('Função Modular', 'Matemática', 'definicao',
   'Função que envolve o módulo (valor absoluto) de uma expressão, representado por |x|, sempre resultando em valores não negativos.',
   '|−5| = 5 e |5| = 5.', NULL, NULL),

  ('Domínio e Imagem de uma Função', 'Matemática', 'definicao',
   'Domínio é o conjunto de todos os valores possíveis de entrada (x) de uma função; imagem é o conjunto de todos os valores de saída (f(x)) que ela realmente produz.',
   NULL, NULL, NULL),

  ('Área e Perímetro', 'Matemática', 'definicao',
   'Perímetro é a soma das medidas dos lados de uma figura plana (o "contorno"); área é a medida da superfície interna dessa figura.',
   'Um quadrado de lado 4 tem perímetro 16 e área 16 — coincidência só nesse caso específico.', NULL, NULL),

  ('Círculo (Área e Circunferência)', 'Matemática', 'definicao',
   'Circunferência é o contorno do círculo, calculada por 2πr; área do círculo é calculada por πr², onde r é o raio.',
   NULL, NULL, NULL),

  ('Teorema de Tales', 'Matemática', 'definicao',
   'Quando um feixe de retas paralelas é cortado por duas retas transversais, os segmentos correspondentes formados são proporcionais.',
   'Muito usado pra calcular medidas indiretas, como a altura de um prédio a partir de sua sombra.', NULL, NULL),

  ('Semelhança de Triângulos', 'Matemática', 'definicao',
   'Dois triângulos são semelhantes quando têm os ângulos correspondentes iguais e os lados correspondentes proporcionais, mantendo o mesmo "formato" em tamanhos diferentes.',
   NULL, NULL, NULL),

  ('Geometria Espacial (Volume de Sólidos)', 'Matemática', 'definicao',
   'Ramo da geometria que estuda figuras tridimensionais (prismas, pirâmides, cilindros, cones, esferas) e o cálculo de seus volumes e áreas de superfície.',
   'O volume de um cilindro é calculado por πr²h.', NULL, NULL),

  ('Relação de Euler (Poliedros)', 'Matemática', 'definicao',
   'Em poliedros convexos, o número de vértices (V) menos o número de arestas (A) mais o número de faces (F) é sempre igual a 2: V − A + F = 2.',
   NULL, NULL, NULL),

  ('Números Complexos', 'Matemática', 'definicao',
   'Números no formato a + bi, em que "i" é a unidade imaginária (i² = −1), usados pra resolver equações sem solução no conjunto dos números reais.',
   'A equação x² + 1 = 0 não tem solução real, mas tem solução complexa: x = ±i.', NULL, NULL),

  ('Polinômios', 'Matemática', 'definicao',
   'Expressões algébricas formadas pela soma de vários termos, cada um com uma variável elevada a um expoente inteiro não negativo, multiplicada por um coeficiente.',
   '3x² + 2x − 5 é um polinômio do 2º grau.', NULL, NULL),

  ('Inequações', 'Matemática', 'definicao',
   'Expressões matemáticas que relacionam duas quantidades usando desigualdades (>, <, ≥, ≤) em vez de igualdade, resultando num conjunto-solução ao invés de um valor único.',
   '2x − 4 > 0 tem como solução todo x > 2.', NULL, NULL),

  ('Sistema de Equações Lineares', 'Matemática', 'definicao',
   'Conjunto de duas ou mais equações do 1º grau com as mesmas variáveis, resolvido encontrando valores que satisfaçam todas as equações simultaneamente.',
   'Pode ser resolvido por substituição, adição ou usando matrizes/determinantes.', NULL, NULL),

  ('Estatística (Média, Moda e Mediana)', 'Matemática', 'definicao',
   'Média é a soma dos valores dividida pela quantidade deles; moda é o valor que mais se repete; mediana é o valor central quando os dados são ordenados.',
   'Nos dados 2, 3, 3, 5, 7: média = 4, moda = 3, mediana = 3.', NULL, NULL),

  ('Desvio Padrão', 'Matemática', 'definicao',
   'Medida estatística que indica o quanto os valores de um conjunto de dados se afastam, em média, da média desse conjunto — quanto maior, mais dispersos os dados.',
   NULL, NULL, NULL),

  ('Radiciação', 'Matemática', 'definicao',
   'Operação inversa da potenciação, usada pra encontrar a raiz de um número: √a = b significa que b² = a.',
   '√16 = 4, porque 4² = 16.', NULL, NULL),

  ('Notação Científica', 'Matemática', 'definicao',
   'Forma de representar números muito grandes ou muito pequenos como um número entre 1 e 10 multiplicado por uma potência de 10.',
   'A velocidade da luz é aproximadamente 3 × 10⁸ m/s.', NULL, NULL),

  ('René Descartes', 'Matemática', 'pessoa',
   'Filósofo e matemático francês, criador do sistema de coordenadas cartesianas (plano cartesiano), que uniu a álgebra e a geometria e deu origem à geometria analítica.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/1/12/Frans_Hals%2C_Portrait_of_Ren%C3%A9_Descartes.jpg', '1596 – 1650'),

  ('Leonhard Euler', 'Matemática', 'pessoa',
   'Matemático suíço, um dos mais prolíficos da história, com contribuições em praticamente todas as áreas da matemática — cálculo, teoria dos grafos, geometria — e responsável por popularizar boa parte da notação matemática usada até hoje (como o número "e").',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Leonhard_Euler.jpg', '1707 – 1783'),

  ('Plano Cartesiano', 'Matemática', 'definicao',
   'Sistema de coordenadas formado por dois eixos perpendiculares (x horizontal e y vertical) que se cruzam na origem, usado pra localizar pontos e representar funções e figuras geometricamente.',
   'O ponto (3, 2) está 3 unidades à direita e 2 unidades acima da origem.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: História (mundial, Brasil Império/República, século 20)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Zumbi dos Palmares', 'História', 'pessoa',
   'Último líder do Quilombo dos Palmares, o maior e mais duradouro quilombo do Brasil colonial, símbolo histórico da resistência negra à escravidão. Morto em 1695, sua data de morte (20 de novembro) é o Dia da Consciência Negra.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Est%C3%A1tua_de_Zumbi_dos_Palmares.jpg', 'Cerca de 1655 – 1695'),

  ('Dom Pedro II', 'História', 'pessoa',
   'Segundo e último imperador do Brasil, governou por quase 50 anos (1840-1889), período marcado por estabilidade política, abolição da escravidão (1888) e expansão cultural — foi deposto pela Proclamação da República.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Pedro_II_of_Brazil_-_Brady-Handy.jpg', '1825 – 1891'),

  ('Revolução Russa', 'História', 'definicao',
   'Movimento revolucionário de 1917 que derrubou o czarismo na Rússia e instaurou o primeiro governo socialista do mundo, liderado por Vladimir Lênin e o Partido Bolchevique.',
   NULL, NULL, NULL),

  ('Crise de 1929', 'História', 'definicao',
   'Grande depressão econômica mundial iniciada com a quebra da bolsa de Nova York, causando falências, desemprego em massa e impactando economias ao redor do mundo, incluindo o Brasil (queda no preço do café).',
   NULL, NULL, NULL),

  ('Holocausto', 'História', 'definicao',
   'Genocídio sistemático de cerca de 6 milhões de judeus, além de outras minorias, promovido pela Alemanha nazista de Hitler durante a Segunda Guerra Mundial.',
   NULL, NULL, NULL),

  ('Apartheid', 'História', 'definicao',
   'Sistema de segregação racial institucionalizado na África do Sul entre 1948 e 1994, que separava e discriminava legalmente a população negra em relação à branca.',
   'Nelson Mandela foi um dos principais líderes na luta contra o apartheid, preso por 27 anos antes de se tornar presidente.', NULL, NULL),

  ('Guerra do Vietnã', 'História', 'definicao',
   'Conflito (1955-1975) entre o Vietnã do Norte (comunista, apoiado pela URSS e China) e o Vietnã do Sul (apoiado pelos EUA), um dos principais confrontos indiretos da Guerra Fria, terminando com a vitória norte-vietnamita.',
   NULL, NULL, NULL),

  ('Descolonização da África e Ásia', 'História', 'definicao',
   'Processo, intensificado após a Segunda Guerra Mundial, de independência de colônias europeias na África e Ásia, gerando novas nações mas também conflitos internos e fronteiras artificiais herdadas do colonialismo.',
   NULL, NULL, NULL),

  ('Plano Real', 'História', 'definicao',
   'Plano econômico brasileiro de 1994 que criou a moeda Real e conseguiu controlar a hiperinflação que assolava o país havia décadas, um dos planos econômicos mais bem-sucedidos da história do Brasil.',
   NULL, NULL, NULL),

  ('Diretas Já', 'História', 'definicao',
   'Movimento popular de 1983-1984 que exigia eleições diretas para presidente no fim da ditadura militar. A emenda não foi aprovada no Congresso, mas o movimento marcou a redemocratização brasileira.',
   NULL, NULL, NULL),

  ('Guerra do Paraguai', 'História', 'definicao',
   'Maior conflito armado da história da América do Sul (1864-1870), envolvendo o Paraguai contra a Tríplice Aliança (Brasil, Argentina e Uruguai), com devastadoras perdas humanas e territoriais pro lado paraguaio.',
   NULL, NULL, NULL),

  ('Mercantilismo', 'História', 'definicao',
   'Conjunto de práticas econômicas adotadas pelas monarquias europeias entre os séculos 15 e 18, baseado no acúmulo de metais preciosos, balança comercial favorável e monopólio colonial.',
   NULL, NULL, NULL),

  ('Absolutismo', 'História', 'definicao',
   'Sistema político em que o poder do rei é considerado absoluto e de origem divina, sem limitações por outras instituições, predominante na Europa entre os séculos 16 e 18.',
   'Luís XIV da França, o "Rei Sol", é o exemplo clássico de monarca absolutista ("O Estado sou eu").', NULL, NULL),

  ('Grandes Navegações', 'História', 'definicao',
   'Expansão marítima europeia dos séculos 15 e 16, liderada inicialmente por Portugal e Espanha, que resultou na chegada dos europeus à América, África e Ásia por rotas marítimas.',
   NULL, NULL, NULL),

  ('Crise do Petróleo (1973)', 'História', 'definicao',
   'Choque econômico mundial causado pelo embargo de exportação de petróleo dos países árabes da OPEP, que quadruplicou o preço do barril e afetou economias dependentes de combustíveis fósseis, incluindo o Brasil.',
   NULL, NULL, NULL),

  ('ONU (Organização das Nações Unidas)', 'História', 'definicao',
   'Organização internacional criada em 1945, após a Segunda Guerra Mundial, com o objetivo de manter a paz mundial, promover direitos humanos e cooperação entre nações.',
   NULL, NULL, NULL),

  ('Unificação da Alemanha', 'História', 'definicao',
   'Processo liderado por Otto von Bismarck que uniu os diversos estados germânicos num único país em 1871, transformando a Prússia na potência central da nova Alemanha.',
   NULL, NULL, NULL),

  ('Revolução de 1930', 'História', 'definicao',
   'Movimento armado que levou Getúlio Vargas ao poder no Brasil, encerrando a Primeira República (República Velha) e o domínio político das oligarquias cafeeiras de São Paulo e Minas Gerais.',
   NULL, NULL, NULL),

  ('Populismo no Brasil', 'História', 'definicao',
   'Estilo político do século 20 marcado por líderes carismáticos que buscavam apoio direto das massas populares (especialmente urbanas e trabalhadoras), muitas vezes por meio de políticas sociais e discurso nacionalista.',
   'Getúlio Vargas e Juscelino Kubitschek são frequentemente associados ao populismo brasileiro.', NULL, NULL),

  ('Guerra das Malvinas', 'História', 'definicao',
   'Conflito de 1982 entre Argentina e Reino Unido pelo controle das Ilhas Malvinas (Falklands), vencido pelos britânicos, que acelerou o fim da ditadura militar argentina.',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: Geografia (biomas, população, economia, geopolítica)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Caatinga', 'Geografia', 'definicao',
   'Bioma exclusivamente brasileiro, predominante no Nordeste semiárido, com vegetação adaptada à seca (plantas de raízes profundas, caules que armazenam água, folhas pequenas ou ausentes).',
   NULL, NULL, NULL),

  ('Pantanal', 'Geografia', 'definicao',
   'Maior planície alagável do mundo, localizada principalmente em Mato Grosso e Mato Grosso do Sul, com altíssima biodiversidade e ciclos sazonais de cheia e seca.',
   NULL, NULL, NULL),

  ('Pampa', 'Geografia', 'definicao',
   'Bioma de planícies campestres presente no Rio Grande do Sul (e em partes da Argentina e Uruguai), com clima subtropical e vocação histórica pra pecuária.',
   NULL, NULL, NULL),

  ('Regiões do Brasil', 'Geografia', 'definicao',
   'Divisão oficial do território brasileiro (IBGE) em 5 regiões: Norte, Nordeste, Centro-Oeste, Sudeste e Sul, cada uma com características físicas, econômicas e culturais próprias.',
   NULL, NULL, NULL),

  ('Êxodo Rural', 'Geografia', 'definicao',
   'Movimento migratório da população do campo pra as cidades, um dos principais motores da rápida urbanização brasileira a partir da segunda metade do século 20.',
   NULL, NULL, NULL),

  ('Favela (Segregação Urbana)', 'Geografia', 'definicao',
   'Áreas urbanas caracterizadas por moradias precárias e infraestrutura deficiente, geralmente resultado de urbanização acelerada e desigual, refletindo a segregação socioespacial nas cidades.',
   NULL, NULL, NULL),

  ('Agronegócio', 'Geografia', 'definicao',
   'Conjunto de atividades econômicas ligadas à produção agropecuária em larga escala, desde insumos e produção até processamento e distribuição — um dos pilares da economia brasileira.',
   'Soja, milho e carne bovina estão entre os principais produtos do agronegócio brasileiro de exportação.', NULL, NULL),

  ('Matriz Energética', 'Geografia', 'definicao',
   'Conjunto das diferentes fontes de energia utilizadas por um país ou região (hidrelétrica, termelétrica, eólica, solar, nuclear, etc.) e sua participação relativa no total consumido.',
   'A matriz energética brasileira é uma das mais limpas do mundo, com forte presença de hidrelétricas.', NULL, NULL),

  ('Energias Renováveis', 'Geografia', 'definicao',
   'Fontes de energia que se regeneram naturalmente e não se esgotam com o uso, como energia solar, eólica, hidrelétrica e biomassa, em contraste com combustíveis fósseis.',
   NULL, NULL, NULL),

  ('Blocos Econômicos', 'Geografia', 'definicao',
   'Agrupamentos de países que buscam integração econômica através da redução de barreiras comerciais e cooperação entre seus membros.',
   'Mercosul (Brasil, Argentina, Paraguai, Uruguai) e União Europeia são exemplos de blocos econômicos.', NULL, NULL),

  ('Geopolítica', 'Geografia', 'definicao',
   'Estudo da relação entre geografia, poder e política internacional, analisando como fatores territoriais influenciam decisões estratégicas e conflitos entre países.',
   NULL, NULL, NULL),

  ('Divisão Internacional do Trabalho', 'Geografia', 'definicao',
   'Distribuição das atividades produtivas entre os países conforme sua posição na economia global, historicamente concentrando indústria de maior valor agregado nos países desenvolvidos e matérias-primas nos em desenvolvimento.',
   NULL, NULL, NULL),

  ('Bacias Hidrográficas', 'Geografia', 'definicao',
   'Área de terreno drenada por um rio principal e seus afluentes, delimitada por divisores de água (geralmente elevações do relevo).',
   'A Bacia Amazônica é a maior bacia hidrográfica do mundo em volume de água.', NULL, NULL),

  ('Vulcanismo', 'Geografia', 'definicao',
   'Conjunto de fenômenos relacionados à liberação de magma, gases e material rochoso do interior da Terra através de vulcões, geralmente concentrado nas bordas das placas tectônicas.',
   NULL, NULL, NULL),

  ('Tipos de Solo', 'Geografia', 'definicao',
   'Classificação dos solos conforme sua composição e fertilidade, como o solo massapê (fértil, litoral nordestino) e a terra roxa (fértil, ideal pro café, interior de SP/PR).',
   NULL, NULL, NULL),

  ('Correntes Marítimas', 'Geografia', 'definicao',
   'Movimentos contínuos e direcionados de água nos oceanos, causados por ventos, diferenças de temperatura e densidade, influenciando fortemente o clima costeiro.',
   'A Corrente do Golfo aquece o clima da Europa Ocidental, tornando-o mais ameno do que seria pela latitude.', NULL, NULL),

  ('El Niño e La Niña', 'Geografia', 'definicao',
   'Fenômenos climáticos cíclicos relacionados ao aquecimento (El Niño) ou resfriamento (La Niña) anormal das águas do Oceano Pacífico, que alteram padrões de chuva e temperatura em escala global.',
   NULL, NULL, NULL),

  ('Densidade Demográfica', 'Geografia', 'definicao',
   'Relação entre o número de habitantes e a área de um território, geralmente expressa em habitantes por quilômetro quadrado.',
   'O Brasil tem densidade demográfica relativamente baixa, mas com distribuição populacional muito desigual entre litoral e interior.', NULL, NULL),

  ('Camada de Ozônio', 'Geografia', 'definicao',
   'Camada da estratosfera que filtra boa parte da radiação ultravioleta do Sol, protegendo a vida na Terra. Foi afetada por gases como os CFCs, causando o chamado "buraco na camada de ozônio".',
   NULL, NULL, NULL),

  ('Movimentos Migratórios', 'Geografia', 'definicao',
   'Deslocamentos de pessoas entre regiões ou países, motivados por fatores econômicos, políticos, ambientais ou sociais, classificados em emigração (saída) e imigração (entrada).',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Segundo bloco: Inglês (gramática avançada + leitura/interpretação)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Past Continuous', 'Inglês', 'definicao',
   'Tempo verbal (was/were + verbo com -ing) usado pra ações em progresso num momento específico do passado, muitas vezes interrompidas por outra ação.',
   '"I was studying when she called." (Eu estava estudando quando ela ligou.)', NULL, NULL),

  ('Past Perfect', 'Inglês', 'definicao',
   'Tempo verbal (had + particípio) usado pra indicar que uma ação aconteceu antes de outra ação passada.',
   '"She had already left when I arrived." (Ela já tinha saído quando eu cheguei.)', NULL, NULL),

  ('Future (Will / Going to)', 'Inglês', 'definicao',
   '"Will" expressa decisões espontâneas ou previsões; "going to" expressa planos já decididos ou previsões baseadas em evidências presentes.',
   '"I will help you." (decisão no momento) vs. "I am going to travel next year." (plano já decidido)', NULL, NULL),

  ('Relative Pronouns', 'Inglês', 'definicao',
   'Pronomes usados pra conectar uma oração a um substantivo mencionado antes, dando mais informação sobre ele: who (pessoas), which (coisas), that (pessoas ou coisas), whose (posse).',
   '"The book that I read was great." (O livro que eu li foi ótimo.)', NULL, NULL),

  ('Indefinite Pronouns', 'Inglês', 'definicao',
   'Pronomes que se referem a pessoas, lugares ou coisas não especificadas: some/any/no combinados com -thing, -body, -one, -where.',
   '"Someone is at the door." / "There isn''t anything here."', NULL, NULL),

  ('Countable and Uncountable Nouns', 'Inglês', 'definicao',
   'Substantivos contáveis podem ser contados e têm plural (book/books); substantivos incontáveis não têm plural e são medidos por quantidade (water, information, money).',
   '"Some water" (não "some waters"); "many books" (não "much books").', NULL, NULL),

  ('Quantifiers (much, many, few, little)', 'Inglês', 'definicao',
   'Palavras que indicam quantidade: "much" e "little" com substantivos incontáveis; "many" e "few" com substantivos contáveis.',
   '"How much money?" / "How many books?"', NULL, NULL),

  ('Adjective Order', 'Inglês', 'definicao',
   'Ordem convencional dos adjetivos em inglês quando há mais de um antes de um substantivo: opinião, tamanho, idade, forma, cor, origem, material.',
   '"A beautiful small old round red Italian wooden table."', NULL, NULL),

  ('Wh- Questions', 'Inglês', 'definicao',
   'Perguntas formadas com palavras interrogativas (what, where, when, why, who, how) usadas pra pedir informações específicas, diferente das perguntas de sim/não.',
   '"Where do you live?" (Onde você mora?)', NULL, NULL),

  ('Auxiliary Verbs (Do/Does/Did)', 'Inglês', 'definicao',
   'Verbos auxiliares usados pra formar perguntas e negativas no presente (do/does) e passado (did) com verbos principais no infinitivo sem "to".',
   '"Does she like coffee?" / "I did not go to the party."', NULL, NULL),

  ('Adverbs of Frequency', 'Inglês', 'definicao',
   'Advérbios que indicam a frequência com que algo acontece (always, usually, often, sometimes, rarely, never), geralmente posicionados antes do verbo principal.',
   '"She always studies before dinner."', NULL, NULL),

  ('Adjectives vs Adverbs', 'Inglês', 'definicao',
   'Adjetivos descrevem substantivos (a slow car); advérbios descrevem verbos, adjetivos ou outros advérbios, geralmente terminando em -ly (he drives slowly).',
   NULL, NULL, NULL),

  ('Text Genres (Gêneros Textuais)', 'Inglês', 'definicao',
   'Diferentes formatos de texto cobrados em provas de inglês (charges, tirinhas, anúncios, artigos de opinião, notícias), cada um com estrutura e objetivo comunicativo próprios.',
   NULL, NULL, NULL),

  ('Denotation and Connotation', 'Inglês', 'definicao',
   'Denotação é o sentido literal/dicionário de uma palavra; conotação é o sentido figurado ou emocional que ela pode assumir dependendo do contexto.',
   '"Snake" pode denotar o animal, mas conotar "pessoa traiçoeira" em certos contextos.', NULL, NULL),

  ('Main Idea vs Supporting Details', 'Inglês', 'definicao',
   'Main idea é a ideia central de um texto ou parágrafo; supporting details são as informações que explicam, exemplificam ou comprovam essa ideia central.',
   NULL, NULL, NULL),

  ('Making Inferences', 'Inglês', 'definicao',
   'Habilidade de concluir informações que não estão explícitas no texto, combinando pistas textuais com conhecimento prévio do leitor — muito cobrada em interpretação de texto.',
   NULL, NULL, NULL),

  ('Contextual Clues', 'Inglês', 'definicao',
   'Pistas dentro do próprio texto (sinônimos, exemplos, explicações, contraste) que ajudam a deduzir o significado de uma palavra desconhecida sem precisar de dicionário.',
   NULL, NULL, NULL),

  ('Compound Words', 'Inglês', 'definicao',
   'Palavras formadas pela junção de duas ou mais palavras, criando um novo significado.',
   '"Breakfast" (break + fast), "notebook" (note + book).', NULL, NULL),

  ('Subject and Object Pronouns', 'Inglês', 'definicao',
   'Pronomes de sujeito (I, you, he, she, it, we, they) praticam a ação; pronomes de objeto (me, you, him, her, it, us, them) recebem a ação.',
   '"She (sujeito) called him (objeto)."', NULL, NULL),

  ('Possessive Adjectives and Pronouns', 'Inglês', 'definicao',
   'Adjetivos possessivos (my, your, his, her, its, our, their) vêm antes de um substantivo; pronomes possessivos (mine, yours, his, hers, ours, theirs) substituem o substantivo por completo.',
   '"This is my book." (adjetivo) vs. "This book is mine." (pronome)', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): Biologia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Tecidos Animais', 'Biologia', 'definicao',
   'Conjuntos de células com mesma origem e função. Os 4 tecidos básicos animais são: epitelial (revestimento), conjuntivo (sustentação e preenchimento), muscular (contração) e nervoso (condução de impulsos).',
   NULL, NULL, NULL),

  ('Reino Fungi', 'Biologia', 'definicao',
   'Grupo de seres eucariontes, em geral multicelulares, heterótrofos por absorção (decompõem matéria orgânica externamente e depois absorvem os nutrientes). Inclui fungos, leveduras e bolores.',
   'Penicillium, usado na produção da penicilina, e o Saccharomyces (levedura de padaria/cerveja) são fungos.', NULL, NULL),

  ('Reino Protista', 'Biologia', 'definicao',
   'Grupo de seres eucariontes unicelulares (ou coloniais), que inclui protozoários (heterótrofos, como a ameba) e algas unicelulares (autótrofas, como as diatomáceas).',
   'O Plasmodium, protozoário causador da malária, e a Euglena, alga flagelada.', NULL, NULL),

  ('Sistema Reprodutor Humano', 'Biologia', 'definicao',
   'Conjunto de órgãos responsáveis pela produção de gametas e pela reprodução: no homem, testículos produzem espermatozoides; na mulher, ovários produzem óvulos e o útero abriga a gestação.',
   NULL, NULL, NULL),

  ('Especiação', 'Biologia', 'definicao',
   'Processo evolutivo pelo qual novas espécies surgem a partir de populações de uma mesma espécie ancestral, geralmente por isolamento geográfico seguido de acúmulo de diferenças genéticas.',
   'Os tentilhões de Darwin, nas Ilhas Galápagos, são um exemplo clássico de especiação.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): Química
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Éster (Função Orgânica)', 'Química', 'definicao',
   'Função orgânica formada pela reação entre um ácido carboxílico e um álcool (esterificação), responsável por muitos aromas e sabores artificiais e naturais.',
   'Ésteres são responsáveis pelo aroma de frutas como banana e maçã em essências artificiais.', NULL, NULL),

  ('Amina e Amida', 'Química', 'definicao',
   'Amina é uma função orgânica derivada da amônia (NH3), com caráter básico; amida tem o grupo carbonila ligado a um nitrogênio, com caráter neutro.',
   'Aminas estão presentes em neurotransmissores como a adrenalina.', NULL, NULL),

  ('Concentração Molar (Molaridade)', 'Química', 'definicao',
   'Medida de concentração de uma solução, dada pela razão entre o número de mols do soluto e o volume da solução em litros (mol/L).',
   'Uma solução 1 mol/L tem 1 mol de soluto dissolvido em cada litro de solução.', NULL, NULL),

  ('Lei Geral dos Gases', 'Química', 'definicao',
   'Relaciona pressão, volume e temperatura de um gás: PV/T é constante para uma quantidade fixa de gás, permitindo prever o comportamento do gás quando uma dessas variáveis muda.',
   NULL, NULL, NULL),

  ('Fórmula Molecular, Estrutural e Mínima', 'Química', 'definicao',
   'Fórmula molecular mostra a quantidade exata de átomos de cada elemento; fórmula estrutural mostra como esses átomos estão conectados; fórmula mínima mostra a menor proporção entre os átomos.',
   'Glicose: fórmula molecular C6H12O6, fórmula mínima CH2O.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): Física
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Lançamento Oblíquo', 'Física', 'definicao',
   'Movimento de um corpo lançado com velocidade inicial inclinada em relação à horizontal, combinando um movimento horizontal uniforme com um movimento vertical uniformemente variado (queda livre).',
   'A trajetória de uma bola de futebol chutada em direção ao gol é um exemplo de lançamento oblíquo.', NULL, NULL),

  ('Torque (Momento de uma Força)', 'Física', 'definicao',
   'Grandeza que mede a capacidade de uma força de girar um corpo em torno de um eixo, calculada pelo produto da força pela distância perpendicular ao eixo de rotação.',
   'Quanto mais longe do eixo você aplica a força numa porta, mais fácil é abri-la — por isso a maçaneta fica longe das dobradiças.', NULL, NULL),

  ('Equilíbrio de Corpos (Estática)', 'Física', 'definicao',
   'Ramo da mecânica que estuda as condições pras quais um corpo permanece em repouso: a soma de todas as forças e a soma de todos os torques atuando sobre ele devem ser iguais a zero.',
   NULL, NULL, NULL),

  ('Efeito Joule', 'Física', 'definicao',
   'Transformação de energia elétrica em energia térmica (calor) quando uma corrente elétrica atravessa um condutor com resistência.',
   'É o princípio usado em chuveiros elétricos, ferros de passar e lâmpadas incandescentes.', NULL, NULL),

  ('Espectro Eletromagnético', 'Física', 'definicao',
   'Conjunto de todas as ondas eletromagnéticas organizadas por frequência/comprimento de onda: ondas de rádio, micro-ondas, infravermelho, luz visível, ultravioleta, raios X e raios gama.',
   'A luz visível é apenas uma pequena faixa do espectro eletromagnético.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): Matemática
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Binômio de Newton', 'Matemática', 'definicao',
   'Fórmula que permite expandir potências de um binômio (a + b)^n sem multiplicar termo a termo, usando os coeficientes binomiais (números do Triângulo de Pascal).',
   '(a + b)² = a² + 2ab + b².', NULL, NULL),

  ('Função Composta e Função Inversa', 'Matemática', 'definicao',
   'Função composta aplica uma função sobre o resultado de outra: (f∘g)(x) = f(g(x)). Função inversa "desfaz" o que a função original fez, revertendo entrada e saída.',
   NULL, NULL, NULL),

  ('Geometria Analítica', 'Matemática', 'definicao',
   'Ramo da matemática que usa coordenadas e álgebra pra estudar figuras geométricas, permitindo calcular distância entre pontos, equação da reta e outras propriedades geometricamente.',
   'A distância entre dois pontos (x1,y1) e (x2,y2) é dada por √[(x2−x1)² + (y2−y1)²].', NULL, NULL),

  ('Números Racionais e Irracionais', 'Matemática', 'definicao',
   'Números racionais podem ser escritos como fração de dois inteiros (incluindo decimais exatos ou periódicos); irracionais têm representação decimal infinita e não periódica, não podendo ser escritos como fração.',
   'π (pi) e √2 são números irracionais; 0,5 e 1/3 são racionais.', NULL, NULL),

  ('Razão e Proporção', 'Matemática', 'definicao',
   'Razão é a comparação entre duas grandezas por meio de uma divisão; proporção é a igualdade entre duas razões.',
   'A razão entre 10 e 5 é 2; "10 está para 5 assim como 20 está para 10" é uma proporção.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): História
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Revolução Cubana', 'História', 'definicao',
   'Movimento revolucionário (1953-1959) liderado por Fidel Castro e Che Guevara que derrubou o ditador Fulgencio Batista e instaurou um regime socialista em Cuba, alinhado à União Soviética durante a Guerra Fria.',
   NULL, NULL, NULL),

  ('Semana de Arte Moderna de 1922', 'História', 'definicao',
   'Evento cultural realizado em São Paulo que lançou o modernismo no Brasil, rompendo com padrões artísticos tradicionais e valorizando temas e uma estética nacionais.',
   'Oswald de Andrade, Mário de Andrade e Tarsila do Amaral participaram do movimento.', NULL, NULL),

  ('Movimento dos Direitos Civis (EUA)', 'História', 'definicao',
   'Movimento social nos Estados Unidos, com auge nas décadas de 1950-60, que lutou pelo fim da segregação racial e por direitos iguais pra população negra, liderado por figuras como Martin Luther King Jr.',
   NULL, NULL, NULL),

  ('Guerra Civil Espanhola', 'História', 'definicao',
   'Conflito (1936-1939) entre republicanos (apoiados por parte da esquerda internacional) e nacionalistas liderados pelo general Francisco Franco, que venceu e instaurou uma ditadura na Espanha até 1975.',
   NULL, NULL, NULL),

  ('Queda do Muro de Berlim', 'História', 'definicao',
   'Evento de 1989 que simbolizou o fim da divisão entre Alemanha Ocidental (capitalista) e Oriental (socialista), marcando o começo do fim da Guerra Fria e da União Soviética.',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): Geografia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Zona Franca de Manaus', 'Geografia', 'definicao',
   'Área de livre comércio criada em 1967 na capital do Amazonas, com incentivos fiscais pra atrair indústrias, importante polo industrial e econômico da região Norte.',
   NULL, NULL, NULL),

  ('Questão Agrária (Reforma Agrária)', 'Geografia', 'definicao',
   'Debate sobre a distribuição de terras no Brasil, marcado por forte concentração fundiária histórica; reforma agrária propõe redistribuir terras improdutivas pra fins de produção familiar e justiça social.',
   NULL, NULL, NULL),

  ('Desmatamento', 'Geografia', 'definicao',
   'Remoção da cobertura vegetal original de uma área, geralmente pra dar lugar à agropecuária, mineração ou expansão urbana, com graves impactos ambientais como perda de biodiversidade e emissão de carbono.',
   'A Amazônia é o bioma brasileiro mais monitorado em relação ao desmatamento.', NULL, NULL),

  ('Ilha de Calor Urbana', 'Geografia', 'definicao',
   'Fenômeno em que áreas urbanas apresentam temperaturas mais altas que áreas rurais vizinhas, causado pela concentração de asfalto, concreto e pela redução de áreas verdes.',
   NULL, NULL, NULL),

  ('Transição Demográfica', 'Geografia', 'definicao',
   'Processo de mudança nas taxas de natalidade e mortalidade de uma população ao longo do desenvolvimento econômico, geralmente resultando em envelhecimento populacional nas fases mais avançadas.',
   'Países desenvolvidos, como o Japão, já enfrentam forte envelhecimento populacional.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Terceiro bloco (5 por matéria): Inglês
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Prepositions of Time and Place (in/on/at)', 'Inglês', 'definicao',
   'Preposições usadas pra indicar tempo e lugar: "in" (meses, anos, cidades grandes), "on" (dias, datas, ruas), "at" (horários específicos, endereços exatos).',
   '"In 2024", "on Monday", "at 5 pm".', NULL, NULL),

  ('Used to (Past Habits)', 'Inglês', 'definicao',
   'Estrutura usada pra falar de hábitos ou estados que existiam no passado mas não existem mais no presente.',
   '"I used to play soccer every weekend." (Eu costumava jogar futebol todo fim de semana.)', NULL, NULL),

  ('Causative Verbs (Make/Let/Have/Get)', 'Inglês', 'definicao',
   'Verbos usados pra indicar que alguém causa ou permite que outra pessoa faça algo: "make" (obrigar), "let" (permitir), "have"/"get" (mandar fazer).',
   '"She made him apologize." / "I had my car washed."', NULL, NULL),

  ('Punctuation Rules (Comma Usage)', 'Inglês', 'definicao',
   'Regras de uso da vírgula em inglês, incluindo separação de itens numa lista, antes de conjunções coordenativas em orações compostas, e após expressões introdutórias.',
   '"I bought apples, bananas, and oranges." / "However, she decided to stay."', NULL, NULL),

  ('Formal vs Informal Language (Register)', 'Inglês', 'definicao',
   'Registro formal usa vocabulário mais elaborado e evita contrações e gírias (usado em textos acadêmicos e profissionais); registro informal é mais próximo da fala cotidiana, com contrações e expressões coloquiais.',
   '"I would like to inform you" (formal) vs. "Just wanted to let you know" (informal).', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): Biologia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Enzimas', 'Biologia', 'definicao',
   'Proteínas que aceleram reações químicas do metabolismo sem serem consumidas no processo, atuando como catalisadores biológicos específicos pra cada tipo de reação.',
   'A amilase salivar começa a digestão do amido ainda na boca.', NULL, NULL),

  ('Vitaminas', 'Biologia', 'definicao',
   'Substâncias orgânicas essenciais em pequenas quantidades pro funcionamento do organismo, obtidas principalmente pela alimentação, classificadas em hidrossolúveis (complexo B, C) e lipossolúveis (A, D, E, K).',
   'A falta de vitamina C causa escorbuto; a falta de vitamina D afeta a absorção de cálcio.', NULL, NULL),

  ('Sistema Respiratório', 'Biologia', 'definicao',
   'Conjunto de órgãos responsáveis pelas trocas gasosas entre o corpo e o ambiente: vias aéreas (nariz, faringe, laringe, traqueia, brônquios) e pulmões, onde ocorre a hematose (troca de O2 por CO2).',
   NULL, NULL, NULL),

  ('Sistema Excretor (Urinário)', 'Biologia', 'definicao',
   'Conjunto de órgãos responsáveis por filtrar o sangue e eliminar substâncias tóxicas e excesso de água na forma de urina, tendo os rins (com os néfrons) como principal órgão.',
   NULL, NULL, NULL),

  ('Sistema Ósseo (Esqueleto)', 'Biologia', 'definicao',
   'Conjunto de ossos que sustenta o corpo, protege órgãos internos, permite o movimento junto com os músculos e produz células sanguíneas na medula óssea.',
   'O corpo humano adulto tem 206 ossos.', NULL, NULL),

  ('Contração Muscular', 'Biologia', 'definicao',
   'Processo pelo qual as fibras musculares se encurtam usando energia (ATP), gerado pelo deslizamento das proteínas actina e miosina entre si, permitindo o movimento do corpo.',
   NULL, NULL, NULL),

  ('Fator Rh', 'Biologia', 'definicao',
   'Proteína presente (Rh+) ou ausente (Rh-) na superfície das hemácias, independente do sistema ABO, relevante principalmente em transfusões de sangue e na gestação (incompatibilidade Rh entre mãe e feto).',
   NULL, NULL, NULL),

  ('Anticorpos e Antígenos', 'Biologia', 'definicao',
   'Antígeno é qualquer substância capaz de desencadear uma resposta imune; anticorpo é a proteína produzida pelo sistema imunológico pra reconhecer e neutralizar um antígeno específico.',
   NULL, NULL, NULL),

  ('Mutação Genética', 'Biologia', 'definicao',
   'Alteração na sequência do DNA de um organismo, podendo ser espontânea ou causada por agentes mutagênicos (radiação, certos produtos químicos), fonte primária de variabilidade genética pra evolução.',
   NULL, NULL, NULL),

  ('DNA Recombinante (Engenharia Genética)', 'Biologia', 'definicao',
   'Técnica que combina DNA de diferentes organismos, permitindo inserir genes específicos em outro organismo — base da produção de insulina humana por bactérias e de plantas transgênicas.',
   NULL, NULL, NULL),

  ('Reino Animalia', 'Biologia', 'definicao',
   'Reino que reúne os animais, organismos eucariontes, multicelulares e heterótrofos, classificados por características como presença de coluna vertebral (vertebrados) ou não (invertebrados).',
   NULL, NULL, NULL),

  ('Reino Plantae', 'Biologia', 'definicao',
   'Reino que reúne as plantas, organismos eucariontes, multicelulares, autótrofos por fotossíntese, divididos em briófitas, pteridófitas, gimnospermas e angiospermas.',
   NULL, NULL, NULL),

  ('Hormônios Vegetais', 'Biologia', 'definicao',
   'Substâncias que regulam o crescimento e desenvolvimento das plantas, como a auxina (responsável pelo fototropismo, o crescimento em direção à luz).',
   NULL, NULL, NULL),

  ('Ciclo Menstrual', 'Biologia', 'definicao',
   'Ciclo hormonal mensal do sistema reprodutor feminino, regulado por estrógeno e progesterona, que prepara o corpo pra uma possível gravidez, incluindo a ovulação.',
   NULL, NULL, NULL),

  ('Desenvolvimento Embrionário', 'Biologia', 'definicao',
   'Conjunto de etapas pelas quais o zigoto se transforma num organismo completo: clivagem, gastrulação (formação das camadas germinativas) e organogênese (formação dos órgãos).',
   NULL, NULL, NULL),

  ('Teia Alimentar', 'Biologia', 'definicao',
   'Conjunto de várias cadeias alimentares interligadas num ecossistema, representando de forma mais realista as relações alimentares entre organismos do que uma única cadeia linear.',
   NULL, NULL, NULL),

  ('Pirâmides Ecológicas', 'Biologia', 'definicao',
   'Representações gráficas que mostram a quantidade de energia, biomassa ou número de indivíduos em cada nível trófico de um ecossistema, geralmente diminuindo dos produtores até os últimos consumidores.',
   NULL, NULL, NULL),

  ('Ciclo do Fósforo', 'Biologia', 'definicao',
   'Circulação do fósforo entre rochas, solo, água e seres vivos, elemento essencial pra moléculas como DNA e ATP, sem passar por uma fase gasosa significativa (diferente dos ciclos do carbono e nitrogênio).',
   NULL, NULL, NULL),

  ('Louis Pasteur', 'Biologia', 'pessoa',
   'Químico e microbiologista francês, criador da pasteurização e um dos pais da microbiologia moderna, derrubou a teoria da geração espontânea e desenvolveu vacinas, incluindo a da raiva.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/42/Louis_Pasteur.jpg', '1822 – 1895'),

  ('Robert Hooke', 'Biologia', 'pessoa',
   'Cientista inglês que, ao observar uma fatia de cortiça num microscópio rudimentar, foi o primeiro a descrever e nomear as "células" (1665), termo usado até hoje na biologia.',
   NULL, NULL, '1635 – 1703')
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): Química
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Diluição de Soluções', 'Química', 'definicao',
   'Processo de reduzir a concentração de uma solução adicionando mais solvente, mantendo a quantidade de soluto constante (M1.V1 = M2.V2).',
   NULL, NULL, NULL),

  ('Titulação', 'Química', 'definicao',
   'Técnica de laboratório usada pra determinar a concentração desconhecida de uma solução, adicionando gradualmente uma solução de concentração conhecida até a reação se completar (ponto de equivalência).',
   NULL, NULL, NULL),

  ('Constante de Equilíbrio (Kc)', 'Química', 'definicao',
   'Valor numérico que expressa a relação entre as concentrações de produtos e reagentes num equilíbrio químico, indicando se o equilíbrio favorece produtos (Kc alto) ou reagentes (Kc baixo).',
   NULL, NULL, NULL),

  ('Princípio de Le Chatelier', 'Química', 'definicao',
   'Quando um sistema em equilíbrio sofre uma perturbação (mudança de concentração, temperatura ou pressão), ele se desloca no sentido de minimizar essa perturbação e restabelecer um novo equilíbrio.',
   NULL, NULL, NULL),

  ('pOH', 'Química', 'definicao',
   'Medida da concentração de íons hidroxila (OH-) numa solução, complementar ao pH: pH + pOH = 14 (a 25°C).',
   NULL, NULL, NULL),

  ('Solução Tampão', 'Química', 'definicao',
   'Solução que resiste a variações bruscas de pH quando pequenas quantidades de ácido ou base são adicionadas, essencial pra manter o pH estável em sistemas biológicos, como o sangue.',
   NULL, NULL, NULL),

  ('Ligas Metálicas', 'Química', 'definicao',
   'Misturas de dois ou mais metais (ou metal com não-metal) que resultam num material com propriedades melhoradas em relação aos metais puros.',
   'Aço (ferro + carbono) e bronze (cobre + estanho) são ligas metálicas comuns.', NULL, NULL),

  ('Corrosão', 'Química', 'definicao',
   'Processo de deterioração de um metal por reação química (geralmente oxidação) com o ambiente, como a formação de ferrugem no ferro exposto a oxigênio e umidade.',
   NULL, NULL, NULL),

  ('Eletrólise', 'Química', 'definicao',
   'Processo que usa corrente elétrica pra forçar uma reação química não espontânea, decompondo uma substância — o inverso do que acontece numa pilha.',
   'A eletrólise da água a decompõe em gás hidrogênio e gás oxigênio.', NULL, NULL),

  ('Nomenclatura de Compostos Orgânicos (IUPAC)', 'Química', 'definicao',
   'Sistema padronizado de regras pra nomear compostos orgânicos de forma única e universal, baseado no tamanho da cadeia carbônica e nos grupos funcionais presentes.',
   NULL, NULL, NULL),

  ('Cetonas e Aldeídos', 'Química', 'definicao',
   'Funções orgânicas que contêm o grupo carbonila (C=O): em cetonas, esse grupo está entre dois carbonos; em aldeídos, está numa extremidade da cadeia, ligado a um hidrogênio.',
   'Acetona (removedor de esmalte) é uma cetona; formaldeído é um aldeído.', NULL, NULL),

  ('Éteres', 'Química', 'definicao',
   'Função orgânica em que um átomo de oxigênio está ligado a duas cadeias carbônicas (R-O-R), geralmente com baixo ponto de ebulição e usados como solventes e anestésicos.',
   NULL, NULL, NULL),

  ('Haletos Orgânicos', 'Química', 'definicao',
   'Compostos orgânicos em que um ou mais átomos de halogênio (flúor, cloro, bromo, iodo) substituem hidrogênios na cadeia carbônica.',
   'O clorofórmio e o CFC (usado em antigos aerossóis, hoje proibido por afetar a camada de ozônio) são haletos orgânicos.', NULL, NULL),

  ('Petróleo e Derivados', 'Química', 'definicao',
   'Mistura natural de hidrocarbonetos, refinada por destilação fracionada pra gerar produtos como gasolina, diesel, querosene, GLP e matéria-prima pra plásticos.',
   NULL, NULL, NULL),

  ('Elemento Químico, Substância Simples e Composta', 'Química', 'definicao',
   'Elemento químico é um tipo de átomo (definido pelo número atômico); substância simples é formada por um único elemento (O2); substância composta é formada por dois ou mais elementos diferentes (H2O).',
   NULL, NULL, NULL),

  ('Número Atômico e Número de Massa', 'Química', 'definicao',
   'Número atômico (Z) é a quantidade de prótons no núcleo, define o elemento químico; número de massa (A) é a soma de prótons e nêutrons.',
   NULL, NULL, NULL),

  ('Configuração Eletrônica', 'Química', 'definicao',
   'Distribuição dos elétrons de um átomo em camadas e subníveis de energia, seguindo o diagrama de Linus Pauling, determinando as propriedades químicas do elemento.',
   NULL, NULL, NULL),

  ('John Dalton', 'Química', 'pessoa',
   'Químico e físico inglês que propôs o primeiro modelo atômico moderno (1803), descrevendo o átomo como uma esfera maciça e indivisível — o modelo da "bola de bilhar".',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/d4/John_Dalton_by_Charles_Turner.jpg', '1766 – 1844'),

  ('Ernest Rutherford', 'Química', 'pessoa',
   'Físico e químico neozelandês, propôs o modelo atômico nuclear (1911) a partir de seu experimento com folha de ouro, mostrando que o átomo tem um núcleo pequeno, denso e positivo, cercado por elétrons.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/de/Ernest_Rutherford_1908.jpg', '1871 – 1937'),

  ('Niels Bohr', 'Química', 'pessoa',
   'Físico dinamarquês que aperfeiçoou o modelo atômico de Rutherford, propondo que os elétrons ocupam órbitas (camadas) com níveis de energia definidos ao redor do núcleo.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Niels_Bohr.jpg', '1885 – 1962')
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): Física
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Energia Potencial Elástica', 'Física', 'definicao',
   'Energia armazenada num corpo elástico (mola, elástico) quando é comprimido ou esticado, calculada por Ep = kx²/2, onde k é a constante elástica e x a deformação.',
   NULL, NULL, NULL),

  ('Sistema Internacional de Unidades (SI)', 'Física', 'definicao',
   'Sistema padronizado internacionalmente de unidades de medida (metro, quilograma, segundo, ampère, kelvin, mol, candela), usado pra garantir uniformidade em medições científicas.',
   NULL, NULL, NULL),

  ('Grandezas Escalares e Vetoriais', 'Física', 'definicao',
   'Grandezas escalares são definidas apenas por um número e uma unidade (massa, temperatura); grandezas vetoriais precisam também de direção e sentido (velocidade, força).',
   NULL, NULL, NULL),

  ('Resultante de Forças', 'Física', 'definicao',
   'Força única equivalente ao efeito combinado de todas as forças atuando sobre um corpo, obtida pela soma vetorial dessas forças.',
   NULL, NULL, NULL),

  ('Plano Inclinado', 'Física', 'definicao',
   'Superfície inclinada em relação à horizontal, usada pra decompor o peso de um corpo em componentes paralela e perpendicular ao plano, facilitando o estudo de forças em rampas.',
   NULL, NULL, NULL),

  ('Força de Atrito', 'Física', 'definicao',
   'Força que se opõe ao movimento relativo entre duas superfícies em contato, podendo ser estática (impede o início do movimento) ou cinética (atua durante o movimento).',
   NULL, NULL, NULL),

  ('Olho Humano e Defeitos de Visão', 'Física', 'definicao',
   'O olho funciona como um sistema óptico com uma lente (cristalino) que foca a luz na retina. Miopia (dificuldade de ver de longe) e hipermetropia (dificuldade de ver de perto) são corrigidas com lentes divergentes e convergentes, respectivamente.',
   NULL, NULL, NULL),

  ('Acústica (Som)', 'Física', 'definicao',
   'Ramo da física que estuda o som, uma onda mecânica que se propaga por um meio material, caracterizada por frequência (altura do som), amplitude (intensidade/volume) e timbre.',
   NULL, NULL, NULL),

  ('Escalas Termométricas', 'Física', 'definicao',
   'Sistemas usados pra medir temperatura: Celsius (°C, água congela a 0° e ferve a 100°), Fahrenheit (°F, usada nos EUA) e Kelvin (K, escala absoluta usada na ciência, 0K é o zero absoluto).',
   NULL, NULL, NULL),

  ('Calorimetria', 'Física', 'definicao',
   'Ramo da física que estuda a troca de calor entre corpos, calculada por Q = m.c.ΔT, onde c é o calor específico do material.',
   NULL, NULL, NULL),

  ('Mudanças de Estado Físico', 'Física', 'definicao',
   'Transformações entre os estados sólido, líquido e gasoso da matéria: fusão, solidificação, vaporização, condensação, sublimação e ressublimação.',
   NULL, NULL, NULL),

  ('Radiação Térmica', 'Física', 'definicao',
   'Forma de transferência de calor através de ondas eletromagnéticas, sem necessidade de um meio material — é assim que o calor do Sol chega até a Terra através do vácuo.',
   NULL, NULL, NULL),

  ('Potência Elétrica', 'Física', 'definicao',
   'Taxa de conversão ou transferência de energia elétrica por unidade de tempo, medida em watts (W), calculada por P = V.i (tensão vezes corrente).',
   NULL, NULL, NULL),

  ('Transformadores Elétricos', 'Física', 'definicao',
   'Dispositivos que usam indução eletromagnética pra aumentar (elevador) ou diminuir (abaixador) a tensão de uma corrente alternada, essenciais na transmissão de energia elétrica a longas distâncias.',
   NULL, NULL, NULL),

  ('Semicondutores', 'Física', 'definicao',
   'Materiais com condutividade elétrica intermediária entre condutores e isolantes, cuja condutividade pode ser controlada — base de transistores, diodos e de toda a eletrônica moderna.',
   'O silício é o semicondutor mais usado na fabricação de chips.', NULL, NULL),

  ('Fissão Nuclear', 'Física', 'definicao',
   'Processo em que o núcleo de um átomo pesado (como urânio-235) se divide em núcleos menores, liberando grande quantidade de energia — usado em usinas nucleares e bombas atômicas.',
   NULL, NULL, NULL),

  ('Fusão Nuclear', 'Física', 'definicao',
   'Processo em que dois núcleos leves se unem pra formar um núcleo mais pesado, liberando ainda mais energia que a fissão — é o processo que ocorre no núcleo das estrelas, incluindo o Sol.',
   NULL, NULL, NULL),

  ('Buracos Negros', 'Física', 'definicao',
   'Regiões do espaço com campo gravitacional tão intenso que nada, nem mesmo a luz, consegue escapar, formadas geralmente pelo colapso gravitacional de estrelas muito massivas.',
   NULL, NULL, NULL),

  ('Max Planck', 'Física', 'pessoa',
   'Físico alemão considerado o pai da física quântica, propôs em 1900 que a energia é emitida em pacotes discretos (quanta), ideia que revolucionou a física do século 20.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Max_Planck_%281858-1947%29.jpg', '1858 – 1947'),

  ('James Clerk Maxwell', 'Física', 'pessoa',
   'Físico e matemático escocês que unificou eletricidade, magnetismo e luz numa única teoria (equações de Maxwell), mostrando que a luz é uma onda eletromagnética.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/42/James_Clerk_Maxwell.jpg', '1831 – 1879')
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): Matemática
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Equação da Circunferência', 'Matemática', 'definicao',
   'Equação (x-a)² + (y-b)² = r², que representa todos os pontos a uma distância r (raio) de um centro (a,b) no plano cartesiano.',
   NULL, NULL, NULL),

  ('Coeficiente Angular de uma Reta', 'Matemática', 'definicao',
   'Número que indica a inclinação de uma reta em relação ao eixo x, calculado pela razão entre a variação de y e a variação de x entre dois pontos da reta.',
   'Coeficiente angular positivo indica reta crescente; negativo, reta decrescente.', NULL, NULL),

  ('Soma dos Termos de uma PA e PG', 'Matemática', 'definicao',
   'Fórmulas pra somar os termos de uma progressão: numa PA, Sn = (a1+an).n/2; numa PG finita, Sn = a1.(qⁿ-1)/(q-1).',
   NULL, NULL, NULL),

  ('Taxa de Variação', 'Matemática', 'definicao',
   'Medida de quanto uma grandeza muda em relação à outra, calculada pela razão entre a variação da saída e a variação da entrada de uma função.',
   NULL, NULL, NULL),

  ('Máximos e Mínimos de uma Função', 'Matemática', 'definicao',
   'Pontos onde uma função atinge seu maior (máximo) ou menor (mínimo) valor, num intervalo ou em todo o domínio — no gráfico de uma parábola, é o vértice.',
   NULL, NULL, NULL),

  ('Conjuntos (União e Interseção)', 'Matemática', 'definicao',
   'União de dois conjuntos reúne todos os elementos de ambos; interseção reúne apenas os elementos que estão presentes nos dois conjuntos ao mesmo tempo.',
   NULL, NULL, NULL),

  ('Lógica Matemática (Proposições)', 'Matemática', 'definicao',
   'Estudo de sentenças que podem ser classificadas como verdadeiras ou falsas (proposições), e de como combiná-las usando conectivos lógicos (e, ou, não, se-então).',
   NULL, NULL, NULL),

  ('Funções Pares e Ímpares', 'Matemática', 'definicao',
   'Função par tem simetria em relação ao eixo y (f(-x) = f(x)); função ímpar tem simetria em relação à origem (f(-x) = -f(x)).',
   NULL, NULL, NULL),

  ('Noção Intuitiva de Limite', 'Matemática', 'definicao',
   'Valor que uma função se aproxima conforme a variável independente se aproxima de um determinado ponto, conceito base do cálculo diferencial.',
   NULL, NULL, NULL),

  ('Noção Intuitiva de Derivada', 'Matemática', 'definicao',
   'Taxa de variação instantânea de uma função num ponto, representando a inclinação da reta tangente ao gráfico naquele ponto.',
   NULL, NULL, NULL),

  ('Matemática Financeira (Montante e Desconto)', 'Matemática', 'definicao',
   'Montante é o valor total acumulado após aplicação de juros sobre um capital; desconto é a redução aplicada ao valor de um título pago antes do vencimento.',
   NULL, NULL, NULL),

  ('Sistema de Numeração Binário', 'Matemática', 'definicao',
   'Sistema de numeração que usa apenas dois dígitos (0 e 1), base de funcionamento de todos os computadores e dispositivos digitais.',
   'O número decimal 5 é representado como 101 em binário.', NULL, NULL),

  ('Congruência de Triângulos', 'Matemática', 'definicao',
   'Dois triângulos são congruentes quando têm exatamente o mesmo tamanho e formato, com lados e ângulos correspondentes iguais.',
   NULL, NULL, NULL),

  ('Ângulos Complementares e Suplementares', 'Matemática', 'definicao',
   'Ângulos complementares somam 90°; ângulos suplementares somam 180°.',
   NULL, NULL, NULL),

  ('Polígonos Regulares', 'Matemática', 'definicao',
   'Polígonos com todos os lados e todos os ângulos internos iguais, como o triângulo equilátero, o quadrado e o hexágono regular.',
   NULL, NULL, NULL),

  ('Pierre de Fermat', 'Matemática', 'pessoa',
   'Matemático francês, um dos fundadores do cálculo moderno e da teoria dos números, famoso pelo "Último Teorema de Fermat", enunciado por ele mas só demonstrado 358 anos depois.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Pierre_de_Fermat.jpg', '1601 – 1665'),

  ('Carl Friedrich Gauss', 'Matemática', 'pessoa',
   'Matemático alemão considerado um dos maiores de todos os tempos, com contribuições fundamentais em álgebra, geometria, estatística (curva normal, ou "curva de Gauss") e teoria dos números.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Carl_Friedrich_Gauss_1840_by_Jensen.jpg', '1777 – 1855'),

  ('Amplitude e Período de Funções Trigonométricas', 'Matemática', 'definicao',
   'Amplitude é a distância entre o valor máximo e o valor médio de uma função trigonométrica; período é o intervalo necessário pra a função completar um ciclo completo.',
   NULL, NULL, NULL),

  ('Números Naturais e Inteiros', 'Matemática', 'definicao',
   'Números naturais são os usados pra contar (0, 1, 2, 3...); números inteiros incluem também os negativos (..., -2, -1, 0, 1, 2...).',
   NULL, NULL, NULL),

  ('Regra de Sinais', 'Matemática', 'definicao',
   'Regras pra operações com números positivos e negativos: na multiplicação e divisão, sinais iguais dão resultado positivo, sinais diferentes dão resultado negativo.',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): História
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Revolução Gloriosa', 'História', 'definicao',
   'Revolução inglesa de 1688 que depôs o rei Jaime II sem derramamento de sangue significativo, estabelecendo uma monarquia parlamentar e limitando os poderes do rei na Inglaterra.',
   NULL, NULL, NULL),

  ('Reforma Protestante', 'História', 'definicao',
   'Movimento religioso do século 16, iniciado por Martinho Lutero, que rompeu com a Igreja Católica e deu origem às igrejas protestantes, questionando práticas como a venda de indulgências.',
   NULL, NULL, NULL),

  ('Cruzadas', 'História', 'definicao',
   'Série de expedições militares religiosas organizadas pela Igreja Católica entre os séculos 11 e 13, com o objetivo declarado de retomar Jerusalém e a Terra Santa do domínio muçulmano.',
   NULL, NULL, NULL),

  ('Peste Negra', 'História', 'definicao',
   'Pandemia de peste bubônica que assolou a Europa no século 14, matando entre um terço e metade da população do continente, com profundos impactos sociais e econômicos.',
   NULL, NULL, NULL),

  ('Império Romano', 'História', 'definicao',
   'Uma das maiores civilizações da Antiguidade, que dominou grande parte da Europa, norte da África e Oriente Médio, deixando heranças duradouras em direito, arquitetura, língua e organização política.',
   NULL, NULL, NULL),

  ('Grécia Antiga (Democracia Ateniense)', 'História', 'definicao',
   'Civilização berço da filosofia ocidental e da democracia, especialmente na cidade-estado de Atenas, onde cidadãos (uma parcela restrita da população) participavam diretamente das decisões políticas.',
   NULL, NULL, NULL),

  ('Revolução dos Cravos', 'História', 'definicao',
   'Golpe militar de 1974 em Portugal que derrubou pacificamente a ditadura do Estado Novo português, marcando o início da democratização do país.',
   NULL, NULL, NULL),

  ('Lei de Anistia (1979)', 'História', 'definicao',
   'Lei brasileira que perdoou crimes políticos cometidos durante a ditadura militar, tanto por opositores quanto por agentes do Estado, permitindo o retorno de exilados políticos ao país.',
   NULL, NULL, NULL),

  ('Revolta da Vacina', 'História', 'definicao',
   'Levante popular no Rio de Janeiro em 1904 contra a vacinação obrigatória contra a varíola, imposta de forma autoritária pelo governo, refletindo também insatisfações sociais mais amplas.',
   NULL, NULL, NULL),

  ('Revolução Constitucionalista de 1932', 'História', 'definicao',
   'Movimento armado liderado por São Paulo contra o governo de Getúlio Vargas, exigindo uma nova Constituição para o Brasil — o estado paulista foi derrotado militarmente, mas a Constituição foi promulgada em 1934.',
   NULL, NULL, NULL),

  ('Guerra dos Cem Anos', 'História', 'definicao',
   'Série de conflitos entre Inglaterra e França (1337-1453) pela sucessão do trono francês, marcada pela atuação de Joana d''Arc na fase final, vencida pelos franceses.',
   NULL, NULL, NULL),

  ('Primavera dos Povos (1848)', 'História', 'definicao',
   'Onda de revoluções liberais e nacionalistas que varreu diversos países europeus em 1848, exigindo constituições, direitos civis e, em alguns casos, unificação nacional.',
   NULL, NULL, NULL),

  ('Partilha da África (Conferência de Berlim)', 'História', 'definicao',
   'Reunião de potências europeias em 1884-1885 que estabeleceu regras pra divisão colonial do continente africano, ignorando fronteiras étnicas e culturais locais — origem de muitos conflitos africanos posteriores.',
   NULL, NULL, NULL),

  ('Guerra do Golfo', 'História', 'definicao',
   'Conflito de 1990-1991 em que uma coalizão liderada pelos Estados Unidos expulsou as tropas iraquianas que haviam invadido o Kuwait, sob o comando de Saddam Hussein.',
   NULL, NULL, NULL),

  ('Atentados de 11 de Setembro', 'História', 'definicao',
   'Ataques terroristas de 2001 contra as Torres Gêmeas em Nova York e o Pentágono, promovidos pela Al-Qaeda, que mudaram profundamente a política externa e de segurança dos Estados Unidos e do mundo.',
   NULL, NULL, NULL),

  ('Nelson Mandela', 'História', 'pessoa',
   'Líder político sul-africano, preso por 27 anos por lutar contra o apartheid, tornou-se o primeiro presidente negro da África do Sul (1994), símbolo mundial de reconciliação e luta por direitos civis.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/0/02/Nelson_Mandela_1994.jpg', '1918 – 2013'),

  ('Martin Luther King Jr.', 'História', 'pessoa',
   'Pastor e ativista norte-americano, principal liderança do Movimento dos Direitos Civis nos EUA, defensor da resistência não-violenta, ganhador do Prêmio Nobel da Paz em 1964, assassinado em 1968.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/0/05/Martin_Luther_King%2C_Jr..jpg', '1929 – 1968'),

  ('Che Guevara', 'História', 'pessoa',
   'Revolucionário argentino, uma das principais lideranças da Revolução Cubana ao lado de Fidel Castro, tornou-se um ícone global da luta revolucionária de esquerda.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Che_Guevara%2C_Guerrillero_Heroico.jpg', '1928 – 1967'),

  ('Joana d''Arc', 'História', 'pessoa',
   'Camponesa francesa que, dizendo-se guiada por visões divinas, liderou tropas francesas em vitórias importantes durante a Guerra dos Cem Anos. Capturada e julgada por heresia, foi queimada na fogueira aos 19 anos.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/ce/John_Everett_Millais_-_Joan_of_Arc.jpg', '1412 – 1431'),

  ('Revolução de 1817 (Pernambuco)', 'História', 'definicao',
   'Movimento separatista e republicano em Pernambuco, motivado por insatisfações econômicas e políticas com a Coroa Portuguesa, duramente reprimido após cerca de 75 dias.',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): Geografia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Relevo Brasileiro', 'Geografia', 'definicao',
   'O relevo do Brasil é predominantemente formado por planaltos (cerca de 60% do território) e planícies, sem grandes cadeias montanhosas, já que o país fica numa região tectonicamente estável.',
   NULL, NULL, NULL),

  ('Climas do Brasil', 'Geografia', 'definicao',
   'O Brasil apresenta principalmente clima tropical, mas também equatorial (Amazônia), semiárido (sertão nordestino), tropical de altitude e subtropical (Sul do país).',
   NULL, NULL, NULL),

  ('Aquífero Guarani', 'Geografia', 'definicao',
   'Um dos maiores reservatórios de água doce subterrânea do mundo, localizado sob território de Brasil, Argentina, Paraguai e Uruguai, importante fonte estratégica de água.',
   NULL, NULL, NULL),

  ('Setores da Economia', 'Geografia', 'definicao',
   'Setor primário (extração de recursos naturais, agropecuária), setor secundário (indústria, transformação) e setor terciário (serviços, comércio) — divisão clássica das atividades econômicas.',
   NULL, NULL, NULL),

  ('PIB (Produto Interno Bruto)', 'Geografia', 'definicao',
   'Soma de todos os bens e serviços produzidos num país durante um período, um dos principais indicadores usados pra medir o tamanho de uma economia.',
   NULL, NULL, NULL),

  ('Balança Comercial', 'Geografia', 'definicao',
   'Diferença entre o valor das exportações e importações de um país num determinado período — superávit quando exporta mais do que importa, déficit no caso contrário.',
   NULL, NULL, NULL),

  ('Gentrificação', 'Geografia', 'definicao',
   'Processo de valorização de uma área urbana antes popular ou degradada, que acaba expulsando os moradores originais de baixa renda pra dar lugar a uma população de maior poder aquisitivo.',
   NULL, NULL, NULL),

  ('Conurbação e Metropolização', 'Geografia', 'definicao',
   'Conurbação é a fusão física de duas ou mais cidades vizinhas que crescem até se tocarem; metropolização é o processo de formação de uma grande região metropolitana ao redor de uma cidade polo.',
   NULL, NULL, NULL),

  ('Rede Urbana e Hierarquia Urbana', 'Geografia', 'definicao',
   'Conjunto de cidades de uma região e as relações econômicas e de influência entre elas, organizadas hierarquicamente conforme o porte e a importância de cada centro urbano.',
   NULL, NULL, NULL),

  ('Latifúndio e Minifúndio', 'Geografia', 'definicao',
   'Latifúndio é uma propriedade rural de grande extensão, muitas vezes subutilizada; minifúndio é uma propriedade pequena, geralmente insuficiente pra sustentar uma família com produção comercial.',
   NULL, NULL, NULL),

  ('Extrativismo', 'Geografia', 'definicao',
   'Atividade econômica baseada na coleta ou extração direta de recursos naturais, sem cultivo ou criação — pode ser vegetal (látex, castanha), animal (pesca) ou mineral (minério, petróleo).',
   NULL, NULL, NULL),

  ('Mineração no Brasil', 'Geografia', 'definicao',
   'Atividade econômica de extração de minerais, historicamente concentrada em Minas Gerais (ouro, minério de ferro) e hoje também forte no Norte do país (Carajás, no Pará).',
   NULL, NULL, NULL),

  ('Combustíveis Fósseis', 'Geografia', 'definicao',
   'Fontes de energia não-renováveis formadas ao longo de milhões de anos a partir de matéria orgânica em decomposição, como petróleo, carvão mineral e gás natural — principais responsáveis pelo aumento do efeito estufa.',
   NULL, NULL, NULL),

  ('Desenvolvimento Sustentável', 'Geografia', 'definicao',
   'Modelo de desenvolvimento que busca atender as necessidades do presente sem comprometer a capacidade das futuras gerações de atender suas próprias necessidades, equilibrando economia, sociedade e meio ambiente.',
   NULL, NULL, NULL),

  ('Acordo de Paris', 'Geografia', 'definicao',
   'Tratado internacional de 2015 no qual países se comprometeram a limitar o aquecimento global a bem abaixo de 2°C em relação aos níveis pré-industriais, reduzindo emissões de gases de efeito estufa.',
   NULL, NULL, NULL),

  ('Fronteiras Políticas', 'Geografia', 'definicao',
   'Limites que delimitam o território de um Estado, podendo ser naturais (rios, montanhas) ou artificiais (linhas retas definidas por tratados), muitas vezes fonte de conflitos internacionais.',
   NULL, NULL, NULL),

  ('Estado, Nação e Território', 'Geografia', 'definicao',
   'Estado é a organização político-jurídica com governo e soberania; nação é um grupo unido por identidade cultural, histórica ou linguística; território é o espaço geográfico delimitado sobre o qual um Estado exerce soberania.',
   NULL, NULL, NULL),

  ('Inflação', 'Geografia', 'definicao',
   'Aumento generalizado e contínuo dos preços de bens e serviços numa economia, reduzindo o poder de compra da moeda ao longo do tempo.',
   NULL, NULL, NULL),

  ('Cartografia (Projeções Cartográficas)', 'Geografia', 'definicao',
   'Ciência de representar a superfície curva da Terra num mapa plano, processo que sempre gera alguma distorção — diferentes projeções (Mercator, Peters) priorizam preservar diferentes aspectos (forma, área, distância).',
   NULL, NULL, NULL),

  ('Litoral e Erosão Costeira', 'Geografia', 'definicao',
   'O litoral é a faixa de transição entre o continente e o oceano; a erosão costeira é o desgaste progressivo dessa faixa pela ação das ondas, correntes e, cada vez mais, pela elevação do nível do mar.',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Quarto bloco (20 por matéria): Inglês
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Too / Enough', 'Inglês', 'definicao',
   '"Too" indica excesso (antes do adjetivo); "enough" indica suficiência (depois do adjetivo, antes do substantivo).',
   '"This coffee is too hot." / "I don''t have enough time."', NULL, NULL),

  ('So / Such', 'Inglês', 'definicao',
   '"So" é usado antes de adjetivo ou advérbio sozinho; "such" é usado antes de um substantivo (com ou sem adjetivo).',
   '"It was so difficult." / "It was such a difficult test."', NULL, NULL),

  ('Either / Neither / Both', 'Inglês', 'definicao',
   '"Either" (um ou outro, afirmativo), "neither" (nenhum dos dois, negativo) e "both" (os dois) são usados pra falar de duas opções ou pessoas.',
   '"You can take either option." / "Neither of them came." / "Both are correct."', NULL, NULL),

  ('Stative Verbs', 'Inglês', 'definicao',
   'Verbos que descrevem estados, não ações (like, know, believe, want, own), geralmente não usados na forma contínua (-ing).',
   '"I know the answer" (não "I am knowing the answer").', NULL, NULL),

  ('Ellipsis (Omission in English)', 'Inglês', 'definicao',
   'Omissão de palavras numa frase quando o sentido pode ser entendido pelo contexto, comum em respostas curtas e conversas informais.',
   '"Are you coming?" "Yes, I am [coming]."', NULL, NULL),

  ('Cohesion and Coherence', 'Inglês', 'definicao',
   'Coesão é a conexão gramatical entre frases (usando conectores, pronomes); coerência é a lógica e o sentido geral do texto como um todo — os dois juntos fazem um texto fluir bem.',
   NULL, NULL, NULL),

  ('Topic Sentence', 'Inglês', 'definicao',
   'Frase que resume a ideia principal de um parágrafo, geralmente localizada no início dele, orientando o leitor sobre o que virá a seguir.',
   NULL, NULL, NULL),

  ('Modals of Deduction and Probability', 'Inglês', 'definicao',
   'Uso de modal verbs pra expressar graus de certeza sobre uma situação: "must" (quase certeza), "might/may/could" (possibilidade), "can''t" (quase impossível).',
   '"She must be tired." (deve estar) / "It might rain." (pode ser que chova)', NULL, NULL),

  ('Reflexive Pronouns', 'Inglês', 'definicao',
   'Pronomes que indicam que o sujeito pratica e recebe a ação ao mesmo tempo: myself, yourself, himself, herself, itself, ourselves, yourselves, themselves.',
   '"I hurt myself." (Eu me machuquei.)', NULL, NULL),

  ('Demonstrative Pronouns', 'Inglês', 'definicao',
   'Pronomes usados pra indicar proximidade ou distância de algo: "this/these" (perto), "that/those" (longe).',
   '"This is my book." / "Those are her shoes."', NULL, NULL),

  ('Verb + Preposition Collocations', 'Inglês', 'definicao',
   'Combinações fixas entre verbos e preposições específicas, que não seguem uma regra lógica e precisam ser memorizadas.',
   '"Depend on", "listen to", "look for", "wait for".', NULL, NULL),

  ('Collocations', 'Inglês', 'definicao',
   'Combinações de palavras que costumam aparecer juntas naturalmente na língua, mesmo sem uma regra gramatical explícita.',
   '"Make a decision" (não "do a decision"); "heavy rain" (não "strong rain").', NULL, NULL),

  ('Synonyms and Antonyms', 'Inglês', 'definicao',
   'Sinônimos são palavras com significado semelhante; antônimos são palavras com significado oposto — ambos muito cobrados em questões de vocabulário e interpretação de texto.',
   '"Happy" (sinônimo: glad; antônimo: sad).', NULL, NULL),

  ('British vs American English', 'Inglês', 'definicao',
   'Diferenças de vocabulário, ortografia e, às vezes, gramática entre o inglês britânico e o americano.',
   '"Colour" (BrE) vs "color" (AmE); "flat" (BrE) vs "apartment" (AmE).', NULL, NULL),

  ('Zero Conditional', 'Inglês', 'definicao',
   'Usado pra fatos gerais e verdades sempre válidas: If + Simple Present, Simple Present.',
   '"If you heat water to 100°C, it boils."', NULL, NULL),

  ('First Conditional', 'Inglês', 'definicao',
   'Usado pra situações futuras reais e prováveis: If + Simple Present, will + verbo.',
   '"If it rains, I will stay home."', NULL, NULL),

  ('Second Conditional', 'Inglês', 'definicao',
   'Usado pra situações hipotéticas ou improváveis no presente/futuro: If + Simple Past, would + verbo.',
   '"If I had more money, I would travel the world."', NULL, NULL),

  ('Third Conditional', 'Inglês', 'definicao',
   'Usado pra situações hipotéticas no passado que não aconteceram (arrependimento/especulação): If + Past Perfect, would have + particípio.',
   '"If I had studied more, I would have passed the exam."', NULL, NULL),

  ('Time Clauses', 'Inglês', 'definicao',
   'Orações que indicam quando uma ação acontece, introduzidas por conectores como "when", "while", "as soon as", "before", "after".',
   '"I will call you as soon as I arrive."', NULL, NULL),

  ('Purpose Clauses', 'Inglês', 'definicao',
   'Orações que indicam a finalidade de uma ação, introduzidas por expressões como "so that" e "in order to".',
   '"She studies hard in order to pass the exam."', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Redação: pensadores/filósofos/sociólogos com frase de efeito pra repertório
-- sociocultural, formato definido por Paulo — definition = a frase entre
-- aspas, examples = explicação da frase, extra_info = datas.
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Jean-Paul Sartre', 'Redação', 'pessoa',
   '1. "O homem está condenado a ser livre."
Pra Sartre, existimos antes de termos uma essência definida — por isso somos totalmente responsáveis pelas escolhas que fazemos, sem poder recorrer a destino, natureza ou Deus pra justificar nossos atos. Essa frase é ótima em redações sobre autonomia, responsabilidade individual e liberdade de escolha.

2. "A existência precede a essência."
Frase-chave do existencialismo: pra Sartre, o ser humano primeiro existe, e só depois, através de suas escolhas e ações, define quem é — não nascemos com um propósito ou natureza fixa. Complementa bem repertórios sobre identidade, autoconstrução e liberdade de escolha.',
   NULL,
   'https://upload.wikimedia.org/wikipedia/commons/7/71/Jean_Paul_Sartre_1967.jpg', '1905 – 1980'),

  ('Zygmunt Bauman', 'Redação', 'pessoa',
   '1. "Numa sociedade de consumidores, ninguém pode se tornar sujeito sem antes se tornar mercadoria."
Bauman, criador do conceito de "modernidade líquida", argumenta que na sociedade de consumo até as pessoas passam a se relacionar e se valorizar como produtos — moldando-se pra serem "consumidas" (curtidas, aceitas, desejadas). Excelente repertório pra redações sobre consumismo, redes sociais e relações humanas líquidas.

2. "A identidade só nos é revelada como algo a ser inventado, não descoberto."
Bauman argumenta que, na modernidade líquida, a identidade deixou de ser algo fixo e dado (como classe social ou profissão herdada) e passou a ser um projeto constante que cada pessoa precisa construir e reconstruir ao longo da vida. Repertório rico pra redações sobre identidade, redes sociais e pressão por reinvenção constante.',
   NULL,
   'https://upload.wikimedia.org/wikipedia/commons/6/65/Zygmunt_Bauman.jpg', '1925 – 2017'),

  ('Paulo Freire', 'Redação', 'pessoa',
   '1. "Ninguém educa ninguém, ninguém se educa a si mesmo, os homens se educam entre si, mediatizados pelo mundo."
Freire critica a educação tradicional (em que o professor apenas "deposita" conhecimento no aluno) e defende uma educação dialógica, em que professor e aluno aprendem juntos a partir da realidade que os cerca. Repertório certeiro pra redações sobre educação, ensino público e o papel da escola na sociedade.

2. "A leitura do mundo precede a leitura da palavra."
Freire defende que a alfabetização de verdade vai além de decodificar letras — passa por entender criticamente o mundo ao redor antes mesmo de aprender a ler formalmente. Repertório muito citado em redações sobre educação, letramento e leitura crítica da realidade.',
   NULL,
   'https://upload.wikimedia.org/wikipedia/commons/b/be/Paulo_Freire_1977.jpg', '1921 – 1997'),

  ('Simone de Beauvoir', 'Redação', 'pessoa',
   '1. "Ninguém nasce mulher: torna-se mulher."
Em "O Segundo Sexo", Beauvoir argumenta que ser mulher não é um destino biológico, mas uma construção social — os papéis, comportamentos e expectativas atribuídos às mulheres são criados pela cultura, não pela natureza. Repertório essencial pra redações sobre igualdade de gênero e papéis sociais.

2. "A humanidade é masculina, e o homem define a mulher não em si mesma, mas relativamente a ele."
Em "O Segundo Sexo", Beauvoir descreve como a sociedade historicamente trata o homem como o "padrão" universal e a mulher como o "Outro", definida sempre em relação a ele — nunca como sujeito independente. Complementa bem repertórios sobre desigualdade de gênero e representatividade.',
   NULL,
   'https://upload.wikimedia.org/wikipedia/commons/3/39/Simone_de_Beauvoir_1955.jpg', '1908 – 1986'),

  ('Karl Marx', 'Redação', 'pessoa',
   '1. "A história de todas as sociedades até hoje existentes é a história da luta de classes."
No "Manifesto Comunista" (escrito com Friedrich Engels), Marx argumenta que todo conflito social ao longo da história tem raiz na disputa entre grupos com interesses econômicos opostos — quem detém os meios de produção e quem vende sua força de trabalho. Repertório clássico pra redações sobre desigualdade social e distribuição de renda.

2. "Os filósofos apenas interpretaram o mundo de diferentes maneiras; a questão, porém, é transformá-lo."
Na 11ª Tese sobre Feuerbach, Marx defende que não basta entender ou explicar os problemas do mundo — o papel da filosofia (e da ação política) é efetivamente transformar a realidade social. Repertório poderoso pra redações que pedem propostas de intervenção, não só diagnóstico do problema.',
   NULL,
   'https://upload.wikimedia.org/wikipedia/commons/f/fc/Karl_Marx.jpg', '1818 – 1883')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): Biologia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Seleção Natural', 'Biologia', 'definicao',
   'Mecanismo evolutivo proposto por Darwin em que indivíduos com características mais vantajosas pro ambiente têm maior chance de sobreviver e se reproduzir, passando essas características adiante.',
   'Mariposas de cor escura se tornaram mais comuns em áreas poluídas da Inglaterra, por serem mais bem camufladas contra predadores.', NULL, NULL),

  ('Relações Ecológicas', 'Biologia', 'definicao',
   'Interações entre organismos de um ecossistema: predatismo (uma espécie caça outra), mutualismo (ambas se beneficiam), comensalismo (uma se beneficia sem prejudicar a outra) e competição (disputa por recursos).',
   NULL, NULL, NULL),

  ('Síndrome de Down', 'Biologia', 'definicao',
   'Condição genética causada pela presença de uma cópia extra do cromossomo 21 (trissomia do 21), resultando em características físicas específicas e algum grau de deficiência intelectual.',
   NULL, NULL, NULL),

  ('Sistema Linfático', 'Biologia', 'definicao',
   'Rede de vasos, gânglios e órgãos (como o baço) que coleta o excesso de líquido dos tecidos, produz células de defesa e ajuda no combate a infecções, trabalhando junto com o sistema imunológico.',
   NULL, NULL, NULL),

  ('Sistema Tegumentar (Pele)', 'Biologia', 'definicao',
   'Maior órgão do corpo humano, formado pela pele e seus anexos (pelos, unhas, glândulas), responsável por proteção, regulação da temperatura corporal e percepção sensorial.',
   NULL, NULL, NULL),

  ('Vetores de Doenças', 'Biologia', 'definicao',
   'Organismos (geralmente insetos) que transmitem agentes causadores de doenças de um hospedeiro pra outro.',
   'O mosquito Aedes aegypti é vetor de dengue, zika e chikungunya.', NULL, NULL),

  ('Clonagem', 'Biologia', 'definicao',
   'Técnica de reprodução assexuada artificial que gera um organismo geneticamente idêntico a outro já existente, a partir de uma célula do organismo original.',
   'A ovelha Dolly, em 1996, foi o primeiro mamífero clonado a partir de uma célula adulta.', NULL, NULL),

  ('CRISPR (Edição Genética)', 'Biologia', 'definicao',
   'Tecnologia de edição genética que permite cortar e modificar sequências específicas de DNA com alta precisão, com potencial pra tratar doenças genéticas e revolucionar a biotecnologia.',
   NULL, NULL, NULL),

  ('Polinização', 'Biologia', 'definicao',
   'Transferência de grãos de pólen da parte masculina pra a parte feminina de uma flor, etapa essencial da reprodução das angiospermas, frequentemente feita por animais polinizadores.',
   'Abelhas são os principais agentes polinizadores, essenciais também pra agricultura.', NULL, NULL),

  ('Transpiração Vegetal', 'Biologia', 'definicao',
   'Perda de água na forma de vapor pelas plantas, principalmente através dos estômatos nas folhas, processo que ajuda a puxar água e nutrientes das raízes até o topo da planta.',
   NULL, NULL, NULL),

  ('Origem da Vida (Abiogênese)', 'Biologia', 'definicao',
   'Conjunto de hipóteses sobre como a vida surgiu na Terra a partir de matéria não viva, incluindo a teoria da evolução química proposta por Oparin e Haldane.',
   NULL, NULL, NULL),

  ('Taxonomia', 'Biologia', 'definicao',
   'Ciência de classificar os seres vivos em categorias hierárquicas (reino, filo, classe, ordem, família, gênero, espécie) com base em suas características e parentesco evolutivo.',
   NULL, NULL, NULL),

  ('Biodiversidade', 'Biologia', 'definicao',
   'Variedade de formas de vida existentes num ecossistema ou no planeta, incluindo diversidade genética, de espécies e de ecossistemas — essencial pro equilíbrio ambiental.',
   NULL, NULL, NULL),

  ('Extinção de Espécies', 'Biologia', 'definicao',
   'Desaparecimento completo de uma espécie, seja por causas naturais (mudanças climáticas antigas) ou por ação humana (destruição de habitat, caça, poluição).',
   NULL, NULL, NULL),

  ('Simbiose', 'Biologia', 'definicao',
   'Relação ecológica íntima e duradoura entre organismos de espécies diferentes, podendo ser mutualística (ambos se beneficiam), comensalista ou parasitária.',
   'Líquens são resultado de simbiose entre fungos e algas ou cianobactérias.', NULL, NULL),

  ('Placenta e Gestação', 'Biologia', 'definicao',
   'A placenta é o órgão que conecta o embrião/feto à mãe durante a gestação, permitindo trocas de nutrientes, gases e resíduos entre os dois organismos.',
   NULL, NULL, NULL),

  ('Albinismo', 'Biologia', 'definicao',
   'Condição genética recessiva que causa a ausência ou redução da produção de melanina, resultando em pele, cabelo e olhos muito claros e maior sensibilidade à luz solar.',
   NULL, NULL, NULL),

  ('Biorremediação', 'Biologia', 'definicao',
   'Uso de organismos vivos (geralmente microrganismos) pra degradar ou remover poluentes do ambiente, como derramamentos de petróleo ou metais pesados no solo.',
   NULL, NULL, NULL),

  ('Regeneração e Cicatrização', 'Biologia', 'definicao',
   'Processos biológicos de reparo de tecidos lesionados: cicatrização forma um novo tecido (às vezes com cicatriz); regeneração recompõe o tecido original, capacidade mais limitada em humanos do que em outros animais.',
   NULL, NULL, NULL),

  ('James Watson e Francis Crick', 'Biologia', 'pessoa',
   'Cientistas que, em 1953, descreveram a estrutura em dupla-hélice do DNA, usando dados de difração de raios-X obtidos por Rosalind Franklin — uma das descobertas mais importantes da biologia moderna.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/7/74/James_D_Watson_and_Francis_Crick.jpg', 'Prêmio Nobel de Medicina em 1962')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): Química
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Lei de Hess', 'Química', 'definicao',
   'A variação de entalpia de uma reação química depende apenas dos estados inicial e final, não do caminho percorrido — permite calcular a entalpia de reações somando etapas intermediárias conhecidas.',
   NULL, NULL, NULL),

  ('Indicadores Ácido-Base', 'Química', 'definicao',
   'Substâncias que mudam de cor conforme o pH do meio, usadas pra identificar se uma solução é ácida, neutra ou básica.',
   'A fenolftaleína fica rosa em meio básico e incolor em meio ácido/neutro.', NULL, NULL),

  ('Chuva Ácida', 'Química', 'definicao',
   'Precipitação com pH anormalmente baixo, causada pela reação de gases poluentes (como óxidos de enxofre e nitrogênio, emitidos por indústrias e veículos) com a água da atmosfera.',
   NULL, NULL, NULL),

  ('Volumetria', 'Química', 'definicao',
   'Técnica analítica que determina a concentração de uma solução medindo o volume de outra solução (de concentração conhecida) necessário pra reagir completamente com ela.',
   NULL, NULL, NULL),

  ('Soluções Saturadas, Insaturadas e Supersaturadas', 'Química', 'definicao',
   'Insaturada tem menos soluto do que o solvente consegue dissolver; saturada está no limite máximo de dissolução; supersaturada tem mais soluto dissolvido do que o normalmente possível, em estado instável.',
   NULL, NULL, NULL),

  ('Coloides', 'Química', 'definicao',
   'Misturas heterogêneas em que partículas pequenas (maiores que numa solução, menores que numa suspensão) ficam dispersas num meio, sem se depositar facilmente.',
   'Leite, maionese e neblina são exemplos de coloides.', NULL, NULL),

  ('Substâncias Puras e Misturas', 'Química', 'definicao',
   'Substância pura tem composição química fixa e definida (água, ouro); mistura é a combinação de duas ou mais substâncias puras, podendo ser homogênea ou heterogênea.',
   NULL, NULL, NULL),

  ('Métodos de Separação de Misturas', 'Química', 'definicao',
   'Técnicas usadas pra separar os componentes de uma mistura, como filtração, decantação, destilação e centrifugação, escolhidas conforme as propriedades físicas dos componentes.',
   NULL, NULL, NULL),

  ('Polaridade das Moléculas', 'Química', 'definicao',
   'Moléculas polares têm distribuição desigual de cargas elétricas (como a água); moléculas apolares têm distribuição uniforme — essa propriedade determina solubilidade e outras interações.',
   'Substâncias polares se dissolvem bem em solventes polares ("semelhante dissolve semelhante").', NULL, NULL),

  ('Geometria Molecular', 'Química', 'definicao',
   'Forma tridimensional que uma molécula assume no espaço, determinada pela repulsão entre os pares de elétrons ao redor do átomo central, influenciando propriedades físicas e químicas.',
   NULL, NULL, NULL),

  ('Hibridização do Carbono', 'Química', 'definicao',
   'Fenômeno em que os orbitais do átomo de carbono se combinam de formas diferentes (sp3, sp2, sp), determinando o tipo de ligação (simples, dupla, tripla) e a geometria da molécula orgânica.',
   NULL, NULL, NULL),

  ('Reações de Síntese, Análise e Troca', 'Química', 'definicao',
   'Síntese: dois ou mais reagentes formam um único produto. Análise: um reagente se decompõe em dois ou mais produtos. Troca (simples ou dupla): elementos ou grupos trocam de posição entre os reagentes.',
   NULL, NULL, NULL),

  ('Balanceamento de Equações Químicas', 'Química', 'definicao',
   'Ajuste dos coeficientes numa equação química pra garantir que o número de átomos de cada elemento seja igual nos reagentes e nos produtos, respeitando a Lei da Conservação das Massas.',
   NULL, NULL, NULL),

  ('Rendimento e Pureza de Reação', 'Química', 'definicao',
   'Rendimento é a proporção entre a quantidade de produto realmente obtida e a quantidade teoricamente esperada numa reação; pureza indica o quanto de uma amostra é composta pela substância desejada, sem impurezas.',
   NULL, NULL, NULL),

  ('Química Verde', 'Química', 'definicao',
   'Conjunto de princípios que buscam desenvolver processos químicos mais sustentáveis, reduzindo o uso de substâncias tóxicas, resíduos e consumo de energia.',
   NULL, NULL, NULL),

  ('Sabões e Detergentes', 'Química', 'definicao',
   'Substâncias com uma parte polar (afinidade com água) e uma parte apolar (afinidade com gordura), que permitem remover sujeira ao formar micelas ao redor das partículas de gordura.',
   NULL, NULL, NULL),

  ('Amido e Celulose', 'Química', 'definicao',
   'Carboidratos complexos (polissacarídeos) formados por unidades de glicose: amido é reserva energética em plantas (e alimento pra humanos); celulose forma a parede celular vegetal e não é digerível por humanos.',
   NULL, NULL, NULL),

  ('Proteínas (Aminoácidos)', 'Química', 'definicao',
   'Macromoléculas formadas por sequências de aminoácidos unidos por ligações peptídicas, essenciais pra estrutura celular, enzimas, hormônios e defesa do organismo.',
   NULL, NULL, NULL),

  ('Amedeo Avogadro', 'Química', 'pessoa',
   'Físico e químico italiano que propôs a hipótese de que volumes iguais de gases diferentes, nas mesmas condições de temperatura e pressão, contêm o mesmo número de moléculas — base do conceito de mol e do Número de Avogadro.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Avogadro_Amedeo.jpg', '1776 – 1856'),

  ('Linus Pauling', 'Química', 'pessoa',
   'Químico americano que desenvolveu a escala de eletronegatividade dos elementos e o diagrama de distribuição eletrônica usado até hoje. Único a ganhar dois Prêmios Nobel individuais (Química, 1954, e Paz, 1962).',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Linus_Pauling_1962.jpg', '1901 – 1994')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): Física
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Queda Livre', 'Física', 'definicao',
   'Movimento de um corpo sujeito apenas à ação da gravidade, sem resistência do ar, com aceleração constante (aproximadamente 9,8 m/s² na Terra).',
   NULL, NULL, NULL),

  ('Lançamento Vertical', 'Física', 'definicao',
   'Movimento de um corpo lançado pra cima (ou pra baixo) verticalmente, sujeito apenas à aceleração da gravidade, desacelerando na subida e acelerando na descida.',
   NULL, NULL, NULL),

  ('Intensidade de Corrente Elétrica', 'Física', 'definicao',
   'Quantidade de carga elétrica que atravessa um condutor por unidade de tempo, medida em ampères (A).',
   NULL, NULL, NULL),

  ('Capacitores', 'Física', 'definicao',
   'Componentes elétricos capazes de armazenar energia na forma de campo elétrico, formados por duas placas condutoras separadas por um material isolante.',
   NULL, NULL, NULL),

  ('Máquinas Simples', 'Física', 'definicao',
   'Dispositivos mecânicos básicos (alavancas, polias, planos inclinados, roldanas) que multiplicam ou redirecionam uma força, facilitando a realização de trabalho mecânico.',
   NULL, NULL, NULL),

  ('Centro de Massa', 'Física', 'definicao',
   'Ponto onde se considera concentrada toda a massa de um corpo ou sistema pra fins de análise do seu movimento, podendo estar fora do corpo em objetos de formato irregular.',
   NULL, NULL, NULL),

  ('Momento Angular', 'Física', 'definicao',
   'Grandeza que mede a quantidade de rotação de um corpo, dependente de sua massa, velocidade e distância ao eixo de rotação — se conserva na ausência de forças externas (torques).',
   'Uma patinadora gira mais rápido quando encolhe os braços, conservando o momento angular.', NULL, NULL),

  ('Difração e Interferência', 'Física', 'definicao',
   'Difração é o desvio de ondas ao passar por uma fenda ou obstáculo; interferência é a sobreposição de duas ou mais ondas, que pode ser construtiva (se reforçam) ou destrutiva (se cancelam).',
   NULL, NULL, NULL),

  ('Polarização da Luz', 'Física', 'definicao',
   'Fenômeno em que as ondas de luz, que normalmente vibram em várias direções, passam a vibrar numa única direção, usado em óculos de sol polarizados e telas de LCD.',
   NULL, NULL, NULL),

  ('Decibéis (Intensidade Sonora)', 'Física', 'definicao',
   'Unidade logarítmica usada pra medir a intensidade (volume) do som, já que o ouvido humano percebe variações de intensidade sonora numa escala não linear.',
   NULL, NULL, NULL),

  ('Meia-Vida Radioativa', 'Física', 'definicao',
   'Tempo necessário pra que metade dos átomos de uma amostra radioativa se desintegre, uma constante característica de cada elemento radioativo.',
   NULL, NULL, NULL),

  ('Datação por Carbono-14', 'Física', 'definicao',
   'Método que usa a meia-vida do carbono-14 (cerca de 5.730 anos) pra estimar a idade de materiais orgânicos, muito usado em arqueologia e paleontologia.',
   NULL, NULL, NULL),

  ('Ultrassom e Aplicações', 'Física', 'definicao',
   'Ondas sonoras com frequência acima da audível pelo ser humano (acima de 20.000 Hz), usadas em exames médicos (ultrassonografia), sonares e limpeza de precisão.',
   NULL, NULL, NULL),

  ('Energia Solar Fotovoltaica', 'Física', 'definicao',
   'Tecnologia que converte luz solar diretamente em energia elétrica através do efeito fotoelétrico em células semicondutoras (painéis solares).',
   NULL, NULL, NULL),

  ('Motor Elétrico', 'Física', 'definicao',
   'Dispositivo que converte energia elétrica em energia mecânica (movimento rotativo), usando a interação entre campos magnéticos e correntes elétricas.',
   NULL, NULL, NULL),

  ('Gerador Elétrico', 'Física', 'definicao',
   'Dispositivo que converte energia mecânica em energia elétrica através da indução eletromagnética — o processo inverso do motor elétrico.',
   NULL, NULL, NULL),

  ('Lei de Coulomb', 'Física', 'definicao',
   'Lei que descreve a força elétrica entre duas cargas pontuais: proporcional ao produto das cargas e inversamente proporcional ao quadrado da distância entre elas.',
   NULL, NULL, NULL),

  ('Amperímetro e Voltímetro', 'Física', 'definicao',
   'Amperímetro mede a intensidade de corrente elétrica (ligado em série no circuito); voltímetro mede a diferença de potencial/tensão (ligado em paralelo).',
   NULL, NULL, NULL),

  ('Werner Heisenberg', 'Física', 'pessoa',
   'Físico alemão, um dos fundadores da mecânica quântica, formulou o Princípio da Incerteza: é impossível conhecer simultaneamente, com precisão absoluta, a posição e a velocidade de uma partícula subatômica.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Bundesarchiv_Bild183-R57262%2C_Werner_Heisenberg_crop.jpg', '1901 – 1976'),

  ('Enrico Fermi', 'Física', 'pessoa',
   'Físico ítalo-americano que construiu o primeiro reator nuclear do mundo e contribuiu decisivamente pra física nuclear e de partículas, sendo uma figura central no Projeto Manhattan.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Enrico_Fermi_1943-49.jpg', '1901 – 1954')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): Matemática
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Lei dos Senos', 'Matemática', 'definicao',
   'Em qualquer triângulo, a razão entre um lado e o seno do ângulo oposto a ele é constante — usada pra resolver triângulos que não são retângulos.',
   NULL, NULL, NULL),

  ('Lei dos Cossenos', 'Matemática', 'definicao',
   'Generalização do Teorema de Pitágoras pra qualquer triângulo: o quadrado de um lado é igual à soma dos quadrados dos outros dois, menos duas vezes o produto deles pelo cosseno do ângulo entre eles.',
   NULL, NULL, NULL),

  ('Produtos Notáveis', 'Matemática', 'definicao',
   'Multiplicações algébricas que seguem padrões fixos, como o quadrado da soma (a+b)² = a² + 2ab + b² e a diferença de quadrados (a+b)(a-b) = a² - b².',
   NULL, NULL, NULL),

  ('Fatoração de Expressões Algébricas', 'Matemática', 'definicao',
   'Processo de reescrever uma expressão algébrica como um produto de fatores mais simples, útil pra simplificar expressões e resolver equações.',
   'x² - 9 pode ser fatorado como (x+3)(x-3).', NULL, NULL),

  ('Equações Biquadradas', 'Matemática', 'definicao',
   'Equações do tipo ax⁴ + bx² + c = 0, resolvidas fazendo uma substituição (y = x²) pra transformá-las numa equação do 2º grau comum.',
   NULL, NULL, NULL),

  ('Funções Definidas por Partes', 'Matemática', 'definicao',
   'Funções que têm regras diferentes de cálculo dependendo do intervalo em que a variável de entrada se encontra.',
   'A tabela de imposto de renda progressivo é um exemplo de função definida por partes.', NULL, NULL),

  ('Interpolação Aritmética e Geométrica', 'Matemática', 'definicao',
   'Técnica de inserir termos entre dois números dados, formando uma PA ou PG completa entre eles.',
   NULL, NULL, NULL),

  ('Probabilidade Condicional', 'Matemática', 'definicao',
   'Probabilidade de um evento ocorrer, dado que outro evento já ocorreu, alterando o espaço de possibilidades considerado.',
   NULL, NULL, NULL),

  ('Regra de Sarrus', 'Matemática', 'definicao',
   'Método prático pra calcular o determinante de uma matriz 3x3, repetindo as duas primeiras colunas ao lado da matriz e somando/subtraindo os produtos das diagonais.',
   NULL, NULL, NULL),

  ('Sistema Sexagesimal', 'Matemática', 'definicao',
   'Sistema de medida de ângulos e tempo baseado no número 60: cada grau tem 60 minutos, e cada minuto tem 60 segundos.',
   NULL, NULL, NULL),

  ('Poliedros de Platão', 'Matemática', 'definicao',
   'Os 5 poliedros regulares convexos (tetraedro, cubo, octaedro, dodecaedro, icosaedro), em que todas as faces são polígonos regulares idênticos.',
   NULL, NULL, NULL),

  ('Tronco de Pirâmide e Cone', 'Matemática', 'definicao',
   'Sólidos obtidos ao cortar uma pirâmide ou cone por um plano paralelo à base, removendo a parte superior (o "vértice").',
   NULL, NULL, NULL),

  ('Inscrição e Circunscrição de Polígonos', 'Matemática', 'definicao',
   'Um polígono está inscrito numa circunferência quando todos os seus vértices tocam a circunferência; está circunscrito quando todos os seus lados tangenciam a circunferência.',
   NULL, NULL, NULL),

  ('Módulo de um Número', 'Matemática', 'definicao',
   'Valor absoluto de um número, ou seja, sua distância até o zero na reta numérica, sempre um valor não negativo. Representado por |x|.',
   NULL, NULL, NULL),

  ('Expressões Numéricas', 'Matemática', 'definicao',
   'Sequências de operações matemáticas que devem seguir uma ordem específica pra serem resolvidas: primeiro parênteses/colchetes, depois potenciação/radiciação, depois multiplicação/divisão, por fim adição/subtração.',
   NULL, NULL, NULL),

  ('Unidades de Medida e Conversões', 'Matemática', 'definicao',
   'Sistema de transformar uma grandeza de uma unidade pra outra (metros pra centímetros, litros pra mililitros), usando fatores de conversão fixos.',
   NULL, NULL, NULL),

  ('Escala (Mapas e Maquetes)', 'Matemática', 'definicao',
   'Relação matemática entre uma medida representada (num mapa, planta ou maquete) e a medida real correspondente.',
   NULL, NULL, NULL),

  ('Sequências e Padrões Numéricos', 'Matemática', 'definicao',
   'Listas ordenadas de números que seguem uma regra ou padrão lógico, base pra identificar PAs, PGs e outras sequências matemáticas mais complexas.',
   NULL, NULL, NULL),

  ('Tales de Mileto', 'Matemática', 'pessoa',
   'Filósofo e matemático grego considerado um dos primeiros cientistas da história, criador do teorema que leva seu nome, sobre proporcionalidade entre segmentos formados por retas paralelas.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/45/Thales.jpg', 'Cerca de 624 a.C. – 546 a.C.'),

  ('Al-Khwarizmi', 'Matemática', 'pessoa',
   'Matemático persa considerado o "pai da álgebra" — a própria palavra "álgebra" vem do título de sua obra. A palavra "algoritmo" deriva de seu nome.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Al-Khwarizmi_portrait.jpg', 'Cerca de 780 – 850')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): História
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Independência dos Estados Unidos', 'História', 'definicao',
   'Processo que culminou na Declaração de Independência de 1776, libertando as 13 colônias britânicas na América do Norte e criando os Estados Unidos, fortemente influenciado pelos ideais iluministas.',
   NULL, NULL, NULL),

  ('Revolução Chinesa (1949)', 'História', 'definicao',
   'Movimento liderado por Mao Tsé-Tung e o Partido Comunista Chinês que derrotou os nacionalistas na guerra civil chinesa e instaurou a República Popular da China, regime socialista até hoje.',
   NULL, NULL, NULL),

  ('Era Meiji (Japão)', 'História', 'definicao',
   'Período (1868-1912) de rápida modernização e industrialização do Japão, que abandonou o isolamento feudal e se tornou uma potência mundial em poucas décadas.',
   NULL, NULL, NULL),

  ('Neocolonialismo', 'História', 'definicao',
   'Forma de dominação econômica e política exercida por potências sobre países pobres sem controle territorial direto, através de dívidas, dependência comercial e influência política.',
   NULL, NULL, NULL),

  ('Guerra da Coreia', 'História', 'definicao',
   'Conflito (1950-1953) entre a Coreia do Norte (comunista, apoiada por China e URSS) e a Coreia do Sul (apoiada pelos EUA e ONU), que terminou num armistício e na divisão da península que persiste até hoje.',
   NULL, NULL, NULL),

  ('Ditadura Militar Argentina', 'História', 'definicao',
   'Regime autoritário na Argentina (1976-1983), conhecido como "Guerra Suja", marcado por perseguição, tortura e desaparecimento de milhares de opositores políticos.',
   NULL, NULL, NULL),

  ('Congresso de Viena', 'História', 'definicao',
   'Reunião das potências europeias (1814-1815) após a derrota de Napoleão, que redesenhou o mapa da Europa buscando restaurar o equilíbrio de poder e as monarquias tradicionais.',
   NULL, NULL, NULL),

  ('Transição do Feudalismo pro Capitalismo', 'História', 'definicao',
   'Processo histórico de longa duração em que a economia agrária e local da Idade Média foi gradualmente substituída pelo comércio, manufatura e acumulação de capital que caracterizam o capitalismo.',
   NULL, NULL, NULL),

  ('Escravidão na Antiguidade', 'História', 'definicao',
   'Sistema de trabalho forçado presente em civilizações antigas como Grécia e Roma, geralmente envolvendo prisioneiros de guerra e povos conquistados, base de boa parte da economia dessas sociedades.',
   NULL, NULL, NULL),

  ('Inquisição', 'História', 'definicao',
   'Instituição da Igreja Católica que perseguia e julgava pessoas acusadas de heresia, bruxaria ou desvio da fé oficial, especialmente entre os séculos 13 e 19, usando métodos como tortura e execução.',
   NULL, NULL, NULL),

  ('Independência Hispano-Americana', 'História', 'definicao',
   'Conjunto de movimentos que libertaram as colônias espanholas na América no início do século 19, liderados por figuras como Simón Bolívar e José de San Martín.',
   NULL, NULL, NULL),

  ('Tratado de Tordesilhas', 'História', 'definicao',
   'Acordo de 1494 entre Portugal e Espanha que dividiu as terras "descobertas e por descobrir" fora da Europa através de uma linha imaginária, base da colonização portuguesa do Brasil.',
   NULL, NULL, NULL),

  ('OTAN e Pacto de Varsóvia', 'História', 'definicao',
   'Alianças militares rivais da Guerra Fria: a OTAN reunia os países capitalistas ocidentais liderados pelos EUA; o Pacto de Varsóvia reunia os países socialistas do Leste Europeu liderados pela URSS.',
   NULL, NULL, NULL),

  ('Corrida Espacial', 'História', 'definicao',
   'Disputa tecnológica e ideológica entre EUA e URSS durante a Guerra Fria pela supremacia na exploração espacial, culminando no envio soviético do primeiro satélite (Sputnik) e na chegada americana à Lua.',
   NULL, NULL, NULL),

  ('Construção do Muro de Berlim', 'História', 'definicao',
   'Erguido em 1961 pela Alemanha Oriental, o muro dividiu fisicamente Berlim por quase 30 anos, símbolo maior da divisão do mundo durante a Guerra Fria, até sua queda em 1989.',
   NULL, NULL, NULL),

  ('Perestroika e Glasnost', 'História', 'definicao',
   'Reformas promovidas por Mikhail Gorbachev na URSS nos anos 1980: perestroika (reestruturação econômica) e glasnost (abertura política/transparência), que aceleraram o fim da União Soviética.',
   NULL, NULL, NULL),

  ('Fascismo Italiano', 'História', 'definicao',
   'Regime autoritário e nacionalista liderado por Benito Mussolini na Itália (1922-1943), caracterizado por culto ao líder, militarismo e supressão de liberdades individuais — inspirou outros regimes fascistas na Europa.',
   NULL, NULL, NULL),

  ('Simón Bolívar', 'História', 'pessoa',
   'Militar e político venezuelano, principal líder da independência de vários países sul-americanos do domínio espanhol (Venezuela, Colômbia, Equador, Peru, Bolívia), conhecido como "O Libertador".',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Sim%C3%B3n_Bol%C3%ADvar_by_Jos%C3%A9_Gil_de_Castro.jpg', '1783 – 1830'),

  ('Mahatma Gandhi', 'História', 'pessoa',
   'Líder indiano do movimento de independência contra o domínio britânico, defensor da resistência não-violenta (satyagraha) como forma de luta política — inspirou movimentos de direitos civis ao redor do mundo.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg', '1869 – 1948'),

  ('Mao Tsé-Tung', 'História', 'pessoa',
   'Líder comunista chinês, fundador da República Popular da China (1949) e figura central da Revolução Chinesa, governou o país até sua morte, com políticas que causaram profundas transformações e também grande sofrimento humano.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/0/05/Mao_Zedong_1950_Portrait_%283x4_cropped%29.jpg', '1893 – 1976')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): Geografia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('BRICS', 'Geografia', 'definicao',
   'Grupo de cooperação entre economias emergentes: Brasil, Rússia, Índia, China e África do Sul (com novos membros aderindo recentemente), que busca maior influência geopolítica frente aos países desenvolvidos tradicionais.',
   NULL, NULL, NULL),

  ('FMI e Banco Mundial', 'Geografia', 'definicao',
   'Organizações financeiras internacionais criadas após a Segunda Guerra Mundial: o FMI (Fundo Monetário Internacional) monitora a estabilidade financeira global; o Banco Mundial financia projetos de desenvolvimento em países pobres.',
   NULL, NULL, NULL),

  ('OMC (Organização Mundial do Comércio)', 'Geografia', 'definicao',
   'Organização internacional que estabelece regras pro comércio entre países, buscando reduzir barreiras comerciais e resolver disputas comerciais entre nações membros.',
   NULL, NULL, NULL),

  ('Crise de Refugiados', 'Geografia', 'definicao',
   'Situação em que grandes populações são forçadas a deixar seus países devido a guerras, perseguições ou desastres, buscando refúgio em outras nações — gera desafios humanitários e políticos globais.',
   NULL, NULL, NULL),

  ('Commodities', 'Geografia', 'definicao',
   'Produtos primários (agrícolas, minerais ou energéticos) padronizados e comercializados globalmente, como soja, minério de ferro e petróleo, cujos preços costumam ser definidos no mercado internacional.',
   NULL, NULL, NULL),

  ('Dívida Externa', 'Geografia', 'definicao',
   'Total de recursos que um país deve a credores estrangeiros (outros governos, bancos, organismos internacionais), cujo pagamento pode limitar investimentos internos em áreas como saúde e educação.',
   NULL, NULL, NULL),

  ('Países Emergentes', 'Geografia', 'definicao',
   'Países com economias em rápido crescimento e industrialização, em transição entre o status de subdesenvolvido e desenvolvido, como Brasil, Índia e China.',
   NULL, NULL, NULL),

  ('Países Desenvolvidos e Subdesenvolvidos', 'Geografia', 'definicao',
   'Classificação baseada em indicadores como renda, industrialização, IDH e distribuição de riqueza — desenvolvidos concentram tecnologia e capital, subdesenvolvidos costumam depender de exportação de matérias-primas.',
   NULL, NULL, NULL),

  ('Cidades Globais', 'Geografia', 'definicao',
   'Centros urbanos com forte influência econômica, política e cultural em escala mundial, concentrando sedes de empresas multinacionais e centros de decisão financeira.',
   'Nova York, Londres e Tóquio são exemplos clássicos de cidades globais.', NULL, NULL),

  ('Saneamento Básico', 'Geografia', 'definicao',
   'Conjunto de serviços essenciais como abastecimento de água tratada, coleta de esgoto e de lixo — sua ausência está diretamente ligada a doenças e desigualdade social, especialmente em áreas urbanas precárias.',
   NULL, NULL, NULL),

  ('Escassez de Água', 'Geografia', 'definicao',
   'Situação em que a demanda por água doce numa região supera a oferta disponível, agravada por crescimento populacional, poluição, desperdício e mudanças climáticas.',
   NULL, NULL, NULL),

  ('Matriz de Transporte no Brasil', 'Geografia', 'definicao',
   'O Brasil depende fortemente do transporte rodoviário (mais caro e poluente) em detrimento do ferroviário e hidroviário, o que encarece a logística e o chamado "Custo Brasil".',
   NULL, NULL, NULL),

  ('Biopirataria', 'Geografia', 'definicao',
   'Apropriação ilegal de recursos genéticos e conhecimentos tradicionais (geralmente de países megadiversos como o Brasil) por empresas ou países estrangeiros, sem autorização ou compensação justa.',
   NULL, NULL, NULL),

  ('Soberania Nacional', 'Geografia', 'definicao',
   'Poder supremo de um Estado de governar seu próprio território e população sem interferência externa, princípio fundamental das relações internacionais.',
   NULL, NULL, NULL),

  ('China como Potência Econômica', 'Geografia', 'definicao',
   'Ascensão da China nas últimas décadas como uma das maiores economias do mundo, combinando abertura comercial controlada com forte planejamento estatal, hoje disputando protagonismo global com os EUA.',
   NULL, NULL, NULL),

  ('Nova Ordem Mundial Multipolar', 'Geografia', 'definicao',
   'Configuração geopolítica atual em que o poder mundial deixa de estar concentrado só nos EUA (unipolaridade pós-Guerra Fria) e passa a ser disputado por vários polos de poder, como China, Rússia, União Europeia e Índia.',
   NULL, NULL, NULL),

  ('Zonas Econômicas Especiais', 'Geografia', 'definicao',
   'Áreas delimitadas dentro de um país com regras econômicas diferenciadas (menos impostos, menos burocracia) pra atrair investimento estrangeiro e impulsionar a indústria local.',
   'A China usou zonas econômicas especiais, como Shenzhen, pra impulsionar sua industrialização.', NULL, NULL),

  ('Xenofobia e Migração', 'Geografia', 'definicao',
   'Rejeição ou discriminação contra pessoas de outros países, frequentemente intensificada em contextos de grandes fluxos migratórios e crises econômicas nos países receptores.',
   NULL, NULL, NULL),

  ('Centro e Periferia', 'Geografia', 'definicao',
   'Modelo que divide o mundo entre países "centrais" (industrializados, com mais poder econômico e tecnológico) e países "periféricos" (fornecedores de matéria-prima e mão de obra barata), usado pra explicar desigualdades globais.',
   NULL, NULL, NULL),

  ('Josué de Castro', 'Geografia', 'pessoa',
   'Médico, geógrafo e sociólogo brasileiro, autor de "Geografia da Fome" (1946), obra pioneira que mostrou a fome como um problema social e político, não natural. Foi presidente do Conselho da FAO (órgão da ONU pra agricultura e alimentação).',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Josu%C3%A9_de_Castro_doc_1967.jpg', '1908 – 1973')
ON CONFLICT DO NOTHING;

-- Quinto bloco (20 por matéria): Inglês
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Future Continuous', 'Inglês', 'definicao',
   'Tempo verbal (will be + verbo com -ing) usado pra ações que estarão em progresso num momento específico do futuro.',
   '"At 8 pm, I will be studying." (Às 8 da noite, eu estarei estudando.)', NULL, NULL),

  ('Future Perfect', 'Inglês', 'definicao',
   'Tempo verbal (will have + particípio) usado pra ações que estarão concluídas antes de um momento específico no futuro.',
   '"By next year, I will have graduated." (Até o ano que vem, eu terei me formado.)', NULL, NULL),

  ('Mixed Conditionals', 'Inglês', 'definicao',
   'Combinações entre o segundo e o terceiro condicional, usadas quando a condição e o resultado estão em tempos diferentes (passado e presente, por exemplo).',
   '"If I had studied medicine, I would be a doctor now." (condição no passado, resultado no presente)', NULL, NULL),

  ('Wish and If Only', 'Inglês', 'definicao',
   'Estruturas usadas pra expressar desejos ou arrependimentos sobre o presente (+ Simple Past) ou o passado (+ Past Perfect).',
   '"I wish I had more time." / "If only I had studied harder."', NULL, NULL),

  ('Zero Article', 'Inglês', 'definicao',
   'Ausência do artigo "a/an/the" antes de substantivos incontáveis, plurais gerais, ou nomes próprios, quando a referência é geral e não específica.',
   '"I like music." (não "the music", referência geral).', NULL, NULL),

  ('Gerunds as Subjects', 'Inglês', 'definicao',
   'Uso do gerúndio (verbo + -ing) como sujeito de uma frase, funcionando como um substantivo.',
   '"Swimming is good for your health." (Nadar é bom pra saúde.)', NULL, NULL),

  ('Infinitive of Purpose', 'Inglês', 'definicao',
   'Uso do infinitivo (to + verbo) pra explicar a finalidade ou o objetivo de uma ação.',
   '"She went to the store to buy milk." (Ela foi à loja pra comprar leite.)', NULL, NULL),

  ('As...As (Comparações de Igualdade)', 'Inglês', 'definicao',
   'Estrutura usada pra comparar duas coisas que são iguais em algum aspecto.',
   '"She is as tall as her brother." (Ela é tão alta quanto o irmão.)', NULL, NULL),

  ('Linking Verbs', 'Inglês', 'definicao',
   'Verbos que conectam o sujeito a um complemento (adjetivo ou substantivo) sem expressar uma ação, como "be", "seem", "become", "look".',
   '"She looks tired." (Ela parece cansada.)', NULL, NULL),

  ('Direct and Indirect Objects', 'Inglês', 'definicao',
   'Objeto direto recebe diretamente a ação do verbo; objeto indireto indica pra quem ou pra quê a ação é direcionada.',
   '"She gave him (indireto) a book (direto)."', NULL, NULL),

  ('Irregular Plurals', 'Inglês', 'definicao',
   'Substantivos que não seguem a regra comum de plural (+s/es), mudando de forma própria.',
   '"Child" → "children"; "mouse" → "mice"; "foot" → "feet".', NULL, NULL),

  ('Homophones', 'Inglês', 'definicao',
   'Palavras que têm a mesma pronúncia mas significados e/ou grafias diferentes, fonte comum de confusão e pegadinhas em provas.',
   '"There", "their" e "they''re" são homófonos comuns em inglês.', NULL, NULL),

  ('Word Formation (Sufixos de Profissão)', 'Inglês', 'definicao',
   'Sufixos usados pra formar palavras que indicam profissões ou ocupações, como -er, -or, -ist, -ian.',
   '"Teach" → "teacher"; "art" → "artist"; "music" → "musician".', NULL, NULL),

  ('Expressing Opinion', 'Inglês', 'definicao',
   'Expressões usadas pra introduzir uma opinião pessoal em textos e redações em inglês, como "In my opinion", "I believe that", "From my point of view".',
   NULL, NULL, NULL),

  ('Sequencing Words', 'Inglês', 'definicao',
   'Palavras que organizam ideias numa ordem lógica ou cronológica num texto, como "firstly", "secondly", "then", "finally".',
   NULL, NULL, NULL),

  ('Hedging Language', 'Inglês', 'definicao',
   'Uso de expressões que suavizam uma afirmação, evitando soar muito categórico — comum em textos acadêmicos, como "seems to", "appears to", "might", "could suggest".',
   '"This data appears to suggest a correlation." (mais cauteloso do que "this data proves").', NULL, NULL),

  ('Reported Questions', 'Inglês', 'definicao',
   'Forma de relatar uma pergunta feita por outra pessoa, sem usar a estrutura interrogativa direta e geralmente mudando o tempo verbal.',
   '"Where do you live?" → She asked where I lived.', NULL, NULL),

  ('Passive Voice with Modals', 'Inglês', 'definicao',
   'Combinação da voz passiva com verbos modais (can, should, must), formada por modal + be + particípio.',
   '"The homework must be finished by Friday."', NULL, NULL),

  ('Emphatic Structures', 'Inglês', 'definicao',
   'Estruturas usadas pra dar ênfase a uma parte específica de uma frase, como "It is... that" (cleft sentences) e "What... is".',
   '"It was Maria who solved the problem." (foi a Maria, especificamente, quem resolveu)', NULL, NULL),

  ('Inversion', 'Inglês', 'definicao',
   'Inversão da ordem normal sujeito-verbo, usada pra dar ênfase, geralmente após advérbios negativos no início da frase.',
   '"Never have I seen such a beautiful place." (em vez de "I have never seen...")', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Redação: segunda leva — 5 novos pensadores + 2ª frase pros 5 já existentes
-- (limite combinado de Paulo: no máximo 3 frases por pensador)
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Michel Foucault', 'Redação', 'pessoa',
   '"Onde há poder, há resistência."',
   'Foucault mostra que o poder não é algo que só oprime de cima pra baixo — ele está espalhado em todas as relações sociais, e sempre gera formas de resistência. Repertório útil pra redações sobre movimentos sociais, controle social e relações de poder nas instituições.',
   'https://upload.wikimedia.org/wikipedia/commons/7/76/Michel_Foucault_1974_Brasil.jpg', '1926 – 1984'),

  ('Hannah Arendt', 'Redação', 'pessoa',
   '"Ninguém tem o direito de obedecer."',
   'Ao cunhar o conceito de "banalidade do mal" (ao observar o julgamento de um oficial nazista), Arendt argumenta que atrocidades em massa muitas vezes não são cometidas por monstros, mas por pessoas comuns que simplesmente obedecem a ordens sem pensar. Ótimo repertório pra redações sobre ética, responsabilidade individual e obediência cega.',
   'https://upload.wikimedia.org/wikipedia/commons/b/b5/Hannah_Arendt_1955.jpg', '1906 – 1975'),

  ('Émile Durkheim', 'Redação', 'pessoa',
   '"A educação é a ação exercida pelas gerações adultas sobre as gerações que não se encontram ainda maduras para a vida social."',
   'Durkheim, um dos fundadores da sociologia, entende a educação como um processo social que integra o indivíduo à sociedade, transmitindo valores e normas coletivas. Repertório certeiro pra redações sobre o papel da escola e da família na formação do cidadão.',
   'https://upload.wikimedia.org/wikipedia/commons/2/23/%C3%89mile_Durkheim.jpg', '1858 – 1917'),

  ('Friedrich Nietzsche', 'Redação', 'pessoa',
   '"Aquele que luta com monstros deve acautelar-se para não se tornar também um monstro."',
   'Nietzsche alerta que combater um mal (violência, injustiça, opressão) usando os mesmos métodos do que se combate pode corromper quem luta contra ele. Repertório forte pra redações sobre violência, justiça e os limites éticos do combate ao crime.',
   'https://upload.wikimedia.org/wikipedia/commons/2/23/Nietzsche1882.jpg', '1844 – 1900'),

  ('Martin Luther King Jr.', 'Redação', 'pessoa',
   '"Injustiça em qualquer lugar é uma ameaça à justiça em todo lugar."',
   'Escrita na "Carta da Prisão de Birmingham", essa frase defende que a luta contra a injustiça não pode ser local ou isolada — ela diz respeito a todos, em qualquer lugar. Repertório essencial pra redações sobre direitos humanos, racismo e justiça social.',
   'https://upload.wikimedia.org/wikipedia/commons/0/05/Martin_Luther_King%2C_Jr..jpg', '1929 – 1968')
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): Biologia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Sinapse Nervosa', 'Biologia', 'definicao',
   'Ponto de comunicação entre dois neurônios (ou entre neurônio e outra célula), onde o impulso nervoso é transmitido geralmente por substâncias químicas chamadas neurotransmissores.',
   NULL, NULL, NULL),

  ('Potencial de Ação (Impulso Nervoso)', 'Biologia', 'definicao',
   'Rápida alteração elétrica que percorre a membrana do neurônio, causada pela movimentação de íons (sódio e potássio), responsável por transmitir informação ao longo do axônio.',
   NULL, NULL, NULL),

  ('Reflexo Nervoso', 'Biologia', 'definicao',
   'Resposta rápida e automática a um estímulo, que não passa pela consciência — o impulso vai do receptor direto à medula espinhal e ao músculo, sem precisar "esperar" o cérebro processar.',
   'Puxar a mão rapidamente ao tocar algo quente é um reflexo nervoso.', NULL, NULL),

  ('Sistema Nervoso Central e Periférico', 'Biologia', 'definicao',
   'O Sistema Nervoso Central (encéfalo e medula espinhal) processa e integra informações; o Sistema Nervoso Periférico (nervos que saem do SNC) conecta o SNC ao resto do corpo.',
   NULL, NULL, NULL),

  ('Adrenalina', 'Biologia', 'definicao',
   'Hormônio produzido pelas glândulas suprarrenais em situações de estresse ou perigo, que prepara o corpo pra reação de "luta ou fuga": aumenta batimentos cardíacos, dilata pupilas e libera energia.',
   NULL, NULL, NULL),

  ('Insulina e Glucagon', 'Biologia', 'definicao',
   'Hormônios produzidos pelo pâncreas que regulam a glicose no sangue de forma oposta: insulina reduz a glicemia (armazenando glicose); glucagon aumenta a glicemia (liberando glicose armazenada).',
   'No diabetes tipo 1, o corpo não produz insulina suficiente.', NULL, NULL),

  ('Fecundação', 'Biologia', 'definicao',
   'União do gameta masculino (espermatozoide) com o gameta feminino (óvulo), formando o zigoto — primeira célula de um novo organismo.',
   NULL, NULL, NULL),

  ('Partenogênese', 'Biologia', 'definicao',
   'Tipo de reprodução em que o óvulo se desenvolve num novo indivíduo sem ser fecundado por um espermatozoide.',
   'Algumas espécies de abelhas, formigas e répteis podem se reproduzir por partenogênese.', NULL, NULL),

  ('Hermafroditismo', 'Biologia', 'definicao',
   'Condição em que um organismo possui órgãos reprodutores masculinos e femininos, comum em algumas espécies de invertebrados como minhocas e caracóis.',
   NULL, NULL, NULL),

  ('Metamorfose', 'Biologia', 'definicao',
   'Processo de transformação drástica na forma do corpo de um animal ao longo do seu desenvolvimento, comum em anfíbios e insetos.',
   'A transformação de larva em borboleta é um exemplo clássico de metamorfose completa.', NULL, NULL),

  ('Migração Animal', 'Biologia', 'definicao',
   'Deslocamento sazonal e periódico de animais entre regiões diferentes, geralmente em busca de alimento, clima favorável ou locais de reprodução.',
   NULL, NULL, NULL),

  ('Hibernação', 'Biologia', 'definicao',
   'Estado de inatividade e redução do metabolismo que alguns animais adotam durante períodos de frio extremo ou escassez de alimento, pra economizar energia.',
   NULL, NULL, NULL),

  ('Camuflagem e Mimetismo', 'Biologia', 'definicao',
   'Camuflagem é quando um organismo se confunde com o ambiente pra não ser notado; mimetismo é quando uma espécie imita a aparência de outra (geralmente perigosa) pra afastar predadores.',
   NULL, NULL, NULL),

  ('Bioindicadores', 'Biologia', 'definicao',
   'Organismos cuja presença, ausência ou comportamento indica a qualidade ambiental de um ecossistema, usados pra monitorar poluição e saúde ambiental.',
   'Líquens são bons bioindicadores de poluição do ar.', NULL, NULL),

  ('Doenças Autoimunes', 'Biologia', 'definicao',
   'Condições em que o sistema imunológico ataca por engano células e tecidos saudáveis do próprio corpo, reconhecendo-os erroneamente como ameaças.',
   'Lúpus e diabetes tipo 1 são exemplos de doenças autoimunes.', NULL, NULL),

  ('Alergias', 'Biologia', 'definicao',
   'Reação exagerada do sistema imunológico a substâncias geralmente inofensivas (pólen, alimentos, poeira), causando sintomas como coceira, inchaço ou dificuldade respiratória.',
   NULL, NULL, NULL),

  ('Biologia do Câncer', 'Biologia', 'definicao',
   'O câncer surge quando células sofrem mutações que fazem com que se dividam de forma descontrolada, formando tumores que podem invadir tecidos vizinhos e se espalhar (metástase).',
   NULL, NULL, NULL),

  ('Apoptose (Morte Celular Programada)', 'Biologia', 'definicao',
   'Processo natural e controlado de autodestruição de células, essencial pro desenvolvimento normal e pra eliminar células danificadas ou infectadas.',
   NULL, NULL, NULL),

  ('Microbiota Intestinal', 'Biologia', 'definicao',
   'Conjunto de bilhões de microrganismos (principalmente bactérias) que vivem no intestino humano, auxiliando na digestão, produção de vitaminas e no funcionamento do sistema imunológico.',
   NULL, NULL, NULL),

  ('Rosalind Franklin', 'Biologia', 'pessoa',
   'Química e cristalógrafa inglesa cujas imagens de difração de raios-X (incluindo a famosa "Foto 51") foram fundamentais pra descoberta da estrutura do DNA por Watson e Crick — reconhecimento que ela só recebeu de forma mais ampla após sua morte.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/9/97/Rosalind_Franklin.jpg', '1920 – 1958')
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): Química
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Ácidos e Bases de Arrhenius', 'Química', 'definicao',
   'Teoria clássica que define ácido como substância que libera íons H+ em água, e base como substância que libera íons OH- em água.',
   NULL, NULL, NULL),

  ('Ácidos e Bases de Bronsted-Lowry', 'Química', 'definicao',
   'Teoria mais ampla que a de Arrhenius: ácido é qualquer espécie capaz de doar um próton (H+); base é qualquer espécie capaz de receber um próton, mesmo sem estar em água.',
   NULL, NULL, NULL),

  ('Óxidos Ácidos, Básicos, Anfóteros e Neutros', 'Química', 'definicao',
   'Classificação dos óxidos conforme seu comportamento: ácidos reagem com água formando ácido; básicos reagem formando base; anfóteros se comportam como ácido ou base; neutros não reagem com água.',
   NULL, NULL, NULL),

  ('Classificação dos Sais', 'Química', 'definicao',
   'Sais podem ser classificados como normais, ácidos, básicos ou duplos, dependendo se ainda possuem hidrogênios ou hidroxilas ionizáveis em sua estrutura.',
   NULL, NULL, NULL),

  ('Reações de Neutralização', 'Química', 'definicao',
   'Reações entre um ácido e uma base que produzem sal e água, neutralizando as propriedades ácidas e básicas dos reagentes.',
   NULL, NULL, NULL),

  ('Reagente Limitante e Reagente em Excesso', 'Química', 'definicao',
   'Reagente limitante é consumido completamente numa reação, determinando a quantidade máxima de produto formado; reagente em excesso é o que sobra ao final da reação.',
   NULL, NULL, NULL),

  ('Pressão de Vapor', 'Química', 'definicao',
   'Pressão exercida pelo vapor de um líquido quando está em equilíbrio com sua fase líquida, num sistema fechado — quanto mais volátil o líquido, maior sua pressão de vapor.',
   NULL, NULL, NULL),

  ('Ponto de Fusão e Ebulição', 'Química', 'definicao',
   'Ponto de fusão é a temperatura em que uma substância passa do estado sólido pro líquido; ponto de ebulição é a temperatura em que passa do líquido pro gasoso, ambos característicos de cada substância.',
   NULL, NULL, NULL),

  ('Pressão Osmótica', 'Química', 'definicao',
   'Pressão necessária pra impedir o fluxo de água através de uma membrana semipermeável entre soluções de concentrações diferentes — quanto maior a concentração de soluto, maior a pressão osmótica.',
   NULL, NULL, NULL),

  ('Afinidade Eletrônica', 'Química', 'definicao',
   'Energia liberada quando um átomo neutro no estado gasoso recebe um elétron, formando um íon negativo — geralmente aumenta da esquerda pra direita na tabela periódica.',
   NULL, NULL, NULL),

  ('Família dos Halogênios', 'Química', 'definicao',
   'Grupo 17 da tabela periódica (flúor, cloro, bromo, iodo), elementos muito reativos e eletronegativos, que tendem a formar sais ao reagir com metais.',
   NULL, NULL, NULL),

  ('Gases Nobres', 'Química', 'definicao',
   'Grupo 18 da tabela periódica (hélio, neônio, argônio, entre outros), elementos com a camada de valência completa, o que os torna extremamente estáveis e pouco reativos.',
   NULL, NULL, NULL),

  ('Metais Alcalinos', 'Química', 'definicao',
   'Grupo 1 da tabela periódica (lítio, sódio, potássio, entre outros), metais muito reativos, macios, com apenas 1 elétron na camada de valência.',
   NULL, NULL, NULL),

  ('Estrutura de Lewis', 'Química', 'definicao',
   'Representação gráfica de uma molécula que mostra os elétrons de valência de cada átomo e como eles estão distribuídos nas ligações químicas.',
   NULL, NULL, NULL),

  ('Regra do Octeto', 'Química', 'definicao',
   'Tendência dos átomos de ganhar, perder ou compartilhar elétrons pra ficarem com 8 elétrons na camada de valência, alcançando estabilidade eletrônica semelhante à dos gases nobres.',
   NULL, NULL, NULL),

  ('Ligação Dativa (Coordenada)', 'Química', 'definicao',
   'Tipo de ligação covalente em que apenas um dos átomos fornece o par de elétrons compartilhado, enquanto o outro já tem o octeto completo.',
   NULL, NULL, NULL),

  ('Nomenclatura de Ácidos', 'Química', 'definicao',
   'Sistema de regras pra nomear ácidos conforme sua composição: ácidos sem oxigênio recebem sufixo "-ídrico"; ácidos com oxigênio recebem sufixo "-ico" ou "-oso".',
   'Ácido clorídrico (HCl) e ácido sulfúrico (H2SO4).', NULL, NULL),

  ('Pilha de Daniell', 'Química', 'definicao',
   'Uma das primeiras pilhas eletroquímicas desenvolvidas, formada por eletrodos de zinco e cobre em soluções de seus próprios sulfatos, gerando corrente elétrica a partir de uma reação de oxirredução espontânea.',
   NULL, NULL, NULL),

  ('Svante Arrhenius', 'Química', 'pessoa',
   'Químico sueco que propôs a teoria da dissociação iônica e a definição clássica de ácidos e bases que leva seu nome, ganhador do Prêmio Nobel de Química em 1903.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/9/92/Svante_Arrhenius_01.jpg', '1859 – 1927'),

  ('Robert Boyle', 'Química', 'pessoa',
   'Cientista irlandês considerado um dos fundadores da química moderna, formulou a Lei de Boyle (relação entre pressão e volume de um gás) e defendeu o método experimental na ciência.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Robert_Boyle_0001.jpg', '1627 – 1691')
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): Física
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Teorema Trabalho-Energia', 'Física', 'definicao',
   'O trabalho realizado pela força resultante sobre um corpo é igual à variação de sua energia cinética — conecta os conceitos de força, deslocamento e energia.',
   NULL, NULL, NULL),

  ('Ciclo de Carnot', 'Física', 'definicao',
   'Ciclo termodinâmico teórico ideal, usado como referência pra medir a eficiência máxima possível de uma máquina térmica operando entre duas temperaturas.',
   NULL, NULL, NULL),

  ('Entropia', 'Física', 'definicao',
   'Grandeza que mede o grau de desordem de um sistema. A Segunda Lei da Termodinâmica diz que a entropia do universo tende sempre a aumentar em processos espontâneos.',
   NULL, NULL, NULL),

  ('Dilatação Linear, Superficial e Volumétrica', 'Física', 'definicao',
   'Formas de dilatação térmica conforme a dimensão considerada: linear (comprimento), superficial (área) e volumétrica (volume) de um corpo ao ser aquecido.',
   NULL, NULL, NULL),

  ('Lei de Snell (Refração da Luz)', 'Física', 'definicao',
   'Lei que relaciona os ângulos de incidência e refração da luz ao passar de um meio pra outro, com os índices de refração de cada meio.',
   NULL, NULL, NULL),

  ('Espelhos Planos', 'Física', 'definicao',
   'Superfícies refletoras lisas e planas que formam imagens virtuais, direitas e do mesmo tamanho do objeto, à mesma distância do espelho que o objeto está na frente dele.',
   NULL, NULL, NULL),

  ('Campo Gravitacional', 'Física', 'definicao',
   'Região do espaço ao redor de um corpo com massa onde outro corpo com massa sofre uma força de atração gravitacional, cuja intensidade diminui com a distância.',
   NULL, NULL, NULL),

  ('Velocidade de Escape', 'Física', 'definicao',
   'Velocidade mínima necessária pra um objeto escapar da atração gravitacional de um corpo celeste, sem precisar de propulsão adicional depois do lançamento.',
   NULL, NULL, NULL),

  ('Satélites e Órbitas', 'Física', 'definicao',
   'Um satélite permanece em órbita quando sua velocidade horizontal é suficiente pra "cair" na mesma curvatura da Terra continuamente, sem tocar o solo nem escapar pro espaço.',
   NULL, NULL, NULL),

  ('Leis de Kepler', 'Física', 'definicao',
   'Três leis que descrevem o movimento dos planetas ao redor do Sol: órbitas elípticas, velocidades variáveis (mais rápido perto do Sol) e relação entre período orbital e distância.',
   NULL, NULL, NULL),

  ('Aceleração Centrípeta', 'Física', 'definicao',
   'Aceleração direcionada pro centro de uma trajetória circular, responsável por mudar a direção (não a velocidade escalar) de um corpo em movimento circular.',
   NULL, NULL, NULL),

  ('Frequência e Período', 'Física', 'definicao',
   'Frequência é o número de repetições de um fenômeno por unidade de tempo (medida em Hz); período é o tempo necessário pra completar uma repetição — são grandezas inversamente proporcionais.',
   NULL, NULL, NULL),

  ('Ressonância', 'Física', 'definicao',
   'Fenômeno em que um sistema vibra com amplitude muito maior quando é excitado numa frequência próxima à sua frequência natural de vibração.',
   'Uma taça de cristal pode quebrar por ressonância com uma nota musical na frequência certa.', NULL, NULL),

  ('Tensão Superficial', 'Física', 'definicao',
   'Força que faz a superfície de um líquido se comportar como uma membrana elástica, permitindo que pequenos objetos (ou insetos) flutuem sobre ela sem afundar.',
   NULL, NULL, NULL),

  ('Viscosidade', 'Física', 'definicao',
   'Medida da resistência interna de um fluido ao escoamento — quanto mais viscoso, mais devagar o fluido escoa.',
   'O mel é mais viscoso que a água.', NULL, NULL),

  ('Ondas Eletromagnéticas vs Mecânicas', 'Física', 'definicao',
   'Ondas eletromagnéticas (luz, ondas de rádio) se propagam mesmo no vácuo; ondas mecânicas (som, ondas na água) precisam de um meio material pra se propagar.',
   NULL, NULL, NULL),

  ('Timbre e Altura do Som', 'Física', 'definicao',
   'Altura é a característica que diferencia um som grave de um agudo (relacionada à frequência); timbre é o que diferencia dois sons de mesma altura tocados por instrumentos diferentes.',
   NULL, NULL, NULL),

  ('Fusíveis e Disjuntores', 'Física', 'definicao',
   'Dispositivos de segurança elétrica que interrompem um circuito quando a corrente ultrapassa um valor seguro, prevenindo incêndios e danos aos equipamentos.',
   NULL, NULL, NULL),

  ('Johannes Kepler', 'Física', 'pessoa',
   'Astrônomo e matemático alemão que formulou as três leis do movimento planetário, usando os dados de observação de Tycho Brahe, lançando as bases pra Lei da Gravitação Universal de Newton.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Johannes_Kepler_by_Hans_von_Aachen.jpg', '1571 – 1630'),

  ('Christiaan Huygens', 'Física', 'pessoa',
   'Físico e astrônomo holandês que propôs a teoria ondulatória da luz e fez contribuições fundamentais em óptica, mecânica e no desenvolvimento do relógio de pêndulo.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Christiaan_Huygens-painting.jpeg', '1629 – 1695')
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): Matemática
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Equação Exponencial', 'Matemática', 'definicao',
   'Equação em que a incógnita aparece no expoente, geralmente resolvida igualando as bases ou aplicando logaritmo dos dois lados.',
   '2ˣ = 8 → x = 3, pois 2³ = 8.', NULL, NULL),

  ('Equação Logarítmica', 'Matemática', 'definicao',
   'Equação em que a incógnita aparece dentro de um logaritmo, resolvida usando as propriedades dos logaritmos pra isolar a variável.',
   NULL, NULL, NULL),

  ('Inequação Exponencial e Logarítmica', 'Matemática', 'definicao',
   'Inequações envolvendo expressões exponenciais ou logarítmicas, resolvidas considerando o comportamento crescente ou decrescente da função conforme a base.',
   NULL, NULL, NULL),

  ('Propriedades dos Logaritmos', 'Matemática', 'definicao',
   'Regras que simplificam operações com logaritmos: log de um produto é a soma dos logs; log de um quociente é a diferença; log de uma potência multiplica o expoente pelo log da base.',
   NULL, NULL, NULL),

  ('Forma Trigonométrica de Números Complexos', 'Matemática', 'definicao',
   'Representação de um número complexo usando módulo e argumento (ângulo), em vez da forma algébrica (a + bi), útil pra multiplicação, divisão e potenciação.',
   NULL, NULL, NULL),

  ('Vetores (Matemática)', 'Matemática', 'definicao',
   'Entidades matemáticas com módulo, direção e sentido, representadas geometricamente por setas, usadas pra representar grandezas físicas e operações geométricas.',
   NULL, NULL, NULL),

  ('Operações com Matrizes', 'Matemática', 'definicao',
   'Matrizes podem ser somadas, subtraídas (elemento por elemento, se tiverem mesma dimensão) e multiplicadas (seguindo regras específicas de linhas por colunas).',
   NULL, NULL, NULL),

  ('Regra de Cramer', 'Matemática', 'definicao',
   'Método que usa determinantes pra resolver sistemas de equações lineares, calculando cada incógnita como uma razão entre determinantes.',
   NULL, NULL, NULL),

  ('Área de Setor Circular', 'Matemática', 'definicao',
   'Área de uma "fatia" de círculo, calculada proporcionalmente ao ângulo central em relação ao círculo completo.',
   NULL, NULL, NULL),

  ('Comprimento de Arco', 'Matemática', 'definicao',
   'Medida do comprimento de uma parte curva da circunferência, correspondente a um ângulo central específico.',
   NULL, NULL, NULL),

  ('Arranjo Simples', 'Matemática', 'definicao',
   'Agrupamento ordenado de elementos de um conjunto, em que a ordem importa e nem todos os elementos precisam ser usados.',
   'As senhas numéricas de 4 dígitos distintos são um exemplo de arranjo.', NULL, NULL),

  ('Combinação Simples', 'Matemática', 'definicao',
   'Agrupamento de elementos de um conjunto em que a ordem NÃO importa, diferente do arranjo.',
   'Escolher 3 frutas de uma cesta de 10 é uma combinação — não importa a ordem em que foram escolhidas.', NULL, NULL),

  ('Permutação', 'Matemática', 'definicao',
   'Caso particular do arranjo em que todos os elementos de um conjunto são organizados em sequência, calculado pelo fatorial do número de elementos.',
   NULL, NULL, NULL),

  ('Espaço Amostral', 'Matemática', 'definicao',
   'Conjunto de todos os resultados possíveis de um experimento aleatório, usado como base pro cálculo de probabilidades.',
   'O espaço amostral do lançamento de um dado é {1, 2, 3, 4, 5, 6}.', NULL, NULL),

  ('Eventos Independentes e Dependentes', 'Matemática', 'definicao',
   'Eventos independentes não influenciam a probabilidade um do outro; eventos dependentes têm a probabilidade de um alterada pela ocorrência do outro.',
   NULL, NULL, NULL),

  ('Assíntotas de uma Função', 'Matemática', 'definicao',
   'Retas que uma função se aproxima cada vez mais, sem nunca tocar, conforme a variável tende ao infinito ou a um valor específico.',
   NULL, NULL, NULL),

  ('Número de Ouro (Proporção Áurea)', 'Matemática', 'definicao',
   'Constante matemática (aproximadamente 1,618) considerada esteticamente harmoniosa, encontrada em obras de arte, arquitetura e também em padrões da natureza.',
   NULL, NULL, NULL),

  ('Sequência de Fibonacci', 'Matemática', 'definicao',
   'Sequência numérica em que cada termo é a soma dos dois anteriores (1, 1, 2, 3, 5, 8, 13...), frequentemente encontrada em padrões da natureza, como a disposição de pétalas e conchas.',
   NULL, NULL, NULL),

  ('Bhaskara', 'Matemática', 'pessoa',
   'Matemático e astrônomo indiano (Bhaskara II), autor de importantes tratados sobre álgebra e aritmética. A "Fórmula de Bhaskara" usada no Brasil pra resolver equações do 2º grau é uma homenagem a ele, embora não tenha sido descrita exatamente dessa forma por ele.',
   NULL, NULL, '1114 – 1185 (aprox.)'),

  ('Évariste Galois', 'Matemática', 'pessoa',
   'Matemático francês que criou as bases da teoria de grupos ainda na adolescência, morrendo aos 20 anos num duelo — na noite anterior, escreveu freneticamente suas ideias matemáticas, reconhecidas como geniais só depois de sua morte.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Evariste_Galois.jpg', '1811 – 1832')
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): História
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Bombas Atômicas (Hiroshima e Nagasaki)', 'História', 'definicao',
   'Ataques nucleares dos Estados Unidos contra as cidades japonesas de Hiroshima e Nagasaki em agosto de 1945, que mataram centenas de milhares de pessoas e levaram à rendição do Japão, encerrando a Segunda Guerra Mundial.',
   NULL, NULL, NULL),

  ('Plano Marshall', 'História', 'definicao',
   'Programa dos Estados Unidos de ajuda econômica pra reconstrução da Europa Ocidental após a Segunda Guerra Mundial, também usado como estratégia pra conter a expansão do comunismo durante a Guerra Fria.',
   NULL, NULL, NULL),

  ('Revolução Iraniana (1979)', 'História', 'definicao',
   'Movimento que derrubou o governo do Xá do Irã (apoiado pelo Ocidente) e instaurou uma república islâmica liderada pelo Aiatolá Khomeini, mudando profundamente a geopolítica do Oriente Médio.',
   NULL, NULL, NULL),

  ('Primavera Árabe', 'História', 'definicao',
   'Onda de protestos e revoltas populares que varreu diversos países árabes a partir de 2010, exigindo o fim de regimes autoritários — com resultados muito diferentes entre os países, de queda de ditadores a guerras civis.',
   NULL, NULL, NULL),

  ('Chegada da Família Real Portuguesa ao Brasil', 'História', 'definicao',
   'Em 1808, fugindo da invasão napoleônica, a família real portuguesa e a corte se transferiram pro Brasil, elevando o Rio de Janeiro à condição de sede do império português e mudando profundamente a colônia.',
   NULL, NULL, NULL),

  ('Bandeirantes', 'História', 'definicao',
   'Exploradores paulistas dos séculos 16 a 18 que percorreram o interior do Brasil em expedições (bandeiras) em busca de riquezas minerais e indígenas pra escravizar, contribuindo pra expansão territorial da colônia.',
   NULL, NULL, NULL),

  ('Ciclo do Ouro', 'História', 'definicao',
   'Período do século 18 marcado pela intensa exploração de ouro em Minas Gerais, que deslocou o eixo econômico e demográfico da colônia pro interior e gerou forte controle fiscal da Coroa Portuguesa.',
   NULL, NULL, NULL),

  ('Ciclo da Borracha', 'História', 'definicao',
   'Período de exploração econômica da borracha na Amazônia, com dois momentos de auge (fim do século 19 e Segunda Guerra Mundial), que gerou riqueza pontual pra região mas também exploração intensa dos seringueiros.',
   NULL, NULL, NULL),

  ('Golpe de 1964', 'História', 'definicao',
   'Movimento militar que derrubou o presidente João Goulart e deu início à ditadura militar brasileira, que duraria até 1985, justificado pelos golpistas como uma ação contra uma suposta ameaça comunista.',
   NULL, NULL, NULL),

  ('Constituição de 1988', 'História', 'definicao',
   'Conhecida como "Constituição Cidadã", marcou o fim formal da ditadura militar e o início da Nova República, ampliando direitos sociais, políticos e civis no Brasil.',
   NULL, NULL, NULL),

  ('Plano Collor', 'História', 'definicao',
   'Plano econômico de 1990 que, entre outras medidas, confiscou temporariamente a poupança dos brasileiros na tentativa de controlar a hiperinflação — gerou forte impacto social e desconfiança na poupança.',
   NULL, NULL, NULL),

  ('Impeachment de Collor', 'História', 'definicao',
   'Processo de 1992 que afastou Fernando Collor da presidência por denúncias de corrupção, o primeiro impeachment presidencial da Nova República brasileira.',
   NULL, NULL, NULL),

  ('Redemocratização Brasileira', 'História', 'definicao',
   'Processo gradual de transição da ditadura militar pra democracia no Brasil, entre meados dos anos 1970 e a Constituição de 1988, incluindo anistia, eleições diretas e nova ordem constitucional.',
   NULL, NULL, NULL),

  ('Voto Feminino no Brasil', 'História', 'definicao',
   'Conquistado em 1932, durante o governo de Getúlio Vargas, permitiu que mulheres brasileiras votassem pela primeira vez, um marco na luta por direitos políticos femininos no país.',
   NULL, NULL, NULL),

  ('Abolicionismo', 'História', 'definicao',
   'Movimento social e político que lutou pelo fim da escravidão no Brasil ao longo do século 19, através de campanhas, imprensa e mobilização popular, culminando na Lei Áurea de 1888.',
   NULL, NULL, NULL),

  ('Guerra de Canudos', 'História', 'definicao',
   'Conflito (1896-1897) entre o exército brasileiro e a comunidade liderada por Antônio Conselheiro no sertão da Bahia, encerrado com a destruição total do arraial de Canudos.',
   NULL, NULL, NULL),

  ('Coluna Prestes', 'História', 'definicao',
   'Movimento de militares rebeldes (tenentistas) que percorreu o interior do Brasil entre 1925 e 1927, protestando contra o governo da Primeira República e defendendo reformas políticas e sociais.',
   NULL, NULL, NULL),

  ('Lei de Terras de 1850', 'História', 'definicao',
   'Lei que estabeleceu a compra como única forma legal de acesso à terra no Brasil, dificultando o acesso de ex-escravizados e imigrantes pobres à propriedade rural, justamente às vésperas do fim da escravidão.',
   NULL, NULL, NULL),

  ('Dom João VI', 'História', 'pessoa',
   'Rei de Portugal que, fugindo da invasão napoleônica, transferiu a corte portuguesa pro Brasil em 1808, elevando o Rio de Janeiro à condição de capital do império e abrindo os portos brasileiros ao comércio internacional.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Jean-Baptiste_Debret_-_Retrato_de_Dom_Jo%C3%A3o_VI_%28MNBA%29.jpg', '1767 – 1826'),

  ('Princesa Isabel', 'História', 'pessoa',
   'Princesa Imperial do Brasil que, atuando como regente na ausência do pai (Dom Pedro II), assinou a Lei Áurea em 13 de maio de 1888, abolindo formalmente a escravidão no país.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Isabel%2C_Princess_Imperial_of_Brazil_c.1887.jpg', '1846 – 1921')
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): Geografia
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Hidrelétricas no Brasil', 'Geografia', 'definicao',
   'Usinas que geram energia elétrica a partir da força da água represada, principal fonte de energia elétrica do Brasil — Itaipu e Belo Monte estão entre as maiores do país.',
   NULL, NULL, NULL),

  ('Nordeste Brasileiro (Semiárido)', 'Geografia', 'definicao',
   'Região caracterizada por clima semiárido, chuvas irregulares e vegetação de caatinga, historicamente marcada por secas periódicas e desafios de convivência com a escassez de água.',
   NULL, NULL, NULL),

  ('Internacionalização da Amazônia', 'Geografia', 'definicao',
   'Tema geopolítico controverso sobre supostas propostas (geralmente infundadas ou exageradas) de outros países administrarem ou controlarem a Amazônia, frequentemente usado em discursos sobre soberania nacional.',
   NULL, NULL, NULL),

  ('Fronteiras do Brasil', 'Geografia', 'definicao',
   'O Brasil faz fronteira com 10 países da América do Sul (todos exceto Chile e Equador), possuindo uma das maiores extensões de fronteiras terrestres do mundo.',
   NULL, NULL, NULL),

  ('Metrópoles Brasileiras', 'Geografia', 'definicao',
   'Grandes centros urbanos que exercem forte influência regional ou nacional, concentrando população, serviços e atividades econômicas — São Paulo, Rio de Janeiro e Brasília são exemplos de metrópoles nacionais.',
   NULL, NULL, NULL),

  ('Territórios Indígenas no Brasil', 'Geografia', 'definicao',
   'Áreas legalmente demarcadas pra proteger a posse e o modo de vida tradicional dos povos indígenas, garantidas pela Constituição de 1988, mas frequentemente alvo de conflitos com interesses agrícolas e de mineração.',
   NULL, NULL, NULL),

  ('Quilombolas', 'Geografia', 'definicao',
   'Comunidades descendentes de escravizados que resistiram à escravidão formando quilombos, hoje reconhecidas legalmente com direito à titulação de suas terras tradicionais.',
   NULL, NULL, NULL),

  ('Reforma Urbana', 'Geografia', 'definicao',
   'Conjunto de políticas que buscam tornar as cidades mais justas e organizadas, incluindo regularização fundiária, moradia popular e melhor distribuição de infraestrutura urbana.',
   NULL, NULL, NULL),

  ('Plano Diretor Municipal', 'Geografia', 'definicao',
   'Instrumento de planejamento urbano obrigatório pra cidades com mais de 20 mil habitantes, que define regras de uso e ocupação do solo, buscando organizar o crescimento urbano.',
   NULL, NULL, NULL),

  ('Mobilidade Urbana', 'Geografia', 'definicao',
   'Conjunto de deslocamentos das pessoas dentro das cidades, cuja qualidade depende de transporte público eficiente, infraestrutura viária e planejamento urbano integrado.',
   NULL, NULL, NULL),

  ('Poluição Atmosférica', 'Geografia', 'definicao',
   'Presença de substâncias nocivas no ar, geralmente causadas por veículos, indústrias e queimadas, prejudicando a saúde humana e contribuindo pro aquecimento global.',
   NULL, NULL, NULL),

  ('Poluição dos Oceanos', 'Geografia', 'definicao',
   'Contaminação dos mares por resíduos (especialmente plástico), esgoto e produtos químicos, formando inclusive grandes acúmulos de lixo flutuante, como a "Ilha de Lixo do Pacífico".',
   NULL, NULL, NULL),

  ('Geopolítica do Petróleo', 'Geografia', 'definicao',
   'Influência estratégica que o controle de reservas de petróleo exerce nas relações internacionais, especialmente no Oriente Médio, região com as maiores reservas mundiais e histórico de conflitos ligados ao recurso.',
   NULL, NULL, NULL),

  ('União Europeia', 'Geografia', 'definicao',
   'Bloco econômico e político que integra a maioria dos países europeus, com moeda comum (o euro, adotada por parte dos membros) e livre circulação de pessoas e mercadorias entre os países participantes.',
   NULL, NULL, NULL),

  ('Periferia Urbana', 'Geografia', 'definicao',
   'Áreas afastadas do centro das cidades, geralmente com menor infraestrutura e mais carentes de serviços públicos, onde vive grande parte da população de baixa renda nas metrópoles brasileiras.',
   NULL, NULL, NULL),

  ('Êxodo Urbano', 'Geografia', 'definicao',
   'Movimento inverso ao êxodo rural: saída de moradores de grandes cidades em direção a cidades menores ou áreas rurais, geralmente buscando melhor qualidade de vida ou custo de vida menor.',
   NULL, NULL, NULL),

  ('Renda Per Capita', 'Geografia', 'definicao',
   'Indicador que divide a renda total de um país pelo número de habitantes, dando uma média da riqueza por pessoa — mas que pode esconder grandes desigualdades internas.',
   NULL, NULL, NULL),

  ('Linha do Equador e Trópicos', 'Geografia', 'definicao',
   'A Linha do Equador divide a Terra em hemisférios Norte e Sul; os Trópicos de Câncer e Capricórnio marcam os limites da zona tropical, onde o sol incide mais diretamente ao longo do ano.',
   NULL, NULL, NULL),

  ('Aziz Ab''Saber', 'Geografia', 'pessoa',
   'Geógrafo brasileiro considerado um dos maiores cientistas do país, criador do conceito de "domínios morfoclimáticos" pra explicar a diversidade de paisagens naturais brasileiras, e grande defensor da preservação ambiental.',
   NULL, 'https://upload.wikimedia.org/wikipedia/commons/4/44/Aziz_Ab%27Saber_3.jpg', '1924 – 2012'),

  ('Bacia Sedimentar', 'Geografia', 'definicao',
   'Grande depressão na crosta terrestre preenchida por camadas de sedimentos ao longo de milhões de anos, frequentemente associada à formação de petróleo e gás natural.',
   NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Sexto bloco (20 por matéria): Inglês
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Present Perfect Continuous', 'Inglês', 'definicao',
   'Tempo verbal (have/has been + verbo com -ing) usado pra ações que começaram no passado e continuam até o presente, enfatizando a duração.',
   '"I have been studying for three hours." (Estou estudando há três horas.)', NULL, NULL),

  ('Past Perfect Continuous', 'Inglês', 'definicao',
   'Tempo verbal (had been + verbo com -ing) usado pra ações que estavam em progresso antes de outro momento no passado.',
   '"She had been working there for years before she quit." (Ela estava trabalhando lá havia anos antes de pedir demissão.)', NULL, NULL),

  ('Would (Past Habits)', 'Inglês', 'definicao',
   'Usado (junto com "used to") pra descrever hábitos repetidos no passado, mas não pra estados — só ações.',
   '"When I was a kid, I would play outside every day." (Quando eu era criança, eu brincava lá fora todo dia.)', NULL, NULL),

  ('Must vs Have To', 'Inglês', 'definicao',
   '"Must" expressa obrigação que vem de quem fala (opinião pessoal); "have to" expressa obrigação que vem de uma regra ou autoridade externa.',
   '"I must study more." (decisão própria) vs. "I have to wear a uniform at school." (regra externa)', NULL, NULL),

  ('Defining and Non-Defining Relative Clauses', 'Inglês', 'definicao',
   'Orações definidoras (sem vírgula) são essenciais pra identificar o substantivo; orações não-definidoras (entre vírgulas) só acrescentam informação extra, que pode ser removida sem mudar o sentido principal.',
   '"The book that I bought is great." (definidora) vs. "This book, which I bought yesterday, is great." (não-definidora)', NULL, NULL),

  ('Noun Clauses', 'Inglês', 'definicao',
   'Orações que funcionam como um substantivo dentro de uma frase maior, podendo ser sujeito, objeto ou complemento.',
   '"What she said surprised everyone." (a oração inteira funciona como sujeito)', NULL, NULL),

  ('Subjunctive Mood', 'Inglês', 'definicao',
   'Modo verbal usado pra expressar desejos, sugestões ou situações hipotéticas, em estruturas formais como "It is important that..." ou "I suggest that...".',
   '"It is essential that she be informed." (uso formal do subjuntivo)', NULL, NULL),

  ('Separable and Inseparable Phrasal Verbs', 'Inglês', 'definicao',
   'Phrasal verbs separáveis permitem que o objeto fique entre o verbo e a partícula; inseparáveis exigem que o objeto venha sempre depois da partícula.',
   '"Turn the light off" ou "turn off the light" (separável) vs. "Look after the kids" (inseparável, nunca "look the kids after")', NULL, NULL),

  ('Idiomatic Expressions with Colors', 'Inglês', 'definicao',
   'Expressões idiomáticas em inglês que usam cores com sentido figurado, diferente do significado literal.',
   '"Feeling blue" (estar triste), "green with envy" (com muita inveja), "once in a blue moon" (raramente).', NULL, NULL),

  ('Confusing Words (Its/It''s, Your/You''re)', 'Inglês', 'definicao',
   'Pares de palavras que se confundem na escrita por terem pronúncia igual ou parecida, mas função gramatical diferente: "its" (posse) vs "it''s" ("it is"); "your" (posse) vs "you''re" ("you are").',
   NULL, NULL, NULL),

  ('Silent Letters', 'Inglês', 'definicao',
   'Letras que aparecem na escrita de uma palavra em inglês mas não são pronunciadas, um desafio comum pra quem está aprendendo o idioma.',
   '"Knife" (o "k" é mudo), "island" (o "s" é mudo), "hour" (o "h" é mudo).', NULL, NULL),

  ('Negative Prefixes', 'Inglês', 'definicao',
   'Prefixos que invertem o sentido de uma palavra pro seu oposto: un-, in-, dis-, im-, entre outros.',
   '"Happy" → "unhappy"; "possible" → "impossible"; "agree" → "disagree".', NULL, NULL),

  ('Adjective-Forming Suffixes', 'Inglês', 'definicao',
   'Sufixos que transformam substantivos ou verbos em adjetivos, como -ful (cheio de) e -less (sem).',
   '"Care" → "careful" (cuidadoso); "care" → "careless" (descuidado).', NULL, NULL),

  ('Argumentative Essay Structure', 'Inglês', 'definicao',
   'Estrutura típica de uma redação argumentativa em inglês: introdução com tese, parágrafos de desenvolvimento com argumentos e evidências, e conclusão que retoma a tese.',
   NULL, NULL, NULL),

  ('Cause and Effect Connectors', 'Inglês', 'definicao',
   'Conectores usados especificamente pra ligar uma causa ao seu efeito num texto, como "as a result of", "due to", "consequently".',
   NULL, NULL, NULL),

  ('Comparing and Contrasting Structures', 'Inglês', 'definicao',
   'Estruturas e conectores usados pra comparar semelhanças ("similarly", "likewise") ou destacar diferenças ("on the other hand", "whereas") entre duas ideias.',
   NULL, NULL, NULL),

  ('Listening Strategies', 'Inglês', 'definicao',
   'Técnicas pra melhorar a compreensão auditiva em inglês, como prever o conteúdo antes de ouvir, focar em palavras-chave e não travar em palavras desconhecidas.',
   NULL, NULL, NULL),

  ('Yes/No and Wh- Questions', 'Inglês', 'definicao',
   'Perguntas de sim/não esperam uma resposta afirmativa ou negativa; perguntas com Wh- (what, where, when, why, who, how) pedem uma informação específica.',
   NULL, NULL, NULL),

  ('Determiners', 'Inglês', 'definicao',
   'Palavras que vêm antes de um substantivo pra especificar sua referência, incluindo artigos (a, the), possessivos (my, your) e demonstrativos (this, that).',
   NULL, NULL, NULL),

  ('Collective Nouns', 'Inglês', 'definicao',
   'Substantivos que se referem a um grupo de pessoas, animais ou coisas como uma unidade única.',
   '"Team", "family", "audience" e "herd" são substantivos coletivos.', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Redação: terceira leva — 5 novos pensadores
INSERT INTO glossary_terms (term, subject, category, definition, examples, image_url, extra_info) VALUES
  ('Jean-Jacques Rousseau', 'Redação', 'pessoa',
   '"O homem nasce livre, e por toda parte encontra-se a ferros."',
   'Frase de abertura de "Do Contrato Social": Rousseau argumenta que, embora nasçamos livres, as instituições sociais e políticas acabam nos aprisionando e corrompendo. Repertório clássico pra redações sobre liberdade individual, organização social e o papel do Estado.',
   'https://upload.wikimedia.org/wikipedia/commons/c/c4/Maurice_Quentin_de_La_Tour_-_Portrait_of_Jean-Jacques_Rousseau_-_WGA12360.jpg', '1712 – 1778'),

  ('Malala Yousafzai', 'Redação', 'pessoa',
   '"Um livro, uma caneta, uma criança e um professor podem mudar o mundo."',
   'Dita em seu discurso na ONU em 2013, após sobreviver a um atentado do Talibã por defender o direito de meninas à educação, essa frase resume sua luta: a educação como ferramenta de transformação social. Repertório forte pra redações sobre acesso à educação e direitos das mulheres.',
   'https://upload.wikimedia.org/wikipedia/commons/f/fe/Malala_Yousafzai_2015.jpg', '1997 – presente'),

  ('Guy Debord', 'Redação', 'pessoa',
   '"Tudo o que era vivido diretamente tornou-se mera representação."',
   'Primeira tese de "A Sociedade do Espetáculo": Debord argumenta que, na sociedade moderna, a experiência autêntica é substituída por imagens e representações — vivemos cada vez mais através de telas, em vez de vivermos diretamente. Repertório muito atual pra redações sobre redes sociais, mídia e superficialidade das relações.',
   'https://upload.wikimedia.org/wikipedia/commons/4/43/Guy_Debord%2C_painted_portrait.jpg', '1931 – 1994'),

  ('Immanuel Kant', 'Redação', 'pessoa',
   '"Aja apenas segundo uma máxima tal que possas ao mesmo tempo querer que ela se torne lei universal."',
   'O "imperativo categórico" de Kant propõe um teste ético simples: antes de agir, pergunte-se se seria aceitável que todo mundo agisse da mesma forma. Repertório denso, mas poderoso, pra redações sobre ética, cidadania e responsabilidade coletiva.',
   'https://upload.wikimedia.org/wikipedia/commons/4/43/Immanuel_Kant_%28painted_portrait%29.jpg', '1724 – 1804'),

  ('Thomas Hobbes', 'Redação', 'pessoa',
   '"No estado de natureza, o homem é o lobo do homem."',
   'Em "Leviatã", Hobbes descreve o estado de natureza (sem governo ou leis) como uma "guerra de todos contra todos", justificando a necessidade de um Estado forte pra garantir a ordem e a segurança social. Repertório útil pra redações sobre violência, papel do Estado e segurança pública.',
   'https://upload.wikimedia.org/wikipedia/commons/d/d8/Thomas_Hobbes_%28portrait%29.jpg', '1588 – 1679')
ON CONFLICT DO NOTHING;
