import { Skeletonization } from "./models/skeletonization";
import { convertLocation } from "./utils/convertLocation";

const canvas: any = document.getElementById("canvas");
let points: any[] = [];

canvas.addEventListener("click", (e: any) => {
  const point = convertLocation(canvas, e.clientX, e.clientY);
  if (points.length < 2) {
    points.push(point);
  } else {
    points = [point];
  }
  drawImage();
});
var img = new Image();
img.crossOrigin = "*";
img.src = "./public/xuong.jpg";

function drawImage() {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0);
  canvas.width = img.width;
  canvas.height = img.height;
  const width = canvas.width;
  const height = canvas.height;

  context.drawImage(img, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  const saveImage = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  const xam = convertToGrayscale(imageData);

  const phanlap = erosionXn(
    closing(
      opening(applyFixedThreshold(xam, 100), [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]),
      [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]
    ),
    [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    2
  );

  const duong = new Skeletonization(phanlap.data, width, height);
  duong.thinImage();
  const xuong = duong.data();
  context.putImageData(saveImage, 0, 0);
  const clickContainer = points;
  if (clickContainer.length === 2) {
    const [start, stop] = clickContainer;
    const minStart = findMinDistance(xuong, start);
    const minStop = findMinDistance(xuong, stop);
    const path = findShortestPath(xuong, minStart, minStop);
    // drawLine(canvas, [minStart, minStop]);
    if (path.length) {
      drawLine(canvas, [start, ...path, stop]);
    }
  }
}

img.onload = drawImage;

function createGaussianKernel(size: number): any {
  const sigma = size / 3;
  const kernel = [];
  const mean = Math.floor(size / 2);
  let sum = 0;

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - mean;
      const dy = y - mean;
      const exponent = -(dx * dx + dy * dy) / (2 * sigma * sigma);
      const value = (1 / (2 * Math.PI * sigma * sigma)) * Math.exp(exponent);
      kernel[y][x] = value;
      sum += value;
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return kernel;
}

function applyGaussianBlur(imageData: any, kernel: any) {
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(imageData.data.length);
  const kernelSize = kernel.length;
  const halfKernelSize = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = -halfKernelSize; ky <= halfKernelSize; ky++) {
        for (let kx = -halfKernelSize; kx <= halfKernelSize; kx++) {
          const srcX = Math.min(Math.max(x + kx, 0), width - 1);
          const srcY = Math.min(Math.max(y + ky, 0), height - 1);

          const k = kernel[ky + halfKernelSize][kx + halfKernelSize];
          const idx = (srcY * width + srcX) * 4;
          r += imageData.data[idx] * k;
          g += imageData.data[idx + 1] * k;
          b += imageData.data[idx + 2] * k;
        }
      }
      const dstIdx = (y * width + x) * 4;
      output[dstIdx] = r;
      output[dstIdx + 1] = g;
      output[dstIdx + 2] = b;
      output[dstIdx + 3] = 255;
    }
  }

  return new ImageData(output, width, height);
}

function convertToGrayscale(imageData: any) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    const gray = 0.299 * red + 0.587 * green + 0.114 * blue;

    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  return imageData;
}

function erosion(imageData: any, kernel: any) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const outputData = new Uint8ClampedArray(data.length);

  const kernelHeight = kernel.length;
  const kernelWidth = kernel[0].length;
  const kx = Math.floor(kernelWidth / 2);
  const ky = Math.floor(kernelHeight / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minR = 255,
        minG = 255,
        minB = 255;

      let appliedKernel = false;

      for (let j = -ky; j <= ky; j++) {
        for (let i = -kx; i <= kx; i++) {
          const newX = x + i;
          const newY = y + j;

          if (kernel[j + ky][i + kx] === 1) {
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
              const idx = (newY * width + newX) * 4;
              minR = Math.min(minR, data[idx]);
              minG = Math.min(minG, data[idx + 1]);
              minB = Math.min(minB, data[idx + 2]);
              appliedKernel = true;
            }
          }
        }
      }

      const outputIdx = (y * width + x) * 4;

      if (appliedKernel) {
        outputData[outputIdx] = minR;
        outputData[outputIdx + 1] = minG;
        outputData[outputIdx + 2] = minB;
      }

      outputData[outputIdx + 3] = data[outputIdx + 3];
    }
  }

  return new ImageData(outputData, width, height);
}

function erosionXn(imageData: any, kernel: any, solan: number) {
  let currentImageData = imageData;

  for (let i = 0; i < solan; i++) {
    currentImageData = erosion(currentImageData, kernel);
  }

  return currentImageData;
}

