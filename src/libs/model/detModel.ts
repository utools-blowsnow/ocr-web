import {InferenceSession, Tensor} from 'onnxruntime-web';

import {
    previewImg,
    imageBufferToJimp,
    createImgCanvas, imageHtmlToData
} from "@/utils/imageHelper";
import {resizeImg, toPaddleInput, afterDet,} from "@/libs/model/modelUtils";
import cv from "@techstark/opencv-js";

// env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

export default class DetModel{
    private modelPath: string;
    private session: InferenceSession;
    private limitSideLen = 960
    private detShape = [960, 960];

    constructor(modelPath: string) {
        this.modelPath = modelPath;
    }
    async init(buffer?:Uint8Array, options?: InferenceSession.SessionOptions){
        if (buffer) {
            this.session = await InferenceSession.create(buffer, options);
            return;
        }
        this.session = await InferenceSession.create(this.modelPath, options);
    }

    async predict(img: HTMLImageElement, options?: InferenceSession.RunOptions){
        console.log("det predict", img);

        let imgData = imageHtmlToData(img);

        // 处理图片 缩放指定
        let { transposedData, image } =  this.beforeDet(imgData, this.detShape[0], this.detShape[1]);

        // previewImg(image.data, image.width, image.height);
        console.log("imageTensor", transposedData);

        let x = transposedData.flat(Infinity);
        const detData = Float32Array.from(x);
        const detTensor = new Tensor("float32", detData, [1, 3, image.height, image.width]);

        const params = {};

        params[this.session.inputNames[0]] = detTensor;

        console.log("det predict run", params);

        const results = await this.session.run(params, options);

        const detResult = results[this.session.outputNames[0]];

        const resultImage = detResult.toImageData()
        // 转换为真实的图片数据
        const imageBuffer = Buffer.from(resultImage.data)
        const imageJimp = imageBufferToJimp(imageBuffer, resultImage.width, resultImage.height)
        const outputImage = imageJimp.resize(img.width, img.height)

        let box = afterDet(detResult.data, detResult.dims[3], detResult.dims[2], imgData);

        // TODO prieview
        // previewImg(outputImage.bitmap.data, img.width, img.height)

        return {
            result: detResult,
            box,
            image: outputImage
        };
    }


    beforeDet(image, shapeH, shapeW) {
        let ratio = 1;
        let h = image.height,
            w = image.width;
        if (Math.max(h, w) > this.limitSideLen) {
            if (h > w) {
                ratio = this.limitSideLen / h;
            } else {
                ratio = this.limitSideLen / w;
            }
        }
        let resizeH = shapeH || h * ratio;
        let resizeW = shapeW || w * ratio;

        resizeH = Math.max(Math.round(resizeH / 32) * 32, 32);
        resizeW = Math.max(Math.round(resizeW / 32) * 32, 32);
        image = resizeImg(image, resizeW, resizeH);

        const transposedData = toPaddleInput(image, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);

        return { transposedData, image };
    }


}
