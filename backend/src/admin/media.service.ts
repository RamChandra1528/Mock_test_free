import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdir, open, rename, unlink, writeFile } from "fs/promises";
import { join } from "path";

@Injectable()
export class MediaService {
  private readonly publicDir: string;
  constructor(config: ConfigService) {
    this.publicDir = join(config.get("UPLOAD_DIR", "uploads"), "public");
  }

  async saveImage(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Choose an image to upload");
    const extension = detectImage(file.buffer);
    if (!extension)
      throw new BadRequestException(
        "Only valid PNG, JPEG, GIF, and WebP images are supported",
      );
    await mkdir(this.publicDir, { recursive: true });
    const name = `${randomUUID()}.${extension}`;
    await writeFile(join(this.publicDir, name), file.buffer);
    return { url: `/uploads/${name}`, fileName: file.originalname };
  }

  async savePdf(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Choose a PDF to upload");
    const validPdf = file.path
      ? await hasPdfSignature(file.path)
      : file.buffer?.subarray(0, 5).equals(Buffer.from("%PDF-"));
    if (!validPdf) {
      if (file.path) await unlink(file.path).catch(() => undefined);
      throw new BadRequestException("Only valid PDF files are supported");
    }
    await mkdir(this.publicDir, { recursive: true });
    const name = `${randomUUID()}.pdf`;
    const destination = join(this.publicDir, name);
    if (file.path) {
      await rename(file.path, destination).catch(async (error) => {
        await unlink(file.path).catch(() => undefined);
        throw error;
      });
    } else {
      await writeFile(destination, file.buffer);
    }
    return { url: `/uploads/${name}`, fileName: file.originalname };
  }
}

async function hasPdfSignature(path: string) {
  const handle = await open(path, "r");
  try {
    const signature = Buffer.alloc(5);
    await handle.read(signature, 0, signature.length, 0);
    return signature.equals(Buffer.from("%PDF-"));
  } finally {
    await handle.close();
  }
}

function detectImage(buffer: Buffer) {
  const hex = buffer.subarray(0, 12).toString("hex");
  if (hex.startsWith("89504e470d0a1a0a")) return "png";
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "gif";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  return null;
}
