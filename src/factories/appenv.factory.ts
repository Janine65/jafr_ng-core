import { CoreEnvironment } from '../interfaces/environment.interface';
import { EnvironmentService } from '../services/environment.service';

/**
 * App environment factory function that loads runtime configuration
 * before the Angular application starts.
 *
 * This ensures that external configuration is available when services are instantiated.
 */
export function appCoreEnvironmentFactory(environmentService: EnvironmentService): () => Promise<void> {
    return async (): Promise<void> => {
        try {
            console.log('Loading runtime configuration...');

            // Load runtime configuration from external source
            const config = await loadRuntimeConfig();

            // Update the environment service with the loaded config
            environmentService.updateFromRuntimeConfig(config);
        } catch (error) {
            console.warn('Failed to load runtime configuration, using defaults:', error);
        }
    };
}

/**
 * Loads runtime configuration from external config file.
 * This is typically mounted via Kubernetes ConfigMap in production.
 * In development, it can be overridden by the developer service.
 * It also merges a local override file if it exists.
 */
async function loadRuntimeConfig(): Promise<Partial<CoreEnvironment>> {
    // Check for developer environment override first
    const developerOverride = checkDeveloperOverride();
    if (developerOverride) {
        console.log('🔧 Using developer environment override:', {
            stage: developerOverride.stage,
            apiUrl: developerOverride.apiUrl
        });
        return developerOverride;
    }

    // Fetch the base environment config
    const baseConfigResponse = await fetch('/assets/config/environment.json');
    if (!baseConfigResponse.ok) {
        if (baseConfigResponse.status === 404) {
            console.warn('Runtime config file not found!');
        } else {
            console.error(`Failed to fetch runtime config: HTTP ${baseConfigResponse.status}: ${baseConfigResponse.statusText}`);
        }
        console.error('Could not load runtime config. Aborting initialization.');
        window.location.href = '/500';
        // Return a promise that never resolves to halt execution
        return new Promise(() => {});
    }
    const baseConfig = await baseConfigResponse.json();

    // Attempt to fetch and merge the local override file
    try {
        const localConfigResponse = await fetch('/assets/config/environment.local.json');
        if (localConfigResponse.ok) {
            const localConfig = await localConfigResponse.json();
            console.log('🔧 Merging local environment overrides:', localConfig);
            // Merge local overrides on top of the base config
            return { ...baseConfig, ...localConfig };
        }
    } catch (error) {
        // It's okay if this file doesn't exist, we just won't apply overrides.
    }

    return baseConfig;
}

/**
 * Check for developer environment override in sessionStorage
 */
function checkDeveloperOverride(): Partial<CoreEnvironment> | null {
    try {
        const override = sessionStorage.getItem('developer-environment-override');
        if (override) {
            const config = JSON.parse(override);
            // Keep override for current session only
            console.log('🔧 Using session developer environment override:', config.stage);
            return config;
        }
    } catch (error) {
        console.warn('Error parsing developer environment override:', error);
        sessionStorage.removeItem('developer-environment-override');
    }
    return null;
}
