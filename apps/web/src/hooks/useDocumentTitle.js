import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | MarketPro Uzbekistan` : 'MarketPro Uzbekistan';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
