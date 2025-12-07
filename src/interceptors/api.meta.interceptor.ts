import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
    HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { LogFactoryService } from '../factories/logger.factory';
import { ApiMetadata } from '../interfaces/api.interface';
import { Stage } from '../interfaces/stage.interface';
import { ApiService } from '../services/api.service';
import { EnvironmentService } from '../services/environment.service';
import { AppMessageService } from '../services/message.service';

export const apiInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const apiMetaService = inject(ApiService);
    const router = inject(Router);
    const environmentService = inject(EnvironmentService);
    const messageService = inject(AppMessageService);
    const logFactory = inject(LogFactoryService);
    const logger = logFactory.createLogger('ApiInterceptor');

    // Check if this request should suppress toast messages (e.g., from job-service polling)
    const suppressToasts = request.headers.has('X-Suppress-Error-Toast');

    // Skip the request if it's...
    // - a call to /assets/ (static assets)
    // - a call to external URLs (http:// or https://)
    if (request.url.startsWith('/assets') || request.url.startsWith('http://') || request.url.startsWith('https://')) {
        return next(request);
    }

    // Handle the meta information from the response.
    return next(request).pipe(
        map((event: HttpEvent<unknown>) => {
            if (event instanceof HttpResponse) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const body = event.body as any;

                // TODO HACK: Handle legacy API format: { session, status, result, ... }
                if (body && body.result !== undefined && body.status !== undefined) {
                    logger.debug('Detected legacy API format...');
                    // Set the session id (because we have no meta information availlable here)
                    apiMetaService.setSessionId(body.session);

                    // Check for optional message in legacy format - but skip if toasts are suppressed
                    if (body.message && typeof body.message === 'string' && !suppressToasts) {
                        logger.debug('Legacy API message detected:', body.message);
                        messageService.showInfo(body.message);
                    }

                    // Return the result part to the caller
                    return event.clone({ body: body.result });
                }

                // Handle new format: { meta, data }
                if (body && body.meta && body.data !== undefined) {
                    // Extract the meta information from the response body
                    const meta = body.meta as ApiMetadata;
                    apiMetaService.setApiMetadata(meta);
                    logger.debug('Extracted API meta data:', meta);

                    // Check if the backend's stage matches the client's expected stage
                    const clientStage = environmentService.stage;
                    if (meta.stage && clientStage !== meta.stage) {
                        const errorMessage = `Stage mismatch: Client expected stage '${clientStage}' but API returned stage '${meta.stage}'. Redirecting to error page.`;
                        logger.error(errorMessage);
                        router.navigate(['/status/500'], { queryParams: { message: errorMessage } });
                    }

                    // Check for optional errors object in new format - but skip if toasts are suppressed
                    if (body.errors && typeof body.errors === 'object' && !suppressToasts) {
                        // Handle errors object - can contain multiple error messages
                        const errors = body.errors as Record<string, string | string[]>;
                        Object.entries(errors).forEach(([key, value]) => {
                            if (Array.isArray(value)) {
                                // Handle array of error messages
                                value.forEach((msg) => {
                                    logger.debug(`New API error [${key}]:`, msg);
                                    messageService.showError(msg);
                                });
                            } else if (typeof value === 'string') {
                                // Handle single error message
                                logger.debug(`New API error [${key}]:`, value);
                                messageService.showError(value);
                            }
                        });
                    }

                    // The API has the following format:
                    // {
                    //   "errors": { ... },
                    //   "meta": { ... },
                    //   "data": { ... }
                    // }
                    // We clone the event to return only the data part
                    return event.clone({ body: body.data });
                }
            }
            return event;
        })
    );
};
