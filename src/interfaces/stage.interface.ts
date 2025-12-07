export enum Stage {
    BOOTSTRAP = 'BOOTSTRAP', // Initial stage for bootstrapping the application
    DEV = 'DEV',
    ENTW = 'ENTW',
    SYST = 'SYST',
    INTG = 'INTG',
    GATE = 'GATE',
    PROD = 'PROD',
    MOCK = 'MOCK'
}

export interface AvailableStage {
    key: string;
    label: string;
    stage: Stage;
    description: string;
}
