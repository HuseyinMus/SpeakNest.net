import { useAuth as useAuthFromContext } from '@/lib/context/AuthContext';

// Bu hook, yeni context-based hook'a bir referans olarak hizmet eder
// ve geriye dönük uyumluluk için korunmuştur.
export function useAuth() {
  return useAuthFromContext();
} 