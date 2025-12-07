import { MessageService } from 'primeng/api';

import { inject, Injectable } from '@angular/core';

import { Message, MessageOptions } from '../interfaces/message.interface';

/**
 * Application-wide message service that wraps PrimeNG's MessageService.
 * Provides methods to show error, success, info, and warning messages
 * with default configurations for each type.
 */
@Injectable({
    providedIn: 'root'
})
export class AppMessageService {
    private messageService = inject(MessageService);

    // Default configurations for each message type
    private readonly defaultConfigs = {
        error: {
            severity: 'error' as const,
            summary: 'Fehler',
            icon: 'pi pi-times-circle',
            sticky: true,
            closable: true
        },
        success: {
            severity: 'success' as const,
            summary: 'Erfolg',
            icon: 'pi pi-check-circle',
            sticky: false,
            closable: true,
            life: 5000
        },
        info: {
            severity: 'info' as const,
            summary: 'Information',
            icon: 'pi pi-info-circle',
            sticky: false,
            closable: true,
            life: 5000
        },
        warning: {
            severity: 'warn' as const,
            summary: 'Warnung',
            icon: 'pi pi-exclamation-triangle',
            sticky: false,
            closable: true,
            life: 7000
        }
    };

    add(message: Message) {
        this.messageService.add(message);
    }

    clear(key?: string) {
        this.messageService.clear(key);
    }

    showError(detail: string, options: MessageOptions = {}) {
        const config = { ...this.defaultConfigs.error };
        this.add({
            ...config,
            detail,
            sticky: options.sticky ?? config.sticky,
            closable: options.closable ?? config.closable,
            life: options.life,
            key: options.key,
            data: options.data
        });
    }

    showSuccess(detail: string, options: MessageOptions = {}) {
        const config = { ...this.defaultConfigs.success };
        this.add({
            ...config,
            detail,
            sticky: options.sticky ?? config.sticky,
            closable: options.closable ?? config.closable,
            life: options.life ?? config.life,
            key: options.key,
            data: options.data
        });
    }

    showInfo(detail: string, options: MessageOptions = {}) {
        const config = { ...this.defaultConfigs.info };
        this.add({
            ...config,
            detail,
            sticky: options.sticky ?? config.sticky,
            closable: options.closable ?? config.closable,
            life: options.life ?? config.life,
            key: options.key,
            data: options.data
        });
    }

    showWarning(detail: string, options: MessageOptions = {}) {
        const config = { ...this.defaultConfigs.warning };
        this.add({
            ...config,
            detail,
            sticky: options.sticky ?? config.sticky,
            closable: options.closable ?? config.closable,
            life: options.life ?? config.life,
            key: options.key,
            data: options.data
        });
    }
}
