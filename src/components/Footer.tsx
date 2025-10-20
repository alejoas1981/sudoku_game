import React from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/context/TranslationContext';
import { useTheme } from '@/components/ThemeProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Laptop } from 'lucide-react';

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    
    return (
        <footer className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Settings controls */}
                <div className="flex items-center gap-4">
                    {/* Language selector */}
                    <div className="flex items-center gap-2">
                        <LanguageSelector />
                    </div>

                    {/* Theme Switcher */}
                    <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                    <Sun className="w-4 h-4" />
                                    <span>Light</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                    <Moon className="w-4 h-4" />
                                    <span>Dark</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                    <Laptop className="w-4 h-4" />
                                    <span>System</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Copyright */}
                <p className="text-sm text-muted-foreground text-center">
                    {t('footer.copyright')}
                </p>
            </div>
        </footer>
    );
};