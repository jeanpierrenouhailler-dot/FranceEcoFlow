import { useCallback, useEffect, useState } from 'react';
import { FlowParams } from '../lib/api.ts';

export function useUrlParams(defaultParams: FlowParams) {
  const parseParams = (): FlowParams => {
    if (typeof window === 'undefined') return defaultParams;
    const search = new URLSearchParams(window.location.search);
    return {
      reporter: search.get('reporter') || defaultParams.reporter || 'FR',
      flow: (search.get('flow') as 'import' | 'export') || defaultParams.flow || 'import',
      product: search.get('product') || defaultParams.product || 'crude_oil',
      from: search.get('from') ? parseInt(search.get('from')!, 10) : defaultParams.from || 2015,
      to: search.get('to') ? parseInt(search.get('to')!, 10) : defaultParams.to || 2026,
      partner: search.get('partner') || defaultParams.partner || 'all',
    };
  };

  const [params, setParamsState] = useState<FlowParams>(parseParams);

  const updateParams = useCallback((newParams: Partial<FlowParams>) => {
    setParamsState((prev) => {
      const merged = { ...prev, ...newParams };
      const search = new URLSearchParams();
      if (merged.reporter) search.set('reporter', merged.reporter);
      if (merged.flow) search.set('flow', merged.flow);
      if (merged.product) search.set('product', merged.product);
      if (merged.from) search.set('from', String(merged.from));
      if (merged.to) search.set('to', String(merged.to));
      if (merged.partner && merged.partner !== 'all') search.set('partner', merged.partner);

      const newUrl = `${window.location.pathname}?${search.toString()}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
      return merged;
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setParamsState(parseParams());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { params, updateParams };
}
