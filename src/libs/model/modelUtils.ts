import {createImgCanvas} from "@/utils/imageHelper";
import cv from "@techstark/opencv-js";
import clipper from 'js-clipper';

export function afterDet(data: Buffer, w, h, srcData: ImageData) {
    var myImageData = new ImageData(w, h);
    for (let i in data) {
        let n = Number(i) * 4;
        const v = (data[i]) > 0.3 ? 255 : 0;
        myImageData.data[n] = myImageData.data[n + 1] = myImageData.data[n + 2] = v;
        myImageData.data[n + 3] = 255;
    }
    let canvas = data2canvas(myImageData);

    let edgeRect = [];

    let src = cv.imread(canvas);

    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
        let minSize = 3;
        let cnt = contours.get(i);
        let { points, sside } = getMiniBoxes(cnt);
        if (sside < minSize) continue;
        // TODO sort fast

        let clipBox = unclip(points);

        const boxMap =  cv.matFromArray(clipBox.length / 2, 1, cv.CV_32SC2, clipBox);

        const resultObj = getMiniBoxes(boxMap);
        let box = resultObj.points;
        if (resultObj.sside < minSize + 2) {
            continue;
        }
        function clip(n, min, max) {
            return Math.max(min, Math.min(n, max));
        }

        let rx = srcData.width / w;
        let ry = srcData.height / h;

        for (let i = 0; i < box.length; i++) {
            box[i][0] *= rx;
            box[i][1] *= ry;
        }

        let box1 = orderPointsClockwise(box);
        box1.forEach((item) => {
            item[0] = clip(Math.round(item[0]), 0, srcData.width);
            item[1] = clip(Math.round(item[1]), 0, srcData.height);
        });
        let rect_width = int(linalgNorm(box1[0], box1[1]));
        let rect_height = int(linalgNorm(box1[0], box1[3]));
        if (rect_width <= 3 || rect_height <= 3) continue;

        let c0 = data2canvas(srcData);

        let c = getRotateCropImage(c0, box);

        edgeRect.push({ box, img: c.getContext("2d").getImageData(0, 0, c.width, c.height) });
    }

    src.delete();
    contours.delete();
    hierarchy.delete();

    src = contours = hierarchy = null;

    return edgeRect;
}


 function getMiniBoxes(contour) {
    const boundingBox = cv.minAreaRect(contour);
    const points = Array.from(boxPoints(boundingBox.center, boundingBox.size, boundingBox.angle)).sort(
        (a, b) => a[0] - b[0]
    );

    let index_1 = 0,
        index_2 = 1,
        index_3 = 2,
        index_4 = 3;
    if (points[1][1] > points[0][1]) {
        index_1 = 0;
        index_4 = 1;
    } else {
        index_1 = 1;
        index_4 = 0;
    }
    if (points[3][1] > points[2][1]) {
        index_2 = 2;
        index_3 = 3;
    } else {
        index_2 = 3;
        index_3 = 2;
    }

    const box = [points[index_1], points[index_2], points[index_3], points[index_4]];
    const side = Math.min(boundingBox.size.height, boundingBox.size.width);
    return { points: box, sside: side };
}

 function boxPoints(center, size, angle) {
    const width = size.width;
    const height = size.height;

    const theta = (angle * Math.PI) / 180.0;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const cx = center.x;
    const cy = center.y;

    const dx = width * 0.5;
    const dy = height * 0.5;

    const rotatedPoints = [];

    // Top-Left
    const x1 = cx - dx * cosTheta + dy * sinTheta;
    const y1 = cy - dx * sinTheta - dy * cosTheta;
    rotatedPoints.push([x1, y1]);

    // Top-Right
    const x2 = cx + dx * cosTheta + dy * sinTheta;
    const y2 = cy + dx * sinTheta - dy * cosTheta;
    rotatedPoints.push([x2, y2]);

    // Bottom-Right
    const x3 = cx + dx * cosTheta - dy * sinTheta;
    const y3 = cy + dx * sinTheta + dy * cosTheta;
    rotatedPoints.push([x3, y3]);

    // Bottom-Left
    const x4 = cx - dx * cosTheta - dy * sinTheta;
    const y4 = cy - dx * sinTheta + dy * cosTheta;
    rotatedPoints.push([x4, y4]);

    return rotatedPoints;
}

 function unclip(box) {
    const unclip_ratio = 1.5;
    const area = Math.abs(polygonPolygonArea(box));
    const length = polygonPolygonLength(box);
    const distance = (area * unclip_ratio) / length;
    const tmpArr = [];
    box.forEach((item) => {
        const obj = {
            X: 0,
            Y: 0,
        };
        obj.X = item[0];
        obj.Y = item[1];
        tmpArr.push(obj);
    });
    const offset = new clipper.ClipperOffset();
    offset.AddPath(tmpArr, clipper.JoinType.jtRound, clipper.EndType.etClosedPolygon);
    const expanded = [];
    offset.Execute(expanded, distance);
    let expandedArr = [];
    expanded[0] &&
    expanded[0].forEach((item) => {
        expandedArr.push([item.X, item.Y]);
    });
    expandedArr = [].concat(...expandedArr);

    return expandedArr;
}


 function polygonPolygonArea(polygon) {
    let i = -1,
        n = polygon.length,
        a,
        b = polygon[n - 1],
        area = 0;

    while (++i < n) {
        a = b;
        b = polygon[i];
        area += a[1] * b[0] - a[0] * b[1];
    }

    return area / 2;
}

 function polygonPolygonLength(polygon) {
    let i = -1,
        n = polygon.length,
        b = polygon[n - 1],
        xa,
        ya,
        xb = b[0],
        yb = b[1],
        perimeter = 0;

    while (++i < n) {
        xa = xb;
        ya = yb;
        b = polygon[i];
        xb = b[0];
        yb = b[1];
        xa -= xb;
        ya -= yb;
        perimeter += Math.hypot(xa, ya);
    }

    return perimeter;
}

 export function data2canvas(data, w?, h?) {
    let x = document.createElement("canvas");
    x.width = w || data.width;
    x.height = h || data.height;
    x.getContext("2d").putImageData(data, 0, 0);
    return x;
}
 function int(num) {
    return num > 0 ? Math.floor(num) : Math.ceil(num);
}
 function flatten(arr) {
    return arr
        .toString()
        .split(",")
        .map((item) => +item);
}
 function linalgNorm(p0, p1) {
    return Math.sqrt(Math.pow(p0[0] - p1[0], 2) + Math.pow(p0[1] - p1[1], 2));
}
 function orderPointsClockwise(pts) {
    const rect = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
    ];
    const s = pts.map((pt) => pt[0] + pt[1]);
    rect[0] = pts[s.indexOf(Math.min(...s))];
    rect[2] = pts[s.indexOf(Math.max(...s))];
    const tmp = pts.filter((pt) => pt !== rect[0] && pt !== rect[2]);
    const diff = tmp[1].map((e, i) => e - tmp[0][i]);
    rect[1] = tmp[diff.indexOf(Math.min(...diff))];
    rect[3] = tmp[diff.indexOf(Math.max(...diff))];
    return rect;
}
 function getRotateCropImage(img, points) {
    const img_crop_width = int(Math.max(linalgNorm(points[0], points[1]), linalgNorm(points[2], points[3])));
    const img_crop_height = int(Math.max(linalgNorm(points[0], points[3]), linalgNorm(points[1], points[2])));
    const pts_std = [
        [0, 0],
        [img_crop_width, 0],
        [img_crop_width, img_crop_height],
        [0, img_crop_height],
    ];

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, flatten(points));
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, flatten(pts_std));

    // 获取到目标矩阵
    const M = cv.getPerspectiveTransform(srcTri, dstTri);
    const src = cv.imread(img);
    const dst = new cv.Mat();
    const dsize = new cv.Size(img_crop_width, img_crop_height);
    // 透视转换
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_CUBIC, cv.BORDER_REPLICATE, new cv.Scalar());

    const dst_img_height = dst.matSize[0];
    const dst_img_width = dst.matSize[1];
    let dst_rot;
    // 图像旋转
    if (dst_img_height / dst_img_width >= 1.5) {
        dst_rot = new cv.Mat();
        const dsize_rot = new cv.Size(dst.rows, dst.cols);
        const center = new cv.Point(dst.cols / 2, dst.cols / 2);
        const M = cv.getRotationMatrix2D(center, 90, 1);
        cv.warpAffine(dst, dst_rot, M, dsize_rot, cv.INTER_CUBIC, cv.BORDER_REPLICATE, new cv.Scalar());
    }

    let c = document.createElement("canvas");
    if (dst_rot) {
        c.width = dst_rot.matSize[1];
        c.height = dst_rot.matSize[0];
    } else {
        c.width = dst_img_width;
        c.height = dst_img_height;
    }
    cv.imshow(c, dst_rot || dst);

    src.delete();
    dst.delete();
    srcTri.delete();
    dstTri.delete();
    return c;
}

