import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { YandexLoginButton } from '@/components/extensions/yandex-auth/YandexLoginButton';
import EmailAuthDialog from '@/components/wb/EmailAuthDialog';
import type { IndexData } from './useIndexData';

function AccountDropdown({ auth }: { auth: IndexData['auth'] }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  return (
    <>
      <Popover open={dropOpen} onOpenChange={setDropOpen}>
        <PopoverTrigger asChild>
          <Button variant="default" className="gap-2">
            <Icon name="User" size={16} />
            <span className="hidden sm:inline">Аккаунт</span>
            <Icon name="ChevronDown" size={14} className="opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground px-1 pb-1">Выберите способ входа</p>
          <YandexLoginButton
            onClick={() => { setDropOpen(false); auth.login(); }}
            isLoading={auth.isLoading}
            className="w-full justify-start"
          />
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => { setDropOpen(false); setEmailOpen(true); }}
          >
            <Icon name="Mail" size={16} />
            Войти по email
          </Button>
        </PopoverContent>
      </Popover>

      <EmailAuthDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        trigger={<span className="hidden" />}
      />
    </>
  );
}

interface Props {
  auth: IndexData['auth'];
  calculations: IndexData['calculations'];
  exportToExcel: IndexData['exportToExcel'];
}

export default function IndexHeader({ auth, calculations, exportToExcel }: Props) {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-3 py-3 md:px-4 md:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Icon name="TrendingUp" size={28} className="text-primary shrink-0 md:hidden" />
            <Icon name="TrendingUp" size={32} className="text-primary shrink-0 hidden md:block" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-left truncate">FinPlace</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Сервис для селлеров маркетплейсов</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Button
              onClick={() => navigate('/wb')}
              size="icon"
              className="md:hidden h-9 w-9 bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] hover:opacity-90 text-primary-foreground shadow-sm"
              title="WB Аналитика"
            >
              <Icon name="BarChart3" size={18} />
            </Button>
            <Button
              onClick={() => navigate('/wb')}
              className="hidden md:flex bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:opacity-90 text-primary-foreground shadow-sm gap-2"
            >
              <Icon name="BarChart3" size={18} />
              WB Аналитика
              <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">NEW</span>
            </Button>

            <Button onClick={exportToExcel} variant="outline" disabled={calculations.length === 0} size="icon" className="md:hidden h-9 w-9">
              <Icon name="Download" size={18} />
            </Button>
            <Button onClick={exportToExcel} variant="outline" disabled={calculations.length === 0} className="hidden md:flex">
              <Icon name="Download" size={18} className="mr-2" />
              Экспорт
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
                  <Icon name="MessageCircle" size={18} />
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button variant="outline" className="hidden md:flex">
                  <Icon name="MessageCircle" size={18} className="mr-2" />
                  Поддержка
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Поддержка</DialogTitle>
                  <DialogDescription>
                    Свяжитесь с нами по любым вопросам
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center py-6">
                  <Icon name="Phone" size={48} className="mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold mb-2">Александр Фролов</p>
                  <Button size="lg" asChild className="mt-4">
                    <a href="tel:+79037278007">
                      <Icon name="Phone" size={20} className="mr-2" />
                      +7 (903) 727-80-07
                    </a>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {auth.isAuthenticated && auth.user ? (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 md:gap-2 rounded-full border px-1.5 py-1.5 md:pr-3 hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8">
                      {auth.user.avatar_url && (
                        <AvatarImage src={auth.user.avatar_url} alt={auth.user.name || 'Аватар'} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {auth.user.name
                          ? auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : 'Я'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline">
                      {auth.user.name?.split(' ')[0] || 'Аккаунт'}
                    </span>
                    <Icon name="Settings" size={16} className="text-muted-foreground hidden md:block" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Настройки аккаунта</DialogTitle>
                    <DialogDescription>Информация о вашем аккаунте</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {auth.user.avatar_url && (
                          <AvatarImage src={auth.user.avatar_url} alt={auth.user.name || 'Аватар'} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {auth.user.name
                            ? auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : 'Я'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-semibold">{auth.user.name || 'Пользователь'}</p>
                        <p className="text-sm text-muted-foreground">{auth.user.yandex_id ? 'Вход через Яндекс' : 'Вход по email'}</p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                      {auth.user.email && (
                        <div className="flex items-center gap-3">
                          <Icon name="Mail" size={18} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm">{auth.user.email}</p>
                          </div>
                        </div>
                      )}
                      {auth.user.name && (
                        <div className="flex items-center gap-3">
                          <Icon name="User" size={18} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Имя</p>
                            <p className="text-sm">{auth.user.name}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Icon name="BarChart3" size={18} className="text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Расчётов</p>
                          <p className="text-sm">{calculations.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={auth.logout}
                      >
                        <Icon name="LogOut" size={18} className="mr-2" />
                        Выйти из аккаунта
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <AccountDropdown auth={auth} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}