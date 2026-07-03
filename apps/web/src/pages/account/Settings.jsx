import { useTranslation } from 'react-i18next';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useUiStore();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">{t('account.settings')}</h1>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Til / Язык / Language</h2>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={i18n.language === lang.code ? 'default' : 'outline'}
              size="sm"
              onClick={() => i18n.changeLanguage(lang.code)}
            >
              {lang.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">Theme</h2>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </Button>
      </div>

      <Button
        variant="destructive"
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        <LogOut className="h-4 w-4" /> {t('nav.logout')}
      </Button>
    </div>
  );
}
