import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Business } from "../../domain/entities/Bussiness";
import { BusinessRepository } from "../../infrastructure/repositories/BusinessRepository";
import { useDebouncedValue } from "./useDebouncedValue";
import { BusinessService } from "../../application/services/BussinessService";

const service = new BusinessService(new BusinessRepository());

type State = {
  items: Business[];
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  refreshing: boolean;
};

export function useBusinessesPaged(initialPageSize = 10) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 450);

  const [state, setState] = useState<State>({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
    loading: false,
    refreshing: false,
  });

  const pageSizeRef = useRef(initialPageSize);

  const load = useCallback(async (nextPage: number, replace = false) => {
    setState((s) => ({ ...s, loading: !replace && nextPage > 1 ? true : s.loading, refreshing: replace }));
    try {
      const res = await service.listPaged({
        page: nextPage,
        pageSize: pageSizeRef.current,
        search: debounced.trim() || undefined,
      });

      const paged = res.data!;
      setState((s) => ({
        items: replace ? paged.items : [...s.items, ...paged.items],
        page: paged.page,
        totalPages: paged.totalPages,
        total: paged.total,
        loading: false,
        refreshing: false,
      }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, refreshing: false }));
      throw e;
    }
  }, [debounced]);

  // Inicial / cuando cambia la búsqueda
  useEffect(() => {
    load(1, true);
  }, [debounced, load]);

  const hasNext = useMemo(
    () => state.page < state.totalPages,
    [state.page, state.totalPages]
  );

  const onEndReached = useCallback(() => {
    if (!state.loading && hasNext) load(state.page + 1, false);
  }, [state.loading, hasNext, load, state.page]);

  const onRefresh = useCallback(() => load(1, true), [load]);

  return {
    ...state,
    query,
    setQuery,
    onEndReached,
    onRefresh,
    hasNext,
  };
}
