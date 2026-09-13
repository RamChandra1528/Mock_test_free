import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ImportService } from "./import.service";
import { MediaService } from "./media.service";
import { CalendarService } from "../calendar/calendar.service";

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize:
            Number(config.get<string>("MAX_UPLOAD_MB") ?? 15) * 1024 * 1024,
        },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, ImportService, MediaService, CalendarService],
})
export class AdminModule {}
