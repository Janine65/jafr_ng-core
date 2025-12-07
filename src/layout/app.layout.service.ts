import { Subject, Subscription } from 'rxjs';

import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { updatePreset } from '@primeuix/styled';

import { STYLE_CONFIG, THEME_CONFIG } from '../config/tokens';
import { LogFactoryService, Logger } from '../factories/logger.factory';
import { Preferences } from '../interfaces/preferences.interface';
import { PreferencesService } from '../services/preferences.service';

interface ViewTransition {
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
    finished: Promise<void>;
    skipTransition(): void;
}

interface DocumentWithViewTransition {
    startViewTransition?: (updateCallback: () => Promise<void> | void) => ViewTransition;
}

export interface LayoutConfig {
    ripple?: boolean;
    inputStyle?: string;
    menuMode?: 'static' | 'overlay';
    menuType?: 'vertical' | 'horizontal';
    colorScheme?: string;
    theme?: string;
    scale?: number;
    staticMenuDesktopInactive?: boolean;
    staticMenuMobileActive?: boolean;
    overlayMenuActive?: boolean;
    topbarTheme?: string;
    menuTheme?: string;
    layoutTheme?: string;
    primary?: string;
    surface?: string;
    preset?: string;
    componentTheme?: string;
    darkTheme?: boolean;
    staticMenuNoMargin?: boolean;
    fontSize?: string;
    menuHoverActive?: boolean;
}

interface LayoutState {
    staticMenuDesktopInactive?: boolean;
    overlayMenuActive?: boolean;
    configSidebarVisible?: boolean;
    staticMenuMobileActive?: boolean;
    menuHoverActive?: boolean;
}

interface MenuChangeEvent {
    key: string;
    routeEvent?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private preferencesService = inject(PreferencesService);
    private logFactory = inject(LogFactoryService);
    private styleConfig = inject(STYLE_CONFIG);
    private themeConfig = inject(THEME_CONFIG);
    private logger: Logger;

    private _config = signal<LayoutConfig>(this.styleConfig);

    layoutConfig = this._config.asReadonly();

    updateLayoutConfig(newConfig: Partial<LayoutConfig>) {
        this.logger.debug('Updating layout config...');
        this._config.update((currentConfig) => ({ ...currentConfig, ...newConfig }));
    }

