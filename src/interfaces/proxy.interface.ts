export interface ProxyStatus {
    current?: string;
    target?: string;
    availableStages: string[];
}

export interface ProxySwitchResponse {
    success: boolean;
    stage?: string;
    target?: string;
    error?: string;
    availableStages: string[];
}
