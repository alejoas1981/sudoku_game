export type Language = 'ru' | 'en' | 'de' | 'fr' | 'es';

export interface Translation {
    language: string;
    game: {
        title: string;
        subtitle: string;
        newGame: string;
        hint: string;
        solve: string;
        undo: string;
        redo: string;
        clear: string;
        timer: string;
        congratulations: string;
        selectCell: string;
        cellPosition: string;
        difficultyLevel: string;
        intellectualAssistant: string;
    };
    difficulty: {
        beginner: string;
        amateur: string;
        experienced: string;
        veteran: string;
        master: string;
    };
    footer: {
        language: string;
        copyright: string;
        theme: {
            title: string;
            light: string;
            dark: string;
            system: string;
        };
        install: {
            button: string;
            ios_tip: string;
        };
    };
    help: {
        title: string;
        askAssistant: string;
        description: string;
    };
    chat: {
        thinking: string;
        send: string;
        welcome: string;
        placeholder: string;
        quickQuestions: string;
        quickTips: {
            strategy: string;
            stuck: string;
            faster: string;
            rules: string;
        };
    };
}

export const AVAILABLE_LANGUAGES: { code: Language; name: string; flag: string }[] = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const DEFAULT_LANGUAGE: Language = 'ru';