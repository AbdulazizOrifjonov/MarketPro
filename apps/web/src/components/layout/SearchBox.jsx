import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, Clock, TrendingUp, FolderTree } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { localizedField } from '@/lib/localize';
import { formatUZS, cn } from '@/lib/utils';

const HISTORY_KEY = 'marketpro_search_history';
const MAX_HISTORY = 6;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function pushHistory(term) {
  if (!term.trim()) return;
  const next = [term, ...getHistory().filter((h) => h.toLowerCase() !== term.toLowerCase())].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function flattenCategories(list) {
  return list.flatMap((c) => [c, ...flattenCategories(c.children || [])]);
}

export function SearchBox({ className, onNavigate }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { categories } = useCategoryTree();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState(getHistory());
  const debouncedQuery = useDebounce(query, 300);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const matchedCategories = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return flatCategories
      .filter((c) => [c.nameUz, c.nameRu, c.nameEn].some((n) => n?.toLowerCase().includes(q)))
      .slice(0, 3);
  }, [flatCategories, debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    let active = true;
    api
      .get('/products', { params: { q: debouncedQuery, limit: 5 } })
      .then(({ data }) => active && setSuggestions(data.products))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function go(term) {
    const next = pushHistory(term);
    if (next) setHistory(next);
    setIsOpen(false);
    navigate(`/catalog${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
    onNavigate?.();
  }

  function goToCategory(category) {
    pushHistory(localizedField(category, 'name', i18n.language));
    setIsOpen(false);
    navigate(`/catalog?category=${category.slug}`);
    onNavigate?.();
  }

  function handleSubmit(e) {
    e.preventDefault();
    go(query);
  }

  function removeHistoryItem(term, e) {
    e.stopPropagation();
    const next = getHistory().filter((h) => h !== term);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  }

  const showDropdown =
    isOpen && (suggestions.length > 0 || matchedCategories.length > 0 || (!query.trim() && history.length > 0));

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={t('nav.search_placeholder')}
            className="pl-9 pr-8"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-xl">
          {!query.trim() && history.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Qidiruv tarixi</p>
              {history.map((h) => (
                <button
                  key={h}
                  onClick={() => go(h)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {h}
                  </span>
                  <X className="h-3.5 w-3.5 text-muted-foreground" onClick={(e) => removeHistoryItem(h, e)} />
                </button>
              ))}
            </div>
          )}

          {matchedCategories.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Kategoriyalar</p>
              {matchedCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => goToCategory(c)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <FolderTree className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 flex-1">{localizedField(c, 'name', i18n.language)}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Mahsulotlar</p>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go(localizedField(p, 'name', i18n.language))}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <img src={p.images?.[0]?.url} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                  <span className="line-clamp-1 flex-1">{localizedField(p, 'name', i18n.language)}</span>
                  <span className="shrink-0 font-medium">{formatUZS(p.discountPrice ?? p.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
