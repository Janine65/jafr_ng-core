import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
    HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse
} from '@angular/common/http';
import { inject } from '@angular/core';

import { ApiLogService } from '../services/api-log.service';
import { EnvironmentService } from '../services/environment.service';

export const apiLoggingInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const environmentService = inject(EnvironmentService);
    const apiLogService = inject(ApiLogService);

    // Don't log API calls in production
    if (environmentService.isProduction()) {
        return next(request);
    }

    const startTime = Date.now();

    const logEntry = apiLogService.addEntry({
        method: request.method,
        url: request.url,
        status: 'pending',
        requestHeaders: request.headers.keys().reduce((acc, key) => ({ ...acc, [key]: request.headers.get(key) }), {}),
        requestBody: request.body
    });

    return next(request).pipe(
        tap((event: HttpEvent<unknown>) => {
            if (event instanceof HttpResponse) {
                const duration = Date.now() - startTime;
                apiLogService.updateEntry({
                    ...logEntry,
                    status: 'succeeded',
                    responseHeaders: event.headers.keys().reduce((acc, key) => ({ ...acc, [key]: event.headers.get(key) }), {}),
                    responseBody: event.body,
                    duration
                });
            }
        }),
        catchError((error: HttpErrorResponse) => {
            const duration = Date.now() - startTime;
            apiLogService.updateEntry({
                ...logEntry,
                status: 'failed',
                responseBody: error.error,
                duration
            });
            return throwError(() => error);
        })
    );
};
