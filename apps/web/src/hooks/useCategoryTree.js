import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useCategoryTree() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/categories/tree')
      .then(({ data }) => {
        if (active) setCategories(data.categories);
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { categories, isLoading };
}
