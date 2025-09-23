import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { AVAILABLE_LANGUAGES, Language } from '@/lib/i18n';

export const LanguageSelector: React.FC = () => {
    const { currentLanguage, changeLanguage, t } = useTranslation();
    
    return (
        <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={currentLanguage} onValueChange={(value) => changeLanguage(value as Language)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {AVAILABLE_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};