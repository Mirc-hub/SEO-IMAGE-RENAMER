import sharp from "sharp";

/**
 * Resizes an image to max 800x800 and converts to JPEG 85% quality.
 * Returns the compressed image as a Buffer.
 */
export async function prepareImageForAnalysis(
  imageBuffer: Buffer
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // RGBA → RGB
    .jpeg({ quality: 85 })
    .toBuffer();
}
