
export interface Mutils {
    logger: any;

    setLoggerListener(listener: Function): void;
}


declare global {
    interface Window {
        mutils: Mutils;
    }
}
