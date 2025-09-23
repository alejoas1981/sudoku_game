import React from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/hooks/useTranslation';

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    
    return (
        <footer className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Language selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('footer.language')}:</span>
                    <LanguageSelector />
                </div>
                
                {/* Copyright */}
                <p className="text-sm text-muted-foreground text-center">
                    {t('footer.copyright')}
                </p>
            </div>
        </footer>
    );
};