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
}

// ============================================
// Mídias (Artes)
// ============================================
export interface MediaAsset {
  id: string;
  owner_id: string | null;                // UUID do usuário que fez upload
  file_name: string;                      // Nome original do arquivo
  storage_path: string;                   // URL pública ou caminho no Storage
  media_type: 'image' | 'video';          // Tipo de mídia
  mime_type: string;                      // Ex: image/png, video/mp4
  file_size_bytes: number;                // Tamanho em bytes
  duration_seconds: number | null;        // Duração (apenas para vídeos)
  thumbnail_path: string | null;          // URL da miniatura (opcional)
  checksum: string | null;                // Hash para validação offline
  status: 'active' | 'inactive' | string; // Status da mídia
  is_qr_offer: boolean;                   // Se é uma oferta com QR Code
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
  type: 'media' | 'youtube';        // NOVO
  youtube_url: string | null;       // NOVO
  orientation: 'horizontal' | 'vertical'; // NOVO
  audio_enabled: boolean;           // NOVO
  items_count?: number;             // (opcional) usado no frontend
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
  duration: number;                       // em segundos
  created_at: string;
  updated_at: string;
}