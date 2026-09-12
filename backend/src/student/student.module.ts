import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { ExpiryProcessor } from "./expiry.processor";
import { QuestionExplanationService } from "./question-explanation.service";
import { PaperAssistantService } from "./paper-assistant.service";

@Module({
  controllers: [StudentController],
  providers: [
    StudentService,
    ExpiryProcessor,
    QuestionExplanationService,
    PaperAssistantService,
  ],
})
export class StudentModule {}