export function toPaddleInput(image, mean, std) {
    const imagedata = image.data;
    const redArray = [];
    const greenArray = [];
    const blueArray = [];
    let x = 0,
        y = 0;
    for (let i = 0; i < imagedata.length; i += 4) {
        if (!blueArray[y]) blueArray[y] = [];
        if (!greenArray[y]) greenArray[y] = [];
        if (!redArray[y]) redArray[y] = [];
        redArray[y][x] = (imagedata[i] / 255 - mean[0]) / std[0];
        greenArray[y][x] = (imagedata[i + 1] / 255 - mean[1]) / std[1];
        blueArray[y][x] = (imagedata[i + 2] / 255 - mean[2]) / std[2];
        x++;
        if (x == image.width) {
            x = 0;
            y++;
        }
    }

    return [blueArray, greenArray, redArray];
}


export function resizeImg(data, w, h) {
    let x = data2canvas(data, w, h);
    let src = document.createElement("canvas");
    src.width = w;
    src.height = h;
    src.getContext("2d").scale(w / data.width, h / data.height);
    src.getContext("2d").drawImage(x, 0, 0);
    return src.getContext("2d").getImageData(0, 0, w, h);
}


export function resizeNormImg(img, maxWhRatio) {
    let imgH = 48,
        imgW = 320;
    imgW = Math.floor(imgH * maxWhRatio);
    let h = img.height,
        w = img.width;
    let ratio = w / h;
    let resizedW;
    if (Math.ceil(imgH * ratio) > imgW) {
        resizedW = imgW;
    } else {
        resizedW = Math.floor(Math.ceil(imgH * ratio));
    }
    let d = resizeImg(img, resizedW, imgH);
    let cc = data2canvas(d, imgW, imgH);
    return cc.getContext("2d").getImageData(0, 0, imgW, imgH);
}
