import type Jimp from "jimp";
import { Tensor } from 'onnxruntime-web';
import {ImageData} from "@techstark/opencv-js";

export async function getImageTensorFromPath(path: string, dims: number[] =  [1, 3, 224, 224]): Promise<Tensor> {
    // 1. load the image
    var image = await loadImageFromPath(path, dims[2], dims[3]);
    // 2. convert to tensor
    var imageTensor = imageJimpToTensor(image, dims[2], dims[3]);
    // 3. return the tensor
    return imageTensor;
}

async function loadImageFromPath(path: string, width: number = 224, height: number= 224): Promise<Jimp> {
    // Use Jimp to load the image and resize it.
    var imageData = await Jimp.read(path).then((imageBuffer: Jimp) => {
        return imageBuffer.resize(width, height);
    });

    return imageData;
}

export function imageHtmlToData(image: HTMLImageElement){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0, image.width, image.height)
    const imageData = ctx.getImageData(0, 0, image.width, image.height)
    return imageData;
}

export function imageJimpToTensor(image: Jimp, newWidth: number, newHeight: number): Tensor {
    // 1. Get buffer data from image and create R, G, and B arrays.
    var imageBufferData = image.bitmap.data;
    return imageBufferDataToTensor(imageBufferData, {
        height: newHeight,
        width: newWidth,
        format: 'RGBA',
        tensorFormat: 'RGB',
    })
}

export function imageBufferDataToTensor(buffer: Buffer | Uint8ClampedArray, options: any): Tensor {
    if (buffer === undefined) {
        throw new Error('Image buffer must be defined');
    }
    if (options.height === undefined || options.width === undefined) {
        throw new Error('Image height and width must be defined');
    }
    if (options.tensorLayout === 'NHWC') {
        throw new Error('NHWC Tensor layout is not supported yet');
    }
    const {height, width} = options;

    const norm = options.norm ?? {mean: 255, bias: 0};
    let normMean: [number, number, number, number];
    let normBias: [number, number, number, number];

    if (typeof (norm.mean) === 'number') {
        normMean = [norm.mean, norm.mean, norm.mean, norm.mean];
    } else {
        normMean = [norm.mean![0], norm.mean![1], norm.mean![2], norm.mean![3] ?? 255];
    }

    if (typeof (norm.bias) === 'number') {
        normBias = [norm.bias, norm.bias, norm.bias, norm.bias];
    } else {
        normBias = [norm.bias![0], norm.bias![1], norm.bias![2], norm.bias![3] ?? 0];
    }

    const inputformat = options.format !== undefined ? options.format : 'RGBA';
    // default value is RGBA since imagedata and HTMLImageElement uses it

    const outputformat =
        options.tensorFormat !== undefined ? (options.tensorFormat !== undefined ? options.tensorFormat : 'RGB') : 'RGB';
    const stride = height * width;
    const float32Data = outputformat === 'RGBA' ? new Float32Array(stride * 4) : new Float32Array(stride * 3);

    // Default pointer assignments
    let step = 4, rImagePointer = 0, gImagePointer = 1, bImagePointer = 2, aImagePointer = 3;
    let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;

    // Updating the pointer assignments based on the input image format
    if (inputformat === 'RGB') {
        step = 3;
        rImagePointer = 0;
        gImagePointer = 1;
        bImagePointer = 2;
        aImagePointer = -1;
    }

    // Updating the pointer assignments based on the output tensor format
    if (outputformat === 'RGBA') {
        aTensorPointer = stride * 3;
    } else if (outputformat === 'RBG') {
        rTensorPointer = 0;
        bTensorPointer = stride;
        gTensorPointer = stride * 2;
    } else if (outputformat === 'BGR') {
        bTensorPointer = 0;
        gTensorPointer = stride;
        rTensorPointer = stride * 2;
    }

    for (let i = 0; i < stride;
         i++, rImagePointer += step, bImagePointer += step, gImagePointer += step, aImagePointer += step) {
        float32Data[rTensorPointer++] = (buffer[rImagePointer] + normBias[0]) / normMean[0];
        float32Data[gTensorPointer++] = (buffer[gImagePointer] + normBias[1]) / normMean[1];
        float32Data[bTensorPointer++] = (buffer[bImagePointer] + normBias[2]) / normMean[2];
        if (aTensorPointer !== -1 && aImagePointer !== -1) {
            float32Data[aTensorPointer++] = (buffer[aImagePointer] + normBias[3]) / normMean[3];
        }
    }

    // Float32Array -> ort.Tensor
    const outputTensor = outputformat === 'RGBA' ? new Tensor('float32', float32Data, [1, 4, height, width]) :
        new Tensor('float32', float32Data, [1, 3, height, width]);
    return outputTensor;
}

export async function imageHtmlToTensor(image: HTMLImageElement, newWidth: number, newHeight: number): Promise<Tensor> {
    let imageData = imageHtmlToData(image)
    let imageJimp = imageBufferToJimp(new Buffer(imageData.data), image.width, image.height)
    let resizeImageJimp = imageJimp.resize(newWidth, newHeight)
    return imageJimpToTensor(resizeImageJimp, newWidth, newHeight)
}


export async function imageDataToTensor(imageData: ImageData, newWidth: number, newHeight: number): Promise<Tensor> {
    let imageJimp = imageBufferToJimp(new Buffer(imageData.data), imageData.width, imageData.height)
    let resizeImageJimp = imageJimp.resize(newWidth, newHeight)
    return imageJimpToTensor(resizeImageJimp, newWidth, newHeight)
}

export function imageBufferToJimp(image: Buffer, width: number, height: number): Jimp{
    return new Jimp({ data: image, width, height })
}

export function  createImgCanvas(buffer, width, height){
    // buffer 渲染图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height
    const imageData = ctx.createImageData(width, height)
    const data = new Uint8ClampedArray(buffer)
    imageData.data.set(data)
    ctx.putImageData(imageData, 0, 0)
    return canvas
}

export function  previewImg(buffer, width, height){
    // buffer 渲染图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height
    const imageData = ctx.createImageData(width, height)
    const data = new Uint8ClampedArray(buffer)
    imageData.data.set(data)
    ctx.putImageData(imageData, 0, 0)
    document.body.appendChild(canvas)
}



