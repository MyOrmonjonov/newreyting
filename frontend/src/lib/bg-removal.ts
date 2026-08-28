// Rasmdan odamni fondan ajratib olish (client-side, server kerak emas).
// Google'ning Apache-2.0 litsenziyali BodyPix (ResNet50, eng yuqori aniqlik
// sozlamalari) modeli — tijorat mahsulotda erkin ishlatish mumkin
// (AGPL-3.0 litsenziyali @imgly/background-removal'dan ataylab qochildi).
//
// Tezlikdan ko'ra aniqlik ustun qo'yilgan: ResNet50 + quantBytes:4 MobileNet'ga
// nisbatan sekinroq va katta model yuklaydi (birinchi marta), lekin chekkalarni
// ancha aniqroq ajratadi. Bundan tashqari, xom maskani to'g'ridan-to'g'ri alpha
// sifatida ishlatish chekkalarda fon rangi "aralashib qolishiga" (halo) olib
// keladi — buni oldini olish uchun quyida threshold + eroziya + tor feather
// bilan maskani o'zimiz "tozalaymiz".
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-core";
import * as bodySegmentation from "@tensorflow-models/body-segmentation";

let segmenterPromise: Promise<bodySegmentation.BodySegmenter> | undefined;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.BodyPix, {
      architecture: "ResNet50",
      outputStride: 16,
      quantBytes: 4,
    });
  }
  return segmenterPromise;
}

/** Modelni oldindan yuklab, keshlab qo'yadi (birinchi yuklash sekinroq bo'ladi). */
export function warmUpSegmenter() {
  void getSegmenter();
}

export type CutoutResult = {
  /** Fondan ajratilgan, shaffof orqa fonli PNG (data URL). */
  dataUrl: string;
  width: number;
  height: number;
};

function erodeChannel(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return src;
  const tmp = new Uint8ClampedArray(src.length);
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let m = 255;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(width - 1, Math.max(0, x + k));
        const v = src[y * width + xx]!;
        if (v < m) m = v;
      }
      tmp[y * width + x] = m;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let m = 255;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(height - 1, Math.max(0, y + k));
        const v = tmp[yy * width + x]!;
        if (v < m) m = v;
      }
      out[y * width + x] = m;
    }
  }
  return out;
}

function boxBlurChannel(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return src;
  const tmp = new Float32Array(src.length);
  const out = new Uint8ClampedArray(src.length);
  const norm = 1 / (radius * 2 + 1);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const xx = Math.min(width - 1, Math.max(0, k));
      sum += src[y * width + xx]!;
    }
    for (let x = 0; x < width; x++) {
      tmp[y * width + x] = sum * norm;
      const addX = Math.min(width - 1, x + radius + 1);
      const subX = Math.max(0, x - radius);
      sum += src[y * width + addX]! - src[y * width + subX]!;
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const yy = Math.min(height - 1, Math.max(0, k));
      sum += tmp[yy * width + x]!;
    }
    for (let y = 0; y < height; y++) {
      out[y * width + x] = Math.round(sum * norm);
      const addY = Math.min(height - 1, y + radius + 1);
      const subY = Math.max(0, y - radius);
      sum += tmp[addY * width + x]! - tmp[subY * width + x]!;
    }
  }
  return out;
}

/**
 * Xom grayscale ishonchlilik maskasini "aniq" chekka uchun tozalaydi:
 * 1) LOW/HIGH threshold band bilan kontrastni keskin oshiradi (bulg'ib turgan
 *    o'rta qiymatlarni tugatadi),
 * 2) 2px eroziya — fon rangi original suratda allaqachon aralashib ulgurgan
 *    eng tashqi chekka qatorini butunlay kesib tashlaydi (halo'ning asosiy sababi),
 * 3) 1px feather — faqat yangi chekkaning o'zida silliqlik uchun, "zubchat"
 *    bo'lib qolmasligi uchun.
 */
function refineMask(gray: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const LOW = 90;
  const HIGH = 200;
  const sharpened = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i]!;
    if (v <= LOW) sharpened[i] = 0;
    else if (v >= HIGH) sharpened[i] = 255;
    else sharpened[i] = Math.round(((v - LOW) / (HIGH - LOW)) * 255);
  }
  const eroded = erodeChannel(sharpened, width, height, 2);
  return boxBlurChannel(eroded, width, height, 1);
}

