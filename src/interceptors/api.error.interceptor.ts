import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import {
    HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { LogFactoryService } from '../factories/logger.factory';
import { BannerService } from '../services/banner.service';
import { AppMessageService } from '../services/message.service';

export const errorInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const router = inject(Router);
    const messageService = inject(AppMessageService);
    const bannerService = inject(BannerService);
    const translate = inject(TranslateService);
    const logger = inject(LogFactoryService).createLogger('ErrorInterceptor');
    const timeoutValue = 120000; // 120s until a timeout is reached

    // Check if this request should suppress toast messages (e.g., from job-service polling)
    const suppressToasts = request.headers.has('X-Suppress-Error-Toast');
    if (suppressToasts) {
        logger.debug('Suppress toast header detected for:', request.url);
    }

    return next(request).pipe(
        timeout(timeoutValue),
        catchError((error: HttpErrorResponse | TimeoutError) => {
            logger.error('Catched error:', error);

            // Handle TimeoutError (Backend does not respond)
            if (error instanceof TimeoutError) {
                const shouldSilence = bannerService.registerError();

                if (!shouldSilence && !suppressToasts) {
                    const summary = translate.instant('core.interceptors.error.timeout.summary');
                    const detail = translate.instant('core.interceptors.error.timeout.detail');
                    messageService.add({
                        severity: 'warn',
                        summary: summary,
                        detail: detail,
                        sticky: true
                    });
                }
                return throwError(() => new Error('Request timed out.'));
            }

            // Handle HttpErrorResponse (Backend responded with an error)
            if (error instanceof HttpErrorResponse) {
                // If the error is thrown by the status pages itself, do not redirect and throw an error
                if (error.url && (error.url.includes('/status/403') || error.url.includes('/status/500'))) {
                    return throwError(() => error);
                }

                // If the error is >=500, register with banner service and potentially silence toast
                if (error.status >= 500) {
                    const shouldSilence = bannerService.registerError({
                        type: 'error',
                        title: 'core.backendErrorBanner.title',
                        message: 'core.backendErrorBanner.message'
                    });
                    logger.debug('shouldSilence:', shouldSilence);

                    if (!shouldSilence && !suppressToasts) {
                        messageService.add({
                            severity: 'warn',
                            summary: translate.instant('core.interceptors.error.serverError.summary'),
                            detail: translate.instant('core.interceptors.error.serverError.detail'),
                            sticky: true
                        });
                    }
                    return throwError(() => error);
                }

                // If the error is a 4xx, show error message (but not for banner-triggering scenarios)
                if (error.status && error.status >= 400) {
                    const msg = error?.error?.error || error?.message || translate.instant('core.interceptors.error.genericError');

                    // Only show toast if banner is not active and toasts are not suppressed
                    if (!bannerService.isActive() && !suppressToasts) {
                        messageService.showError(msg);
                    }
                }

                // If the error is a 403, redirect to the status page with the error message
                if (error.status === 403) {
                    router.navigate(['/status/403'], { queryParams: { error: 'forbidden' } });
                }
            }

            return throwError(() => error);
        })
    );
};