const closing = (imageData: any, kernel: any) => {
  return erosion(dilation(imageData, kernel), kernel);
};

function dilation(imageData: any, kernel: any) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const outputData = new Uint8ClampedArray(data.length);

  const kernelHeight = kernel.length;
  const kernelWidth = kernel[0].length;
  const kx = Math.floor(kernelWidth / 2);
  const ky = Math.floor(kernelHeight / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxR = 0,
        maxG = 0,
        maxB = 0;
      let appliedKernel = false;

      for (let j = -ky; j <= ky; j++) {
        for (let i = -kx; i <= kx; i++) {
          const newX = x + i;
          const newY = y + j;

          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            if (kernel[j + ky][i + kx] === 1) {
              const idx = (newY * width + newX) * 4;
              maxR = Math.max(maxR, data[idx]);
              maxG = Math.max(maxG, data[idx + 1]);
              maxB = Math.max(maxB, data[idx + 2]);
              appliedKernel = true;
            }
          }
        }
      }

      const outputIdx = (y * width + x) * 4;
      if (appliedKernel) {
        outputData[outputIdx] = maxR;
        outputData[outputIdx + 1] = maxG;
        outputData[outputIdx + 2] = maxB;
      }
      outputData[outputIdx + 3] = data[outputIdx + 3];
    }
  }

  return new ImageData(outputData, width, height);
}

const findMinDistance = (imageData: any, point: any) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let min: any = null;
  let minDistance = Infinity;

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = (i * width + j) * 4;
      if (data[index] === 255) {
        const distance = Math.sqrt((point.x - j) ** 2 + (point.y - i) ** 2);

        if (distance < minDistance) {
          minDistance = distance;
          min = { x: j, y: i };
        }
      }
    }
  }

  return min;
};

function isValid(x: any, y: any, width: any, height: any) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

function findShortestPath(imageDatas: any, start: any, end: any) {
  const width = imageDatas.width;
  const height = imageDatas.height;
  let imageData = [];

  for (let i = 0; i < imageDatas.data.length; i += 4) {
    imageData.push(imageDatas.data[i]);
  }

  const distances = new Float32Array(width * height);
  const previous = new Array(width * height).fill(null);
  distances.fill(Infinity);
  const nodes = new Set();
  function generateDirections(n: number) {
    const directions = [];

    for (let dx = -n; dx <= n; dx++) {
      for (let dy = -n; dy <= n; dy++) {
        if (dx !== 0 || dy !== 0) {
          // Loại bỏ điểm trung tâm (0, 0)
          directions.push({ x: dx, y: dy });
        }
      }
    }

    return directions;
  }
  const directions = generateDirections(1);

  function reconstructPath(previous: any, end: any, width: any) {
    const path = [];
    let current = end;

    while (previous[current.x + current.y * width] !== null) {
      path.push(current);
      const p = previous[current.x + current.y * width];
      current = { x: p.x, y: p.y };
    }

    path.push(current);
    return path.reverse();
  }

  distances[start.x + start.y * width] = 0;
  nodes.add({ x: start.x, y: start.y });
  while (nodes.size > 0) {
    const closestNode: any = Array.from(nodes).reduce(
      (minNode: any, node: any) => {
        const { x, y }: any = node;
        return distances[x + y * width] <
          distances[minNode.x + minNode.y * width]
          ? node
          : minNode;
      }
    );
    nodes.delete(closestNode);
    const [currentX, currentY] = [closestNode.x, closestNode.y];

    if (currentX === end.x && currentY === end.y) {
      return reconstructPath(previous, end, width);
    }

    for (const direction of directions) {
      const neighborX = currentX + direction.x;
      const neighborY = currentY + direction.y;

      if (isValid(neighborX, neighborY, width, height)) {
        const pixelValue = imageData[neighborX + neighborY * width];
        // const newDistance = distances[currentX + currentY * width] + 1;

        const newDistance =
          distances[currentX + currentY * width] + (255 - pixelValue);
        if (newDistance < distances[neighborX + neighborY * width]) {
          distances[neighborX + neighborY * width] = newDistance;
          previous[neighborX + neighborY * width] = {
            x: currentX,
            y: currentY,
          };
          nodes.add({ x: neighborX, y: neighborY });
        }
      }
    }
  }

  return [];
}

function drawLine(canvas: any, points: Array<any>) {
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

const opening = (imageData: any, kernel: any) => {
  return dilation(erosion(imageData, kernel), kernel);
};

function applyFixedThreshold(imageData: any, threshold: any) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    if (gray > threshold) {
      data[i] = data[i + 1] = data[i + 2] = 0;
    } else {
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
  return imageData;
}
