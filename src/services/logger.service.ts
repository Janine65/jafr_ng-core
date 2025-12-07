import { inject, Injectable } from '@angular/core';

import { LogLevel } from '../interfaces/loglevel.interface';
import { EnvironmentService } from './environment.service';

declare global {
    interface Window {
        logLevel: LogLevel;
    }
}

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    private environment = inject(EnvironmentService);
    private logLevel: LogLevel = this.environment.logLevel;

    constructor() {
        (window as Window).logLevel = this.logLevel;
    }

    setLogLevel(level: LogLevel) {
        this.logLevel = level;
        (window as Window).logLevel = level;
    }

    getLogLevel(): LogLevel {
        return this.logLevel;
    }
}
