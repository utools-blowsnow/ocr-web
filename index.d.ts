
export interface Mutils {
    logger: any;

    setLoggerListener(listener: Function): void;

    readModelFile(modelName) : Buffer

    writeModelFile(modelName, buffer): void
}


declare global {
    interface Window {
        mutils: Mutils;
    }
}
