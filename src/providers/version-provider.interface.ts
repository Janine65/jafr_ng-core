import { Observable } from 'rxjs';

/**
 * Version information structure
 */
export interface VersionInfo {
    frontendVersion: string;
    backendVersion?: string;
    schedulerVersion?: string;
}

/**
 * Interface for providing version information from application-specific sources.
 * This allows different applications to implement their own version endpoint logic.
 */
export interface VersionDataProvider {
    /**
     * Get all version information including frontend, backend, and any other service versions.
     * Applications should implement this to call their specific version endpoints.
     *
     * @returns Observable<VersionInfo> - Complete version information
     */
    getAllVersions(): Observable<VersionInfo>;

    /**
     * Get the application version (typically from package.json).
     *
     * @returns string - Application version
     */
    getAppVersion(): string;
}

/**
 * Default implementation that provides only frontend version
 */
export class DefaultVersionDataProvider implements VersionDataProvider {
    private readonly appVersion: string = '1.0.0';

    getAllVersions(): Observable<VersionInfo> {
        // Return Observable.of for default implementation
        return new Observable((observer) => {
            observer.next({
                frontendVersion: this.appVersion
            });
            observer.complete();
        });
    }

    getAppVersion(): string {
        return this.appVersion;
    }
}
