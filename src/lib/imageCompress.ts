// Client-side image downscale to keep AI uploads small.
// Returns a data URL (JPEG) capped at maxDim and ~quality.
export async function compressImage(
  file: File,
  maxDim = 1024,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  // GIFs / SVGs: just return as-is to preserve animation/vectors.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return dataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  if (scale === 1 && file.size < 400 * 1024) return dataUrl; // small enough already

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
