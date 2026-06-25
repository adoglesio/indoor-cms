import { supabase } from '../supabaseClient';

export async function getPlaylists() {
  const { data, error } = await supabase
    .from('playlists')
    .select('*, playlist_items(*, media_assets(*))');
  if (error) throw new Error(error.message);
  return data;
}