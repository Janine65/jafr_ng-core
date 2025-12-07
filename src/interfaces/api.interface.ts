import { Stage } from './stage.interface';

export interface ApiMetadata {
    session: string;
    stage: Stage;
    version: string;
    timestamp: string; // ISO 8601 date string

    cacheValidThru?: string; // Optional ISO 8601 date string for cache invalidation
    errorCode?: string; // Optional error code for API errors
    errorMessage?: string; // Optional error message for API errors
}

export interface ApiResponse {
    meta: ApiMetadata;
    data: unknown;
}

export interface ApiLogEntry {
    id: number;
    timestamp: Date;
    method: string;
    url: string;
    status: 'pending' | 'succeeded' | 'failed';
    requestHeaders: unknown;
    requestBody: unknown;
    responseHeaders?: unknown;
    responseBody?: unknown;
    duration?: number;
    expanded?: boolean; // For UI expansion state
}
