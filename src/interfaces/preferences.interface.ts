export interface Preferences {
    language: string;
    theme: string;
    darkMode: boolean;
    scale: number;
    menuLayout: 'vertical' | 'horizontal';
    autoDarkMode?: boolean;
    preset: string;
    primaryColor: string;
    surface?: string;
    fontSize?: string;
    testRole?: string;
}

export const defaultPreferences: Preferences = {
    language: '', // No preset -> Initial browser detection
    theme: 'aura-light-orange',
    darkMode: false,
    scale: 14,
    menuLayout: 'horizontal',
    autoDarkMode: false,
    preset: 'Aura',
    primaryColor: 'orange',
    surface: 'slate',
    fontSize: '1rem'
};

// Version for preference migration - increment when defaults change significantly
export const PREFERENCES_VERSION = 2;
