import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

const schema = z.object({ email: z.string().email() });

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    await api.post('/auth/forgot-password', values);
    setSent(true);
  }

  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">{t('auth.forgot_password')}</h1>

      {sent ? (
        <p className="mt-6 text-sm text-muted-foreground">{t('auth.reset_email_sent')}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('auth.email')}</label>
            <Input type="email" {...register('email')} autoComplete="email" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{t('common.required_field')}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('auth.reset_password')}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          {t('common.back')}
        </Link>
      </p>
    </div>
  );
}
