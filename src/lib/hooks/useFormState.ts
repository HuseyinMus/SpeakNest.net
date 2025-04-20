'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/lib/context/ToastContext';

/**
 * Form state yönetimi için özel hook
 * @param initialValues Form başlangıç değerleri
 * @returns Form state ve işlevleri
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();

  // Input değişikliklerini işle
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
    
    // Form değişti olarak işaretle
    setIsDirty(true);
    
    // Hata varsa temizle
    if (errors[name as keyof T]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof T];
        return newErrors;
      });
    }
  }, [errors]);

  // Belirli bir alanı doğrudan güncelle
  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setIsDirty(true);
  }, []);

  // Doğrulama hatasını ayarla
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Tüm formu doğrula
  const validateForm = useCallback((validationRules: Record<keyof T, (value: any) => string | null>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    // Her alan için kuralları çalıştır
    Object.keys(validationRules).forEach((fieldName) => {
      const key = fieldName as keyof T;
      const error = validationRules[key](formData[key]);
      
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  // Form gönderme işleyicisi
  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<void>,
    validationRules?: Record<keyof T, (value: any) => string | null>,
    successMessage?: string
  ) => {
    try {
      // Doğrulama kuralları varsa doğrula
      if (validationRules) {
        const isValid = validateForm(validationRules);
        if (!isValid) return;
      }

      setIsSubmitting(true);
      await onSubmit(formData);
      
      // Başarı mesajı varsa göster
      if (successMessage) {
        toast.success(successMessage);
      }
      
      // Form artık temiz
      setIsDirty(false);
    } catch (error) {
      console.error('Form gönderimi sırasında hata:', error);
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, toast]);

  // Formu sıfırla
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    setFieldValue,
    setFieldError,
    validateForm,
    handleSubmit,
    resetForm
  };
} 