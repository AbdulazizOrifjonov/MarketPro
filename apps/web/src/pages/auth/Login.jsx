import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function TelegramLoginButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/phone-verify')}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#0088cc]/40 bg-[#0088cc]/8 px-4 py-2.5 text-sm font-medium text-[#0088cc] transition-colors hover:bg-[#0088cc]/15"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#0088cc]">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.044 9.626c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.907.595z" />
      </svg>
      Telegram orqali kirish
    </button>
  );
}

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { rememberMe: true } });

  async function onSubmit(values) {
    setServerError('');
    try {
      const { data } = await api.post('/auth/login', {
        identifier: values.identifier,
        password: values.password,
      });
      setSession(data.token, data.user, values.rememberMe);
      toast.success(t('auth.login_success'));
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(location.state?.from || '/');
      }
    } catch (err) {
      setServerError(err.friendlyMessage || t('auth.invalid_credentials'));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">{t('auth.login_title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t('auth.username_or_email')}</label>
          <Input {...register('identifier')} autoComplete="username" placeholder="email@example.com" />
          {errors.identifier && <p className="mt-1 text-xs text-destructive">{t('common.required_field')}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t('auth.password')}</label>
          <Input type="password" {...register('password')} autoComplete="current-password" />
          {errors.password && <p className="mt-1 text-xs text-destructive">{t('common.required_field')}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('rememberMe')} className="h-4 w-4 rounded border-input" />
            {t('auth.remember_me')}
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            {t('auth.forgot_password')}
          </Link>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('nav.login')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">YOKI</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-2.5">
        <TelegramLoginButton />
        <GoogleLoginButton />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.no_account')}{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          {t('nav.register')}
        </Link>
      </p>
    </div>
  );
}
