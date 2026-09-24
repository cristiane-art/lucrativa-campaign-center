import QRCode from "qrcode";
import { BRAND } from "./brand";

// Gera o PNG do QR Code como data URL — cálculo local, sem LLM (seção 38).
export async function generateQrCodePng(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: {
      dark: BRAND.colors.accentStrong,
      light: "#FFFFFF",
    },
  });
}

export async function generateQrCodeBuffer(targetUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(targetUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: {
      dark: BRAND.colors.accentStrong,
      light: "#FFFFFF",
    },
  });
}
