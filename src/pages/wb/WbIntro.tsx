import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

// Демо-режим: всегда пускаем на дашборд с рандомными данными.
export default function WbIntro() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/wb/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon name="Loader2" size={18} className="animate-spin" />
        Открываем аналитику...
      </div>
    </div>
  );
}
