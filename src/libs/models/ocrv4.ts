import {OcrModel} from "@/libs/models/type.ts";

export default {
    detModel: {
        modelPath: "models/ch_PP-OCRv4_det_infer.onnx"
    },
    recModel: {
        modelPath: "models/ch_PP-OCRv4_rec_infer.onnx"
    },
    charesPath: "models/ppocr_keys_v1.txt"

} as OcrModel
