import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { ApiMetadata } from '../interfaces/api.interface';
import { Stage } from '../interfaces/stage.interface';

/**
 * Service responsible for managing API metadata.
 * It provides methods to set, get, and clear API metadata,
 * as well as to retrieve specific metadata fields like session ID, timestamp, stage, version, etc.
 */
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiMetadata: ApiMetadata | null = null;
    private apiMetadataSubject = new BehaviorSubject<ApiMetadata | null>(null);

    /**
     * Sets the API metadata and notifies all subscribers.
     * @param meta The ApiMetadata object to set.
     */
    setApiMetadata(meta: ApiMetadata): void {
        this.apiMetadata = meta;
        this.apiMetadataSubject.next(meta);
    }

    /**
     * Retrieves the current API metadata.
     * @returns The ApiMetadata object or null if not set.
     */
    getApiMetadata(): ApiMetadata | null {
        return this.apiMetadata;
    }

    /**
     * Returns an observable that emits the current API metadata.
     * Subscribers will receive updates whenever the metadata changes.
     * @returns An Observable<ApiMetadata | null>.
     */
    getApiMetadata$(): Observable<ApiMetadata | null> {
        return this.apiMetadataSubject.asObservable();
    }

    /**
     * Clears the API metadata and notifies all subscribers.
     * This is useful for resetting the state when the session ends or when metadata is no longer needed.
     */
    clearApiMetadata(): void {
        this.apiMetadata = null;
        this.apiMetadataSubject.next(null);
    }

    /*
     * Sets the session ID in the API metadata.
     */
    setSessionId(sessionId: string): void {
        if (this.apiMetadata) {
            this.apiMetadata.session = sessionId;
            this.apiMetadataSubject.next(this.apiMetadata);
        }
    }

    /**
     * Retrieves the session ID from the API metadata.
     * @returns The session ID from the API metadata, or null if not set.
     */
    getSessionId(): string | null {
        return this.apiMetadata?.session ?? null;
    }

    /**
     * Retrieves the timestamp from the API metadata.
     * @returns The timestamp from the API metadata, or null if not set.
     */
    getTimestamp(): string | null {
        // Or Date, if transformation is handled
        return this.apiMetadata?.timestamp ?? null;
    }

    /**
     * Retrieves the stage from the API metadata.
     * @returns The Stage enum value from the API metadata, or null if not set.
     */
    getStage(): Stage | null {
        return this.apiMetadata?.stage ?? null;
    }

    /**
     * Retrieves the API version from the API metadata.
     * @returns The version string from the API metadata, or null if not set.
     */
    getApiVersion(): string | null {
        return this.apiMetadata?.version ?? null;
    }

    /**
     * Retrieves the cache valid through date from the API metadata.
     * @returns The cache valid through date as an ISO 8601 string, or null if not set.
     */
    getCacheValidThru(): string | null {
        return this.apiMetadata?.cacheValidThru ?? null;
    }

    /**
     * Retrieves the error code from the API metadata.
     * @returns The error code string from the API metadata, or null if not set.
     */
    getErrorCode(): string | null {
        return this.apiMetadata?.errorCode ?? null;
    }

    /**
     * Retrieves the error message from the API metadata.
     * @returns The error message string from the API metadata, or null if not set.
     */
    getErrorMessage(): string | null {
        return this.apiMetadata?.errorMessage ?? null;
    }
}
