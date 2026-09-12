import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import {
  AttemptHistoryQueryDto,
  ExamListQueryDto,
  SaveAnswerDto,
  UpdateLanguageDto,
  UpdateProfileDto,
} from "./student.dto";
import { StudentService } from "./student.service";

@Roles(Role.STUDENT)
@Controller("student")
export class StudentController {
  constructor(private readonly student: StudentService) {}
  @Get("categories") categories() {
    return this.student.categories();
  }
  @Get("subjects") subjects() {
    return this.student.subjects();
  }
  @Get("dashboard") dashboard(@CurrentUser() user: AuthUser) {
    return this.student.dashboard(user.id);
  }
  @Get("exams") exams(
    @CurrentUser() user: AuthUser,
    @Query() query: ExamListQueryDto,
  ) {
    return this.student.exams(user.id, query);
  }
  @Get("exams/:id") exam(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.student.examDetails(user.id, id);
  }
  @Post("exams/:id/start") start(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.student.start(user.id, id);
  }
  @Get("attempts") history(
    @CurrentUser() user: AuthUser,
    @Query() query: AttemptHistoryQueryDto,
  ) {
    return this.student.history(user.id, query);
  }
  @Get("attempts/:id") attempt(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.student.getAttempt(user.id, id);
  }
  @Post("attempts/:id/answers") answer(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.student.saveAnswer(user.id, id, dto);
  }
  @Post("attempts/:id/submit") submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.student.submit(user.id, id);
  }
  @Get("attempts/:id/result") result(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.student.result(user.id, id);
  }
  @Get("attempts/:id/review") review(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.student.review(user.id, id);
  }
  @Get("performance") performance(@CurrentUser() user: AuthUser) {
    return this.student.performance(user.id);
  }
  @Get("profile") profile(@CurrentUser() user: AuthUser) {
    return this.student.profile(user.id);
  }
  @Patch("profile") updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.student.updateProfile(user.id, dto);
  }
  @Patch("profile/language") updateLanguage(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.student.updateLanguage(user.id, dto);
  }
}
