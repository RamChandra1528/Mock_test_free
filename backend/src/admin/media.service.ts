import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
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