// Neyron tarmoqqa haddan tashqari katta rasm berish (masalan 3000px+) hisoblashni
// keskin sekinlashtiradi, aniqlikka esa deyarli qo'shimcha foyda bermaydi — odam
// siluetini ajratish uchun ~1280px uzun tomon yetarli. Model uchun rasmni shu
// o'lchamgacha kichraytiramiz, keyin maskani asl (to'liq) o'lchamga qaytarib,
// yakuniy natijani asl sifatda chiqaramiz.
const MAX_INFERENCE_DIMENSION = 1280;

/**
 * Berilgan rasmdagi odamni fondan ajratadi va shaffof (alpha-kanalli) PNG qaytaradi.
 */
export async function cutoutPersonFromImage(image: HTMLImageElement): Promise<CutoutResult> {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const scale = Math.min(1, MAX_INFERENCE_DIMENSION / Math.max(width, height));
  const inferenceWidth = Math.max(1, Math.round(width * scale));
  const inferenceHeight = Math.max(1, Math.round(height * scale));

  let inferenceInput: HTMLImageElement | HTMLCanvasElement = image;
  if (scale < 1) {
    const inferenceCanvas = document.createElement("canvas");
    inferenceCanvas.width = inferenceWidth;
    inferenceCanvas.height = inferenceHeight;
    inferenceCanvas.getContext("2d")!.drawImage(image, 0, 0, inferenceWidth, inferenceHeight);
    inferenceInput = inferenceCanvas;
  }

  const segmenter = await getSegmenter();
  const segmentation = await segmenter.segmentPeople(inferenceInput, {
    multiSegmentation: false,
    segmentBodyParts: false,
    segmentationThreshold: 0.6,
    internalResolution: "high",
  });
  const first = segmentation[0];
  if (!first) {
    throw new Error("Rasmda odam topilmadi. Boshqa, aniqroq rasm bilan urinib ko'ring.");
  }

  const maskData = await first.mask.toImageData();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas kontekstini ochib bo'lmadi.");

  ctx.drawImage(image, 0, 0, width, height);
  const frame = ctx.getImageData(0, 0, width, height);

  // Mask va asl rasm o'lchami mos kelmasa, kerakli o'lchamga moslashtiramiz.
  let maskPixels = maskData.data;
  let maskWidth = maskData.width;
  let maskHeight = maskData.height;
  if (maskWidth !== width || maskHeight !== height) {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    maskCanvas.getContext("2d")!.putImageData(maskData, 0, 0);

    const resized = document.createElement("canvas");
    resized.width = width;
    resized.height = height;
    const resizedCtx = resized.getContext("2d")!;
    resizedCtx.drawImage(maskCanvas, 0, 0, width, height);
    maskPixels = resizedCtx.getImageData(0, 0, width, height).data;
    maskWidth = width;
    maskHeight = height;
  }

  const gray = new Uint8ClampedArray(width * height);
  let grayMax = 0;
  let graySum = 0;
  for (let i = 0, p = 0; i < maskPixels.length; i += 4, p++) {
    gray[p] = maskPixels[i]!;
    if (gray[p]! > grayMax) grayMax = gray[p]!;
    graySum += gray[p]!;
  }
  const refined = refineMask(gray, width, height);
  let refinedMax = 0;
  let refinedSum = 0;
  for (let p = 0; p < refined.length; p++) {
    if (refined[p]! > refinedMax) refinedMax = refined[p]!;
    refinedSum += refined[p]!;
  }
console.log(
    "[bg-removal-debug] " +
      JSON.stringify({
        inferenceWidth,
        inferenceHeight,
        maskDataWidth: maskData.width,
        maskDataHeight: maskData.height,
        grayMax,
        grayAvg: Math.round((graySum / gray.length) * 100) / 100,
        refinedMax,
        refinedAvg: Math.round((refinedSum / refined.length) * 100) / 100,
      }),
  );

  for (let p = 0, i = 0; p < refined.length; p++, i += 4) {
    frame.data[i + 3] = refined[p]!;
  }
  ctx.putImageData(frame, 0, 0);

  return { dataUrl: canvas.toDataURL("image/png"), width, height };
}
