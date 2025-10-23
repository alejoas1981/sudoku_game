import React, { useState, useEffect } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/context/TranslationContext';
import { useTheme } from '@/components/ThemeProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
    prompt(): Promise<void>;
}

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect if the app is running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
        }

        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIos(isIosDevice);

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
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then(() => {
            setInstallPrompt(null);
        });
    };
    
    return (
        <footer className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col items-center justify-between gap-6">
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <LanguageSelector />
                    <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder={t('footer.theme.title')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">
                                <div className="flex items-center gap-2"><Sun className="w-4 h-4" /><span>{t('footer.theme.light')}</span></div>
                            </SelectItem>
                            <SelectItem value="dark">
                                <div className="flex items-center gap-2"><Moon className="w-4 h-4" /><span>{t('footer.theme.dark')}</span></div>
                            </SelectItem>
                            <SelectItem value="system">
                                <div className="flex items-center gap-2"><Laptop className="w-4 h-4" /><span>{t('footer.theme.system')}</span></div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {!isStandalone && (
                    <div className="flex justify-center">
                        {installPrompt && !isIos && (
                            <Button onClick={handleInstallClick} variant="outline" className="h-9 text-xs">
                                <Download className="w-4 h-4 mr-2" />
                                {t('footer.install.button')}
                            </Button>
                        )}
                        {isIos && (
                            <div className="text-center text-xs text-muted-foreground bg-accent p-2 rounded-md">
                                <p>{t('footer.install.ios_tip')}</p>
                            </div>
                        )}
                    </div>
                )}
                
                <p className="text-sm text-muted-foreground text-center">
                    {t('footer.copyright')}
                </p>
            </div>
        </footer>
    );
};