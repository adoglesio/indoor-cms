// src/pages/Devices/DevicePair.tsx (opcional)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Device } from '../../types';

export function DevicePair() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      supabase
        .from('devices')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          setDevice(data);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div>Carregando...</div>;
  if (!device) return <div>Dispositivo não encontrado</div>;

  return (
    <div className="p-6">
      <h1>Parear TV: {device.name}</h1>
      <p>Código de pareamento: {device.pairing_code}</p>
      <button onClick={() => navigate('/devices')}>Voltar</button>
    </div>
  );
}