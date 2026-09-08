import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { StudentService } from "./student.service";

@Injectable()
export class ExpiryProcessor {
  constructor(private readonly students: StudentService) {}

  @Interval(60_000)
  async submitExpiredAttempts() {
    await this.students.expireDueAttempts();
  }
}