    _state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    };

    layoutState = signal<LayoutState>(this._state);

    getLayoutInfo(): { config: LayoutConfig; state: LayoutState } {
        return {
            config: this.layoutConfig(),
            state: this.layoutState()
        };
    }

    private configUpdate = new Subject<LayoutConfig>();

    private overlayOpen = new Subject<null>();

    private menuSource = new Subject<MenuChangeEvent>();

    private resetSource = new Subject();

    menuSource$ = this.menuSource.asObservable();

    resetSource$ = this.resetSource.asObservable();

    configUpdate$ = this.configUpdate.asObservable();

    overlayOpen$ = this.overlayOpen.asObservable();

    theme = computed(() => (this.layoutConfig()?.darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().staticMenuMobileActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;
    private preferencesSubscription: Subscription | undefined;
    private darkModeMediaQuery: MediaQueryList | undefined;
    private darkModeListener: ((e: MediaQueryListEvent) => void) | undefined;

    constructor() {
        this.logger = this.logFactory.createLogger('LayoutService');

        // Initialize OS dark mode detection
        this.initializeOSDarkModeDetection();
        // Subscribe to preferences to update layout
        this.preferencesSubscription = this.preferencesService.preferences$.subscribe((prefs: Preferences) => {
            const config = this.layoutConfig();
            const defaultConfig = this.styleConfig;
            const newConfig: Partial<LayoutConfig> = {};

            // Handle autoDarkMode preference
            if (prefs.autoDarkMode && this.darkModeMediaQuery) {
                // If auto dark mode is enabled, use OS preference
                const osPrefersDark = this.darkModeMediaQuery.matches;
                this.logger.debug(`Auto dark mode enabled, applying OS preference: ${osPrefersDark}`);
                newConfig.darkTheme = osPrefersDark;
            } else if (prefs.darkMode !== undefined && prefs.darkMode !== config.darkTheme && prefs.darkMode !== defaultConfig.darkTheme) {
                // If auto dark mode is disabled, use manual preference
                newConfig.darkTheme = prefs.darkMode;
            }

            // Only apply preferences that are explicitly set and differ from current config
            if (prefs.theme !== undefined && prefs.theme !== config.theme && prefs.theme !== defaultConfig.theme) {
                newConfig.theme = prefs.theme;
            }
            if (prefs.scale !== undefined && prefs.scale !== config.scale && prefs.scale !== defaultConfig.scale) {
                newConfig.scale = prefs.scale;
            }
            if (prefs.menuLayout !== undefined && prefs.menuLayout !== config.menuType && prefs.menuLayout !== defaultConfig.menuType) {
                if (this.isDesktop()) {
                    newConfig.menuType = prefs.menuLayout;
                    // When changing menu type from preferences, also adjust menu mode appropriately
                    if (prefs.menuLayout === 'horizontal') {
                        newConfig.menuMode = 'overlay';
                    }
                }
            }
            if (prefs.preset !== undefined && prefs.preset !== config.preset && prefs.preset !== defaultConfig.preset) {
                newConfig.preset = prefs.preset;
            }
            if (prefs.primaryColor !== undefined && prefs.primaryColor !== config.primary && prefs.primaryColor !== defaultConfig.primary) {
                newConfig.primary = prefs.primaryColor;
            }
            if (prefs.surface !== undefined && prefs.surface !== config.surface && prefs.surface !== defaultConfig.surface) {
                newConfig.surface = prefs.surface;
            }
            const newFontSize = prefs.fontSize ?? (prefs.scale !== undefined ? `${prefs.scale}px` : undefined);
            if (newFontSize !== undefined && newFontSize !== config.fontSize && newFontSize !== defaultConfig.fontSize) {
                newConfig.fontSize = newFontSize;
            }

            if (Object.keys(newConfig).length > 0) {
                this.logger.debug('Applying user preferences to layout config:', newConfig);
                this.updateLayoutConfig(newConfig);
            }
        });

        // Effect to save layout changes back to preferences
        effect(() => {
            const config = this.layoutConfig();
            // Wait for initial preferences to be loaded
            if (!this.initialized) {
                return;
            }

            this.logger.debug('Layout config changed, updating user preferences.');
            const currentPrefs = this.preferencesService.getPreferences();

            if (config.darkTheme !== undefined && config.darkTheme !== currentPrefs.darkMode) this.preferencesService.updatePreference('darkMode', config.darkTheme);
            if (config.scale !== undefined && config.scale !== currentPrefs.scale) this.preferencesService.updatePreference('scale', config.scale);
            if (config.theme !== undefined && config.theme !== currentPrefs.theme) this.preferencesService.updatePreference('theme', config.theme);
            if (config.menuType !== undefined && config.menuType !== currentPrefs.menuLayout) {
                if (this.isDesktop()) {
                    this.preferencesService.updatePreference('menuLayout', config.menuType);
                }
            }
            if (config.preset !== undefined && config.preset !== currentPrefs.preset) this.preferencesService.updatePreference('preset', config.preset);
            if (config.primary !== undefined && config.primary !== currentPrefs.primaryColor) this.preferencesService.updatePreference('primaryColor', config.primary);
            if (config.surface !== undefined && config.surface !== currentPrefs.surface) this.preferencesService.updatePreference('surface', config.surface);
            if (config.fontSize !== undefined && config.fontSize !== currentPrefs.fontSize) this.preferencesService.updatePreference('fontSize', config.fontSize);
        });

        // Effects for UI updates
        effect(() => {
            const config = this.layoutConfig();
            if (config) {
                this.onConfigUpdate();
                if (config.fontSize) {
                    this.logger.debug(`Applying font size: ${config.fontSize}`);
                    this.applyFontSize(config.fontSize);
                }
            }
        });

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized) {
                this.initialized = true;
                this.toggleDarkMode(config); // Apply dark mode on init without transition
                return;
            }

            this.handleDarkModeTransition(config);
        });

        // Note: Horizontal menus typically work best with overlay mode
        // but we allow the configuration to be explicitly set
        window.addEventListener('resize', () => this.onResize());
        this.onResize();

        // Apply custom Suva theme on initialization
        this.applySuvaTheme();
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        if ((document as DocumentWithViewTransition).startViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
            this.onTransitionEnd();
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        const doc = document as DocumentWithViewTransition;
        if (!doc.startViewTransition) {
            return;
        }
        const transition = doc.startViewTransition(() => {
            this.toggleDarkMode(config);
        });

        transition.ready
            .then(() => {
                this.onTransitionEnd();
            })
            .catch((e: unknown) => {
                this.logger.error('View transition failed:', e);
                this.toggleDarkMode(config); // Fallback to simple toggle
                this.onTransitionEnd();
            });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        this.logger.debug(`Toggling dark mode to: ${_config.darkTheme}`);
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    private onTransitionEnd() {
        this.transitionComplete.set(true);
        setTimeout(() => {
            this.transitionComplete.set(false);
        });
    }

    private applyFontSize(fontSize: string) {
        document.documentElement.style.fontSize = fontSize;
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
            this.logger.debug(`Overlay menu toggled: ${this.layoutState().overlayMenuActive}`);

            if (this.layoutState().overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
            this.logger.debug(`Static desktop menu toggled: ${this.layoutState().staticMenuDesktopInactive}`);
        } else {
            this.layoutState.update((prev) => ({ ...prev, staticMenuMobileActive: !this.layoutState().staticMenuMobileActive }));
            this.logger.debug(`Static mobile menu toggled: ${this.layoutState().staticMenuMobileActive}`);

            if (this.layoutState().staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    hideMenu() {
        this.layoutState.update((prev) => ({
            ...prev,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false
        }));
    }

    onResize() {
        const currentConfig = this.layoutConfig();
        if (this.isDesktop()) {
            const userPrefs = this.preferencesService.getPreferences();
            // Use default config if no user preference is set
            const preferredMenuType = userPrefs.menuLayout || this.styleConfig.menuType || 'vertical';
            const preferredMenuMode = (preferredMenuType === 'horizontal' ? 'overlay' : this.styleConfig.menuMode) || 'static';

            if (currentConfig.menuType !== preferredMenuType || currentConfig.menuMode !== preferredMenuMode) {
                this.logger.debug(`Resized to desktop, applying preferred layout: ${preferredMenuType}/${preferredMenuMode}`);
                this.updateLayoutConfig({
                    menuType: preferredMenuType,
                    menuMode: preferredMenuMode
                });
            }
        } else {
            // isMobile
            if (currentConfig.menuType !== 'vertical' || currentConfig.menuMode !== 'overlay') {
                this.logger.debug('Resized to mobile, forcing vertical/overlay menu.');
                this.updateLayoutConfig({ menuType: 'vertical', menuMode: 'overlay' });
            }
        }
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }

    onConfigUpdate() {
        this.configUpdate.next(this.layoutConfig());
    }

    onMenuStateChange(event: MenuChangeEvent) {
        this.menuSource.next(event);
    }

    reset() {
        this.logger.debug('Resetting layout configuration to defaults');
        this.updateLayoutConfig(this.styleConfig);
        this.applySuvaTheme();
        this.resetSource.next(true);
    }

    private applySuvaTheme() {
        this.logger.debug('Applying custom Suva theme');
        try {
            updatePreset(this.themeConfig);
        } catch (error) {
            this.logger.error('Failed to apply custom Suva theme:', error);
        }
    }

    /**
     * Initialize OS dark mode detection
     * Sets up a listener for system color scheme changes
     */
    private initializeOSDarkModeDetection(): void {
        if (typeof window === 'undefined' || !window.matchMedia) {
            this.logger.warn('matchMedia not supported, auto dark mode will not work');
            return;
        }

        // Create media query
        this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Create listener function
        this.darkModeListener = (e: MediaQueryListEvent) => {
            const prefs = this.preferencesService.getPreferences();
            if (prefs.autoDarkMode) {
                this.logger.debug(`OS dark mode changed to: ${e.matches}, applying automatically`);
                this.updateLayoutConfig({ darkTheme: e.matches });
            }
        };

        // Add listener for changes
        this.darkModeMediaQuery.addEventListener('change', this.darkModeListener);

        // Apply initial OS preference if autoDarkMode is enabled
        const prefs = this.preferencesService.getPreferences();
        if (prefs.autoDarkMode) {
            const osPrefersDark = this.darkModeMediaQuery.matches;
            this.logger.debug(`Auto dark mode enabled, OS prefers dark: ${osPrefersDark}`);
            this.updateLayoutConfig({ darkTheme: osPrefersDark });
        }
    }

    /**
     * Get current OS dark mode preference
     */
    getOSDarkModePreference(): boolean {
        if (this.darkModeMediaQuery) {
            return this.darkModeMediaQuery.matches;
        }
        return false;
    }

    /**
     * Cleanup method to remove event listeners
     */
    ngOnDestroy(): void {
        if (this.darkModeMediaQuery && this.darkModeListener) {
            this.darkModeMediaQuery.removeEventListener('change', this.darkModeListener);
        }
        if (this.preferencesSubscription) {
            this.preferencesSubscription.unsubscribe();
        }
    }
}
