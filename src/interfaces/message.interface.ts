export interface Message {
    severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
    summary?: string;
    detail?: string;
    id?: string;
    key?: string;
    life?: number;
    sticky?: boolean;
    closable?: boolean;
    data?: unknown;
    icon?: string;
    contentStyleClass?: string;
    class?: string;
}

export interface MessageOptions {
    sticky?: boolean;
    closable?: boolean;
    life?: number;
    key?: string;
    data?: unknown;
}
