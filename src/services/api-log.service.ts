import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { ApiLogEntry } from '../interfaces/api.interface';

/**
 * (Developer) Service responsible for logging API calls and responses.
 * It provides methods to add, update, and retrieve log entries.
 */
@Injectable({
    providedIn: 'root'
})
export class ApiLogService {
    private logsSubject = new BehaviorSubject<ApiLogEntry[]>([]);
    logs$ = this.logsSubject.asObservable();
    private logs: ApiLogEntry[] = [];
    private idCounter = 0;

    getLogs(): Observable<ApiLogEntry[]> {
        return this.logs$;
    }

    addEntry(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>): ApiLogEntry {
        const newEntry: ApiLogEntry = {
            ...entry,
            id: this.idCounter++,
            timestamp: new Date()
        };
        this.logs.unshift(newEntry);
        this.logsSubject.next([...this.logs]);
        return newEntry;
    }

    updateEntry(updatedEntry: ApiLogEntry): void {
        const index = this.logs.findIndex((log) => log.id === updatedEntry.id);
        if (index > -1) {
            this.logs[index] = updatedEntry;
            this.logsSubject.next([...this.logs]);
        }
    }

    clearLogs(): void {
        this.logs = [];
        this.logsSubject.next([]);
    }
}
