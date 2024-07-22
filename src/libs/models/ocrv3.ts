import {OcrModelOptions} from "@/libs/models/type.ts";

export default {
    name: "PP-OCRv3",
    detModel: {
        modelPath: "https://cdn.jsdelivr.net/gh/utools-blowsnow/ocr-web@models/ch_PP-OCRv3_det_infer.onnx"
    },
    recModel: {
        modelPath: "https://cdn.jsdelivr.net/gh/utools-blowsnow/ocr-web@models/ch_PP-OCRv3_rec_infer.onnx"
    },
    charesPath: "https://cdn.jsdelivr.net/gh/utools-blowsnow/ocr-web@models/ppocr_keys_v1.txt"

} as OcrModelOptions
