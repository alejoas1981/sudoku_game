import { useState, useEffect } from 'react';
import { Language, Translation, DEFAULT_LANGUAGE } from '@/lib/i18n';
import { saveLanguage, loadLanguage } from '@/lib/storage';

export const useTranslation = () => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => loadLanguage() || DEFAULT_LANGUAGE);
    
    const [translations, setTranslations] = useState<Translation | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Load translation file when language changes
    useEffect(() => {
        const loadTranslation = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/lang/${currentLanguage}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load translation: ${response.status}`);
                }
                const translation: Translation = await response.json();
                setTranslations(translation);
            } catch (error) {
                console.error('Error loading translation:', error);
                // Fallback to default language if current language fails
                if (currentLanguage !== DEFAULT_LANGUAGE) {
                    try {
                        const fallbackResponse = await fetch(`/lang/${DEFAULT_LANGUAGE}.json`);
                        const fallbackTranslation: Translation = await fallbackResponse.json();
                        setTranslations(fallbackTranslation);
                        setCurrentLanguage(DEFAULT_LANGUAGE);
                    } catch (fallbackError) {
                        console.error('Error loading fallback translation:', fallbackError);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        
        loadTranslation();
    }, [currentLanguage]);
    
    const changeLanguage = async (language: Language) => {
        setCurrentLanguage(language);
        saveLanguage(language);
    };
    
    // Helper function to get nested translation with parameter replacement
    const t = (key: string, params?: Record<string, string | number>): string => {
        if (!translations) return key;
        
        const keys = key.split('.');
        let value: any = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        if (typeof value !== 'string') {
            return key;
        }
        
        // Replace parameters in translation string
        if (params) {
            return Object.entries(params).reduce(
                (str, [param, val]) => str.replace(`{${param}}`, String(val)),
                value
            );
        }
        
        return value;
    };
    
    return {
        currentLanguage,
        changeLanguage,
        translations,
        loading,
        t
    };
};