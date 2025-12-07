import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { inject, Injectable } from '@angular/core';

import { LogFactoryService, Logger } from '../factories/logger.factory';

/**
 * Application-wide loading (screen) service to manage multiple loading sources.
 * Combines loading states from various sources and allows forcing loading state.
 * Supports registering and unregistering loading sources.
 */
@Injectable({
    providedIn: 'root'
})
export class AppLoadingService {
    private loadingSourcesMap = new Map<string, Observable<boolean>>();
    private sourcesArraySubject = new BehaviorSubject<Observable<boolean>[]>([]);
    private logger: Logger;

    private forceLoadingState = new BehaviorSubject<boolean | null>(null);
    public forceLoadingState$ = this.forceLoadingState.asObservable();

    public readonly isLoading$: Observable<boolean>;

    private logFactory = inject(LogFactoryService);

    constructor() {
        this.logger = this.logFactory.createLogger('AppLoadingService');

        const combinedSourcesLoading$ = this.sourcesArraySubject.pipe(
            switchMap((sourcesArray) => {
                if (sourcesArray.length === 0) {
                    return of(false);
                }
                return combineLatest(sourcesArray).pipe(
                    map((states) => states.some((isLoading) => isLoading)),
                    startWith(true)
                );
            })
        );

        this.isLoading$ = combineLatest([combinedSourcesLoading$, this.forceLoadingState$]).pipe(
            map(([sourcesLoading, forceState]) => {
                if (forceState === true) {
                    return true;
                }
                if (forceState === false) {
                    return false;
                }
                return sourcesLoading;
            }),
            startWith(true),
            distinctUntilChanged(),
            shareReplay(1)
        );
    }

    /**
     * Registers a new loading source.
     * The provided isLoading$ should emit true when the source is loading, and false when it's done.
     * @param id A unique identifier for the loading source.
     * @param isLoading$ An observable that emits true if loading, false otherwise.
     */
    registerSource(id: string, isLoading$: Observable<boolean>): void {
        const preparedSource$ = isLoading$.pipe(startWith(true), distinctUntilChanged());
        this.loadingSourcesMap.set(id, preparedSource$);
        this.sourcesArraySubject.next(Array.from(this.loadingSourcesMap.values()));
        this.logger.debug(`Source '${id}' registered. Total sources: ${this.loadingSourcesMap.size}`);
    }

    unregisterSource(id: string): void {
        if (this.loadingSourcesMap.delete(id)) {
            this.sourcesArraySubject.next(Array.from(this.loadingSourcesMap.values()));
            this.logger.debug(`Source '${id}' unregistered. Total sources: ${this.loadingSourcesMap.size}`);
        }
    }

    public forceShow(): void {
        this.forceLoadingState.next(true);
    }

    public forceHide(): void {
        this.forceLoadingState.next(false);
    }

    public clearForce(): void {
        this.forceLoadingState.next(null);
    }
}
