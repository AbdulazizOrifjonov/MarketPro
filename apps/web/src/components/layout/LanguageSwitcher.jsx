import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Language switcher"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{i18n.language}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {LANGUAGES.map((lang) => (
            <DropdownMenu.Item
              key={lang.code}
              onSelect={() => i18n.changeLanguage(lang.code)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm outline-none hover:bg-accent',
                i18n.language === lang.code && 'font-semibold'
              )}
            >
              {lang.label}
              {i18n.language === lang.code && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
