
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Language, Translation, DEFAULT_LANGUAGE } from '@/lib/i18n';
import { saveLanguage, loadLanguage } from '@/lib/storage';

interface TranslationContextType {
    currentLanguage: Language;
    changeLanguage: (language: Language) => void;
    translations: Translation | null;
    loading: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => loadLanguage() || DEFAULT_LANGUAGE);
    const [translations, setTranslations] = useState<Translation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTranslation = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/lang/${currentLanguage}.json?v=${new Date().getTime()}`);
                if (!response.ok) {
                    throw new Error(`Failed to load translation: ${response.status}`);
                }
                const translation: Translation = await response.json();
                setTranslations(translation);
            } catch (error) {
                console.error('Error loading translation:', error);
                if (currentLanguage !== DEFAULT_LANGUAGE) {
                    try {
                        const fallbackResponse = await fetch(`/lang/${DEFAULT_LANGUAGE}.json?v=${new Date().getTime()}`);
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

    const changeLanguage = useCallback((language: Language) => {
        setCurrentLanguage(language);
        saveLanguage(language);
    }, []);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        if (!translations) return key;

        const keys = key.split('.');
        let value: any = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        if (params) {
            return Object.entries(params).reduce(
                (str, [param, val]) => str.replace(`{${param}}`, String(val)),
                value
            );
        }

        return value;
    }, [translations]);

    const value = useMemo(() => ({
        currentLanguage,
        changeLanguage,
        translations,
        loading,
        t
    }), [currentLanguage, changeLanguage, translations, loading, t]);


    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = (): TranslationContextType => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
