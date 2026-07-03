import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

const schema = z.object({ password: z.string().min(6).max(100) });

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setServerError('');
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      toast.success(t('auth.reset_password'));
      navigate('/login');
    } catch (err) {
      setServerError(err.friendlyMessage || t('common.error_occurred'));
    }
  }

  if (!token) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        Invalid or missing reset token.{' '}
        <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
          {t('auth.forgot_password')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">{t('auth.reset_password')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t('auth.password')}</label>
          <Input type="password" {...register('password')} autoComplete="new-password" />
          {errors.password && <p className="mt-1 text-xs text-destructive">{t('common.required_field')}</p>}
        </div>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('auth.reset_password')}
        </Button>
      </form>
    </div>
  );
}
