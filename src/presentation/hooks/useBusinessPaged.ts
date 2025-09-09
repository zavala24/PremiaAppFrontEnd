import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../infrastructure/http/api";

// --- API contracts ---
export type ApiBusiness = {
  idNegocio: number;
  nombre: string;
  categoria?: string | null;
  urlLogo?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;
  direccion?: string | null;
  descripcion?: string | null;
};

type ApiPaged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

type ApiEnvelope<T> = {
  status?: number;
  message?: string | null;
  data?: T | null;
};

export function useBusinessesPaged(defaultPageSize = 10) {
  const pageSizeRef = useRef(defaultPageSize);
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ApiBusiness[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await api.get<ApiEnvelope<ApiPaged<ApiBusiness>>>(
          "/Negocio/GetNegociosPaged",
          {
            params: {
              page: opts.reset ? 1 : page,
              pageSize: pageSizeRef.current,
              search: query || undefined,
            },
          }
        );

        const paged = res.data?.data;
        if (!paged) throw new Error("Respuesta inválida");

        const newItems = opts.reset ? paged.items : [...items, ...paged.items];
        setItems(newItems);
        setHasNext(paged.hasNext);
      } finally {
        setLoading(false);
      }
    },
    [loading, page, query, items]
  );

  const onEndReached = useCallback(async () => {
    if (loading || !hasNext) return;
    setPage((p) => p + 1);
  }, [loading, hasNext]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      setPage(1);
      await load({ reset: true });
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, load]);

  // Carga cuando cambia page (paginación)
  useEffect(() => {
    if (page === 1) return;
    load();
  }, [page]); // eslint-disable-line

  // Debounce para query -> reinicia lista
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load({ reset: true });
    }, 300);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line

  // Primera carga
  useEffect(() => {
    load({ reset: true });
  }, []); // eslint-disable-line

  // helper: estado de “primera carga” vacío
  const initialLoading = useMemo(() => items.length === 0 && (loading || refreshing), [items, loading, refreshing]);

  return {
    // datos
    items,
    hasNext,
    // ui state
    loading,
    refreshing,
    initialLoading,
    // acciones
    onEndReached,
    onRefresh,
    // búsqueda
    query,
    setQuery,
  };
}
