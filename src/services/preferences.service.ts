import { BehaviorSubject, Observable } from 'rxjs';

import { inject, Injectable } from '@angular/core';

import { LogFactoryService, Logger } from '../factories/logger.factory';
import {
    defaultPreferences, Preferences, PREFERENCES_VERSION
} from '../interfaces/preferences.interface';
import { BrowserStorageService } from './storage.service';

const LOCAL_STORAGE_KEY = 'user-preferences';
const VERSION_KEY = 'preferences-version';

@Injectable({
    providedIn: 'root'
})
export class PreferencesService {
    private preferencesSubject!: BehaviorSubject<Preferences>;
    public preferences$!: Observable<Preferences>;
    private logger: Logger;
    private logFactory = inject(LogFactoryService);
    private storageService = inject(BrowserStorageService);

    constructor() {
        // Initialize logger
        this.logger = this.logFactory.createLogger('PreferencesService');

        // Initialize preferences after services are available
        const initialPreferences = this.loadPreferences();
        this.preferencesSubject = new BehaviorSubject<Preferences>(initialPreferences);
        this.preferences$ = this.preferencesSubject.asObservable();

        // Check for version changes and reset if needed
        const storedVersion = this.storageService.getLocal<string>(VERSION_KEY);
        const currentVersion = PREFERENCES_VERSION.toString();

        // If version has changed, reset preferences to defaults
        if (storedVersion !== currentVersion) {
            this.logger.debug('Preferences version changed, resetting to defaults', {
                storedVersion,
                currentVersion
            });
            this.storageService.removeLocal(LOCAL_STORAGE_KEY);
            this.storageService.setLocal(VERSION_KEY, currentVersion);
            this.savePreferences(defaultPreferences);
        } else if (!this.storageService.hasItem(LOCAL_STORAGE_KEY)) {
            // Ensure defaults are saved if no preferences exist yet
            this.savePreferences(defaultPreferences);
        } else {
            // Ensure that new default preference keys are added if they don't exist in localStorage
            const currentStored = this.loadPreferences();
            const merged = { ...defaultPreferences, ...currentStored };
            if (JSON.stringify(currentStored) !== JSON.stringify(merged)) {
                this.savePreferences(merged);
            }
        }
    }

    /**
     * Loads user preferences from localStorage.
     * If no preferences are found, returns the default preferences.
     */
    private loadPreferences(): Preferences {
        const stored = this.storageService.getLocal<Preferences>(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                // Merge with defaults to ensure all keys are present and defaults are updated if new keys are added
                return { ...defaultPreferences, ...stored };
            } catch (e) {
                this.logger.error('Error parsing user preferences from localStorage', e);
                return { ...defaultPreferences }; // Return defaults on error
            }
        }
        return { ...defaultPreferences };
    }

    /**
     * Saves user preferences to localStorage.
     * Emits the new preferences through the BehaviorSubject.
     * @param preferences The preferences to save.
     */
    private savePreferences(preferences: Preferences): void {
        const success = this.storageService.setLocal(LOCAL_STORAGE_KEY, preferences);
        if (success) {
            this.preferencesSubject.next(preferences);
        } else {
            this.logger.error('Error saving user preferences to localStorage');
        }
    }

    /**
     * Retrieves the current user preferences.
     * @returns The current preferences object.
     */
    getPreferences(): Preferences {
        return this.preferencesSubject.getValue();
    }

    /**
     * Updates a specific preference key with a new value.
     * @param key The preference key to update.
     * @param value The new value for the preference key.
     */
    updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
        const currentPrefs = this.getPreferences();
        const updatedPrefs = {
            ...currentPrefs,
            [key]: value
        };
        this.savePreferences(updatedPrefs);
    }

    /**
     * Resets all user preferences to their default values.
     */
    resetPreferences(): void {
        this.savePreferences({ ...defaultPreferences });
    }

    /**
     * Updates the theme preferences.
     * @param preset The preset name for the theme.
     * @param primaryColor The primary color for the theme.
     * @param isDark Whether the theme is dark mode or light mode.
     */
    updateTheme(preset: string, primaryColor: string, isDark: boolean): void {
        const newThemeName = `${preset}-${isDark ? 'dark' : 'light'}-${primaryColor}`;
        const updatedPrefs = {
            ...this.getPreferences(),
            theme: newThemeName,
            preset: preset,
            primaryColor: primaryColor,
            darkMode: isDark
        };
        this.savePreferences(updatedPrefs);
    }
}
