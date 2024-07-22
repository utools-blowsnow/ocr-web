export type ModelOptions = {
    modelPath: string;
}

export type OcrModelOptions = {
    name: string;
    detModel: ModelOptions;
    recModel: ModelOptions;
    charesPath: string;
}
