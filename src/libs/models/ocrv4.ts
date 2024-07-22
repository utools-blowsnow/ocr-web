import {OcrModel} from "@/libs/models/type.ts";

export default {
    detModel: {
        modelPath: "https://cdn.jsdelivr.net/gh/utools-blowsnow/ocr-web@models/ch_PP-OCRv4_det_infer.onnx"
    },
    recModel: {
        modelPath: "https://cdn.jsdelivr.net/gh/utools-blowsnow/ocr-web@models/ch_PP-OCRv4_rec_infer.onnx"
    },
    charesPath: "https://cdn.jsdelivr.net/gh/utools-blowsnow/ocr-web@models/ppocr_keys_v1.txt"

} as OcrModel
