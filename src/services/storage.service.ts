import { Injectable } from '@angular/core';

export enum StorageType {
    LOCAL = 'localStorage',
    SESSION = 'sessionStorage'
}

export interface StorageOptions {
    type?: StorageType;
    prefix?: string;
}

/**
 * Service for browser storage operations (localStorage and sessionStorage).
 * Provides type-safe methods with error handling and optional key prefixing.
 */
@Injectable({
    providedIn: 'root'
})
export class BrowserStorageService {
    private readonly defaultOptions: StorageOptions = {
        type: StorageType.LOCAL,
        prefix: ''
    };

    /**
     * Store a value in browser storage
     */
    setItem<T>(key: string, value: T, options?: StorageOptions): boolean {
        try {
            const opts = { ...this.defaultOptions, ...options };
            const storage = this.getStorage(opts.type!);
            const finalKey = this.getPrefixedKey(key, opts.prefix);

            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            storage.setItem(finalKey, serializedValue);
            return true;
        } catch (error) {
            console.warn(`Failed to set item in ${options?.type || 'localStorage'}:`, error);
            return false;
        }
    }

    /**
     * Retrieve a value from browser storage
     */
    getItem<T>(key: string, options?: StorageOptions): T | null {
        try {
            const opts = { ...this.defaultOptions, ...options };
            const storage = this.getStorage(opts.type!);
            const finalKey = this.getPrefixedKey(key, opts.prefix);

            const stored = storage.getItem(finalKey);
            if (stored === null) {
                return null;
            }

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(stored) as T;
            } catch {
                return stored as T;
            }
        } catch (error) {
            console.warn(`Failed to get item from ${options?.type || 'localStorage'}:`, error);
            return null;
        }
    }

    /**
     * Remove an item from browser storage
     */
    removeItem(key: string, options?: StorageOptions): boolean {
        try {
            const opts = { ...this.defaultOptions, ...options };
            const storage = this.getStorage(opts.type!);
            const finalKey = this.getPrefixedKey(key, opts.prefix);

            storage.removeItem(finalKey);
            return true;
        } catch (error) {
            console.warn(`Failed to remove item from ${options?.type || 'localStorage'}:`, error);
            return false;
        }
    }

    /**
     * Check if an item exists in browser storage
     */
    hasItem(key: string, options?: StorageOptions): boolean {
        const opts = { ...this.defaultOptions, ...options };
        const storage = this.getStorage(opts.type!);
        const finalKey = this.getPrefixedKey(key, opts.prefix);

        return storage.getItem(finalKey) !== null;
    }

    /**
     * Clear all items from browser storage
     */
    clear(options?: StorageOptions): boolean {
        try {
            const opts = { ...this.defaultOptions, ...options };
            const storage = this.getStorage(opts.type!);

            // If prefix is specified, only clear items with that prefix
            if (opts.prefix) {
                const keys = this.getKeys(opts);
                keys.forEach((key) => {
                    if (key.startsWith(opts.prefix!)) {
                        storage.removeItem(key);
                    }
                });
            } else {
                storage.clear();
            }
            return true;
        } catch (error) {
            console.warn(`Failed to clear ${options?.type || 'localStorage'}:`, error);
            return false;
        }
    }

    /**
     * Get all keys from browser storage
     */
    getKeys(options?: StorageOptions): string[] {
        try {
            const opts = { ...this.defaultOptions, ...options };
            const storage = this.getStorage(opts.type!);

            const keys: string[] = [];
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key) {
                    keys.push(key);
                }
            }
            return keys;
        } catch (error) {
            console.warn(`Failed to get keys from ${options?.type || 'localStorage'}:`, error);
            return [];
        }
    }

    /**
     * Get the size (number of items) in browser storage
     */
    getSize(options?: StorageOptions): number {
        try {
            const opts = { ...this.defaultOptions, ...options };
            const storage = this.getStorage(opts.type!);
            return storage.length;
        } catch (error) {
            console.warn(`Failed to get size of ${options?.type || 'localStorage'}:`, error);
            return 0;
        }
    }

    /**
     * Check if browser storage is available
     */
    isAvailable(type: StorageType = StorageType.LOCAL): boolean {
        try {
            const storage = this.getStorage(type);
            const testKey = '__storage_test__';
            storage.setItem(testKey, 'test');
            storage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    // Convenience methods for common operations

    /**
     * Set item in localStorage
     */
    setLocal<T>(key: string, value: T, prefix?: string): boolean {
        return this.setItem(key, value, { type: StorageType.LOCAL, prefix });
    }

    /**
     * Get item from localStorage
     */
    getLocal<T>(key: string, prefix?: string): T | null {
        return this.getItem<T>(key, { type: StorageType.LOCAL, prefix });
    }

    /**
     * Remove item from localStorage
     */
    removeLocal(key: string, prefix?: string): boolean {
        return this.removeItem(key, { type: StorageType.LOCAL, prefix });
    }

    /**
     * Set item in sessionStorage
     */
    setSession<T>(key: string, value: T, prefix?: string): boolean {
        return this.setItem(key, value, { type: StorageType.SESSION, prefix });
    }

    /**
     * Get item from sessionStorage
     */
    getSession<T>(key: string, prefix?: string): T | null {
        return this.getItem<T>(key, { type: StorageType.SESSION, prefix });
    }

    /**
     * Remove item from sessionStorage
     */
    removeSession(key: string, prefix?: string): boolean {
        return this.removeItem(key, { type: StorageType.SESSION, prefix });
    }

    /**
     * Clear localStorage
     */
    clearLocal(prefix?: string): boolean {
        return this.clear({ type: StorageType.LOCAL, prefix });
    }

    /**
     * Clear sessionStorage
     */
    clearSession(prefix?: string): boolean {
        return this.clear({ type: StorageType.SESSION, prefix });
    }

    // Private helper methods

    private getStorage(type: StorageType): Storage {
        switch (type) {
            case StorageType.LOCAL:
                return localStorage;
            case StorageType.SESSION:
                return sessionStorage;
            default:
                throw new Error(`Unsupported storage type: ${type}`);
        }
    }

    private getPrefixedKey(key: string, prefix?: string): string {
        return prefix ? `${prefix}${key}` : key;
    }
}
