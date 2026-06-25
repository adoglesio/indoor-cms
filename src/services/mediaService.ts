import { supabase } from '../supabaseClient';

export async function getMediaAssets() {
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function uploadMedia(file: File) {
  // 1. Upload para Storage (bucket 'media')
  const fileName = `${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('media') // nome do bucket criado no Supabase
    .upload(fileName, file);

  if (uploadError) throw new Error(uploadError.message);

  // 2. Obter URL pública
  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);

  // 3. Salvar metadado na tabela media_assets
  const { error: insertError } = await supabase
    .from('media_assets')
    .insert({
      s3_url: urlData.publicUrl,
      file_type: file.type.startsWith('video') ? 'video' : 'image',
      checksum: 'SHA256_FAKE', // pode calcular com crypto.subtle
      name: file.name,
      size: file.size,
      // org_id: user?.organization_id // se tiver multi-tenant
    });

  if (insertError) throw new Error(insertError.message);
  return { message: 'Upload realizado com sucesso' };
}