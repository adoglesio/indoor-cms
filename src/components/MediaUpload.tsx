// src/components/MediaUpload.tsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export function MediaUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    try {
      // Converte FileList para array para iteração
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        // Inserir na tabela media_assets
        const { error: insertError } = await supabase
          .from('media_assets')
          .insert({
            name: file.name,
            file_type: file.type.startsWith('video') ? 'video' : 'image',
            s3_url: urlData.publicUrl,
          });
        if (insertError) throw insertError;
      }
      setProgress(100);
      onUploadComplete(); // Atualiza lista
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max="100" />}
    </div>
  );
}