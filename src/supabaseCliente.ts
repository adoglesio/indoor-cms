
import { createClient } from '@supabase/supabase-js';

// Substitua pelos seus dados do Supabase (pegue em Settings > API)
const supabaseUrl = 'https://cozvmqbfhcczsvhhdhot.supabase.co';
const supabaseAnonKey = 'SUA_ANON_KEY_AQUI'; // Cole a chave anônima aqui

export const supabase = createClient(supabaseUrl, supabaseAnonKey);