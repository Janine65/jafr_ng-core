import { inject, Injectable } from '@angular/core';

import { LogLevel } from '../interfaces/loglevel.interface';
import { LoggerService } from '../services/logger.service';

// A no-operation function to avoid unnecessary checks when logging is disabled
const noop = () => {};

/**
 * LogLevelOrder is a mapping of log levels to their order of precedence.
 * This is used to determine if a log message should be displayed based on
 * the current log level.
 */
const LogLevelOrder = {
    [LogLevel.OFF]: 0,
    [LogLevel.ERROR]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 3,
    [LogLevel.DEBUG]: 4
};

/**
 * Creates a log prefix with the current timestamp, log level, and source.
 * This is used to format log messages consistently across the application.
 *
 * @param level - The log level (e.g., INFO, WARN, ERROR, DEBUG).
 * @param source - The source of the log message (e.g., component or service name).
 * @returns A formatted string representing the log prefix.
 */
const withLogPrefix = (level: string, source: string) => ({
    toString: () => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return `[${timestamp}] [${level}] [${source}]`;
    }
});

/**
 * Logger class provides methods for logging messages at different levels (INFO, WARN, ERROR, DEBUG).
 * It checks the current log level and only logs messages if the level is appropriate.
 */
export class Logger {
    constructor(
        private source: string,
        private logLevel: () => LogLevel
    ) {}

    get log() {
        if (LogLevelOrder[this.logLevel()] >= LogLevelOrder[LogLevel.INFO]) {
            return console.log.bind(console, '%s', withLogPrefix('INFO', this.source));
        }
        return noop;
    }

    get warn() {
        if (LogLevelOrder[this.logLevel()] >= LogLevelOrder[LogLevel.WARN]) {
            return console.warn.bind(console, `%c%s`, 'background: #FFC107; color: #000; padding: 2px 4px; border-radius: 2px;', withLogPrefix('WARN', this.source));
        }
        return noop;
    }

    get error() {
        if (LogLevelOrder[this.logLevel()] >= LogLevelOrder[LogLevel.ERROR]) {
            return console.error.bind(console, `%c%s`, 'background: #F44336; color: #fff; padding: 2px 4px; border-radius: 2px;', withLogPrefix('ERROR', this.source));
        }
        return noop;
    }

    get debug() {
        if (LogLevelOrder[this.logLevel()] >= LogLevelOrder[LogLevel.DEBUG]) {
            return console.debug.bind(console, `%c%s`, 'background: #2196F3; color: #fff; padding: 2px 4px; border-radius: 2px;', withLogPrefix('DEBUG', this.source));
        }
        return noop;
    }
}

@Injectable({
    providedIn: 'root'
})
export class LogFactoryService {
    private loggerService = inject(LoggerService);

    createLogger(source: string): Logger {
        const getLogLevel = () => this.loggerService.getLogLevel();
        return new Logger(source, getLogLevel);
    }
}
