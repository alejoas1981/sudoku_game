import React, { useState, useEffect } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/context/TranslationContext';
import { useTheme } from '@/components/ThemeProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
    prompt(): Promise<void>;
}

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) {
            return;
        }
        installPrompt.prompt();
        installPrompt.userChoice.then(() => {
            setInstallPrompt(null);
        });
    };
    
    return (
        <footer className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center gap-4">
                    <LanguageSelector />

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

                    {installPrompt && (
                        <Button 
                            onClick={handleInstallClick} 
                            variant="outline" 
                            className="h-8 text-xs"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install App
                        </Button>
                    )}
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                    {t('footer.copyright')}
                </p>
            </div>
        </footer>
    );
};