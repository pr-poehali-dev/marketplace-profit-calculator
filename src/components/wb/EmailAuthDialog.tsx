import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EmailAuthDialogProps {
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export default function EmailAuthDialog({ trigger, open: openProp, onOpenChange }: EmailAuthDialogProps) {
  const { loginEmail, registerEmail } = useAuth();
  const [openInner, setOpenInner] = useState(false);
  const open = openProp !== undefined ? openProp : openInner;
  const setOpen = onOpenChange ?? setOpenInner;
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === 'login') {
        await loginEmail(email.trim(), password);
        toast.success('Вы вошли');
      } else {
        await registerEmail(email.trim(), password, name.trim() || undefined);
        toast.success('Аккаунт создан');
      }
      setOpen(false);
      setPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Вход по email</DialogTitle>
          <DialogDescription>Войдите или создайте аккаунт, чтобы пользоваться разделом аналитики.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <form onSubmit={handle} className="space-y-3 mt-4">
            {tab === 'register' && (
              <div className="space-y-1">
                <Label>Имя (необязательно)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" />
              </div>
            )}
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Пароль</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" />
            </div>
            <Button type="submit" disabled={busy} className="w-full gap-2">
              {busy && <Icon name="Loader2" size={16} className="animate-spin" />}
              {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}