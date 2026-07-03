import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductGrid';

export function ProductRail({ title, endpoint }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    api
      .get(endpoint)
      .then(({ data }) => active && setProducts(data.products))
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  if (loaded && products.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold sm:text-xl">{title}</h2>
      <ProductGrid products={products} isLoading={isLoading} />
    </section>
  );
}
