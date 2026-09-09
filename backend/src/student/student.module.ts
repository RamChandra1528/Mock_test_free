import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { ExpiryProcessor } from "./expiry.processor";
import { QuestionExplanationService } from "./question-explanation.service";

@Module({
  controllers: [StudentController],
  providers: [StudentService, ExpiryProcessor, QuestionExplanationService],
})
export class StudentModule {}
