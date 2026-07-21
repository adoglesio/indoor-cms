// ============================================
// Dispositivos (TVs)
// ============================================
export interface Device {
  id: string;
  name: string;
  sector: string | null;
  orientation: 'horizontal' | 'vertical';
  status: 'online' | 'offline';
  pairing_code: string | null;
  security_key: string | null;
  is_paired: boolean;
  active_playlist_id: string | null;
  resolution: string | null;
  app_version: string | null;
  cpu_usage: number | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  // Campos para screenshot remoto e controle de reprodução
  screenshot_url?: string | null;
  screenshot_taken_at?: string | null;
  screenshot_requested_at?: string | null;
  now_playing?: string | null;
  playback_paused?: boolean;
}

// ============================================
// Mídias (Artes)
// ============================================
export interface MediaAsset {
  id: string;
  owner_id: string | null;
  file_name: string;
  storage_path: string;
  media_type: 'image' | 'video';
  mime_type: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  checksum: string | null;
  status: 'active' | 'inactive' | string;
  is_qr_offer: boolean;
  created_at: string;
}

// ============================================
// Playlists
// ============================================
export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  type: 'media' | 'youtube';
  youtube_url: string | null;
  orientation: 'horizontal' | 'vertical';
  audio_enabled: boolean;
  items_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Itens da Playlist
// ============================================
export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_id: string;
  position: number;
  duration: number;
  created_at: string;
  updated_at: string;
}