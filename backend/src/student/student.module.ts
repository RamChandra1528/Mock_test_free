import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { ExpiryProcessor } from "./expiry.processor";
import { CalendarService } from "../calendar/calendar.service";

@Module({
  controllers: [StudentController],
  providers: [StudentService, ExpiryProcessor, CalendarService],
})
export class StudentModule {}
