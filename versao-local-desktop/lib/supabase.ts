import { createClient } from '@supabase/supabase-js'

// Fallback pra rodar/navegar o app localmente antes do projeto Supabase
// existir — qualquer chamada de auth real vai falhar (esperado), mas a
// UI não quebra na renderização por falta de env var.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
