'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Veri çekme işlemleri için genel hook
 * @param fetchFunction Veri çekme fonksiyonu
 * @param defaultData Varsayılan veri
 * @param dependencies Bağımlılıklar (useEffect için)
 * @returns Veri, yükleme durumu, hata ve yenileme fonksiyonu
 */
export function useFetch<T>(
  fetchFunction: () => Promise<T>,
  defaultData: T,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Veri çekme fonksiyonu
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      setError(err instanceof Error ? err.message : 'Veri çekilemedi');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction]);

  // Veriyi yenileme fonksiyonu
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // İlk render'da ve bağımlılıklar değiştiğinde veriyi çek
  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchFunction]);

  return { data, isLoading, error, refresh };
}

/**
 * Sayfalı veri çekme hook'u
 * @param fetchFunction Sayfa parametresi alan veri çekme fonksiyonu 
 * @param pageSize Sayfa boyutu
 * @returns Veri, yükleme durumu, hata ve sayfalama fonksiyonları
 */
export function usePaginatedFetch<T>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  // Veri çekme fonksiyonu
  const fetchPage = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunction(page, pageSize);
      setData(result.data);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      setError(err instanceof Error ? err.message : 'Veri çekilemedi');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, pageSize]);

  // Sonraki sayfaya geç
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchPage(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchPage]);

  // Önceki sayfaya geç
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      fetchPage(currentPage - 1);
    }
  }, [currentPage, fetchPage]);

  // Belirli bir sayfaya git
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchPage(page);
    }
  }, [totalPages, fetchPage]);

  // İlk renderda veriyi çek
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => fetchPage(currentPage)
  };
} 