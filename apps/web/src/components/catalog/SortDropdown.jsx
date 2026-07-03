import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = ['newest', 'best_selling', 'most_popular', 'highest_rated', 'price_asc', 'price_desc'];

export function SortDropdown({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
          <ArrowUpDown className="h-4 w-4" />
          {t(`sort.${value}`)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-[200px] rounded-lg border border-border bg-popover p-1 shadow-lg">
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenu.Item
              key={opt}
              onSelect={() => onChange(opt)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-accent',
                value === opt && 'font-semibold'
              )}
            >
              {t(`sort.${opt}`)}
              {value === opt && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
