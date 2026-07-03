import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PhoneCollectionModal } from './PhoneCollectionModal';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleLoginButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const containerRef = useRef(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const pendingRedirect = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function handleCredential(response) {
      api
        .post('/auth/google', { idToken: response.credential })
        .then(({ data }) => {
          setSession(data.token, data.user);
          toast.success(t('auth.login_success'));
          if (data.user.role === 'ADMIN') {
            navigate('/admin');
          } else if (!data.user.phone) {
            pendingRedirect.current = '/';
            setShowPhoneModal(true);
          } else {
            navigate('/');
          }
        })
        .catch((err) => toast.error(err.friendlyMessage));
    }

    function render() {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
      });
    }

    if (window.google) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.body.appendChild(script);
  }, [navigate, setSession, t]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Admin tomonidan hali sozlanmagan (Google Client ID kerak)"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-input bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
        </svg>
        {t('auth.login_with_google')} (hali mavjud emas)
      </button>
    );
  }

  return (
    <>
      <div ref={containerRef} className="flex w-full justify-center" />
      <PhoneCollectionModal
        open={showPhoneModal}
        onComplete={() => {
          setShowPhoneModal(false);
          navigate(pendingRedirect.current || '/');
        }}
      />
    </>
  );
}
