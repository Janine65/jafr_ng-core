import { AvailableStage, Stage } from '../interfaces/stage.interface';

/**
 * Default available stages for environment switching in developer mode.
 * Applications can override this by providing their own DEV_CONFIG.
 *
 * @example
 * // In your app.config.ts:
 * import { DEV_CONFIG } from '@frj/ng-core';
 * import { AVAILABLE_STAGES } from './app/config/dev.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: DEV_CONFIG, useValue: { AVAILABLE_STAGES } },
 *     // ...
 *   ]
 * };
 */
export const AVAILABLE_STAGES: AvailableStage[] = [
    {
        key: 'dev',
        label: 'Development',
        stage: Stage.DEV,
        description: 'Local development environment'
    },
    {
        key: 'syst',
        label: 'Systemtest',
        stage: Stage.SYST,
        description: 'System testing environment'
    },
    {
        key: 'intg',
        label: 'Integrationstest',
        stage: Stage.INTG,
        description: 'Integration testing environment'
    },
    {
        key: 'prod',
        label: 'Production',
        stage: Stage.PROD,
        description: 'Production environment'
    }
];
