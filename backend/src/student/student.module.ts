import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { ExpiryProcessor } from "./expiry.processor";

@Module({
  controllers: [StudentController],
  providers: [StudentService, ExpiryProcessor],
})
export class StudentModule {}
