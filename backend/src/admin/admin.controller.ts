import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Role, UserStatus } from "@prisma/client";
import { Response } from "express";
import { CurrentUser, AuthUser, Roles } from "../auth/auth.decorators";
import { AdminService } from "./admin.service";
import {
  BulkQuestionDto,
  ConfirmImportDto,
  CreateExamDto,
  CreateQuestionDto,
  ExamQueryDto,
  ExamSectionDto,
  PageQueryDto,
  QuestionQueryDto,
  TaxonomyDto,
  TopicDto,
  UpdateExamDto,
  UpdateImportedQuestionDto,
  UpdateQuestionDto,
  UpdateStudentDto,
} from "./admin.dto";
import { ImportService } from "./import.service";
import { MediaService } from "./media.service";
import { CalendarService } from "../calendar/calendar.service";
import {
  CalendarRangeDto,
  CreateAcademicEventDto,
  CreateCalendarNoteDto,
  UpdateAcademicEventDto,
  UpdateCalendarNoteDto,
} from "../calendar/calendar.dto";

@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly imports: ImportService,
    private readonly media: MediaService,
    private readonly calendar: CalendarService,
  ) {}

  @Get("dashboard") dashboard() {
    return this.admin.dashboard();
  }
  @Get("analytics") analytics() {
    return this.admin.analytics();
  }
  @Get("exams") exams(@Query() query: ExamQueryDto) {
    return this.admin.exams(query);
  }
  @Get("exams/:id") exam(@Param("id") id: string) {
    return this.admin.exam(id);
  }
  @Get("exams/:id/analytics") examAnalytics(@Param("id") id: string) {
    return this.admin.examAnalytics(id);
  }
  @Post("exams") createExam(@Body() dto: CreateExamDto) {
    return this.admin.createExam(dto);
  }
  @Put("exams/:id") updateExam(
    @Param("id") id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.admin.updateExam(id, dto);
  }
  @Delete("exams/:id") deleteExam(@Param("id") id: string) {
    return this.admin.deleteExam(id);
  }
  @Post("exams/:id/publish") publish(@Param("id") id: string) {
    return this.admin.publish(id, true);
  }
  @Post("exams/:id/declare-result") declareResult(@Param("id") id: string) {
    return this.admin.declareResult(id);
  }
  @Post("exams/:id/unpublish") unpublish(@Param("id") id: string) {
    return this.admin.publish(id, false);
  }
  @Post("exams/:id/duplicate") duplicate(@Param("id") id: string) {
    return this.admin.duplicateExam(id);
  }
  @Get("exams/:id/sections") sections(@Param("id") id: string) {
    return this.admin.sections(id);
  }
  @Post("exams/:id/sections") createSection(
    @Param("id") id: string,
    @Body() dto: ExamSectionDto,
  ) {
    return this.admin.createSection(id, dto);
  }
  @Put("exams/:examId/sections/:id") updateSection(
    @Param("examId") examId: string,
    @Param("id") id: string,
    @Body() dto: ExamSectionDto,
  ) {
    return this.admin.updateSection(examId, id, dto);
  }
  @Delete("exams/:examId/sections/:id") deleteSection(
    @Param("examId") examId: string,
    @Param("id") id: string,
  ) {
    return this.admin.deleteSection(examId, id);
  }

  @Get("questions") questions(@Query() query: QuestionQueryDto) {
    return this.admin.questions(query);
  }
  @Post("questions") createQuestion(@Body() dto: CreateQuestionDto) {
    return this.admin.createQuestion(dto);
  }
  @Post("questions/bulk-delete") bulkDeleteQuestions(
    @Body() dto: BulkQuestionDto,
  ) {
    return this.admin.bulkDeleteQuestions(dto.ids);
  }
  @Put("questions/:id") updateQuestion(
    @Param("id") id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.admin.updateQuestion(id, dto);
  }
  @Post("questions/:id/duplicate") duplicateQuestion(@Param("id") id: string) {
    return this.admin.duplicateQuestion(id);
  }
  @Delete("questions/:id") deleteQuestion(@Param("id") id: string) {
    return this.admin.deleteQuestion(id);
  }

  @Get("categories") categories() {
    return this.admin.categories();
  }
  @Post("categories") createCategory(@Body() dto: TaxonomyDto) {
    return this.admin.createCategory(dto);
  }
  @Put("categories/:id") updateCategory(
    @Param("id") id: string,
    @Body() dto: TaxonomyDto,
  ) {
    return this.admin.updateCategory(id, dto);
  }
  @Delete("categories/:id") deleteCategory(@Param("id") id: string) {
    return this.admin.deleteCategory(id);
  }
  @Get("subjects") subjects() {
    return this.admin.subjects();
  }
  @Post("subjects") createSubject(@Body() dto: TaxonomyDto) {
    return this.admin.createSubject(dto);
  }
  @Put("subjects/:id") updateSubject(
    @Param("id") id: string,
    @Body() dto: TaxonomyDto,
  ) {
    return this.admin.updateSubject(id, dto);
  }
  @Delete("subjects/:id") deleteSubject(@Param("id") id: string) {
    return this.admin.deleteSubject(id);
  }
  @Post("topics") createTopic(@Body() dto: TopicDto) {
    return this.admin.createTopic(dto);
  }
  @Put("topics/:id") updateTopic(
    @Param("id") id: string,
    @Body() dto: TopicDto,
  ) {
    return this.admin.updateTopic(id, dto);
  }
  @Delete("topics/:id") deleteTopic(@Param("id") id: string) {
    return this.admin.deleteTopic(id);
  }

  @Get("students") students(@Query() query: PageQueryDto) {
    return this.admin.students(query);
  }
  @Get("students/:id") student(@Param("id") id: string) {
    return this.admin.student(id);
  }
  @Put("students/:id") updateStudent(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.admin.updateStudent(id, dto);
  }
  @Patch("students/:id/status/:status") setStatus(
    @Param("id") id: string,
    @Param("status", new ParseEnumPipe(UserStatus)) status: UserStatus,
  ) {
    return this.admin.setStudentStatus(id, status);
  }
  @Delete("students/:id") deleteStudent(@Param("id") id: string) {
    return this.admin.deleteStudent(id);
  }
  @Get("attempts") attempts(@Query() query: PageQueryDto) {
    return this.admin.attempts(query);
  }

  @Get("calendar") calendarDashboard(
    @CurrentUser() user: AuthUser,
    @Query() query: CalendarRangeDto,
  ) {
    return this.calendar.adminCalendar(user.id, query);
  }
  @Post("calendar/notes") createCalendarNote(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCalendarNoteDto,
  ) {
    return this.calendar.createNote(user.id, dto);
  }
  @Put("calendar/notes/:id") updateCalendarNote(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateCalendarNoteDto,
  ) {
    return this.calendar.updateNote(user.id, id, dto);
  }
  @Delete("calendar/notes/:id") deleteCalendarNote(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.calendar.deleteNote(user.id, id);
  }
  @Post("calendar/events") createCalendarEvent(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAcademicEventDto,
  ) {
    return this.calendar.createEvent(user.id, dto);
  }
  @Put("calendar/events/:id") updateCalendarEvent(
    @Param("id") id: string,
    @Body() dto: UpdateAcademicEventDto,
  ) {
    return this.calendar.updateEvent(id, dto);
  }
  @Delete("calendar/events/:id") deleteCalendarEvent(@Param("id") id: string) {
    return this.calendar.deleteEvent(id);
  }

  @Post("media")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadMedia(@UploadedFile() file?: Express.Multer.File) {
    return this.media.saveImage(file);
  }

  @Post("import")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.upload(user.id, file);
  }
  @Get("import/template") template(@Res() response: Response) {
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="mockmaster-import-template.csv"',
    );
    response
      .type("text/csv")
      .send(
        "question,question_hi,option_a,option_a_hi,option_b,option_b_hi,option_c,option_c_hi,option_d,option_d_hi,correct_answer,explanation,explanation_hi,subject,subject_hi,topic,topic_hi,difficulty,marks,negative_marks\n",
      );
  }
  @Get("import/:id/preview") preview(@Param("id") id: string) {
    return this.imports.preview(id);
  }
  @Put("import/:importId/questions/:id") updateImported(
    @Param("importId") importId: string,
    @Param("id") id: string,
    @Body() dto: UpdateImportedQuestionDto,
  ) {
    return this.imports.updateQuestion(importId, id, dto);
  }
  @Delete("import/:importId/questions/:id") deleteImported(
    @Param("importId") importId: string,
    @Param("id") id: string,
  ) {
    return this.imports.deleteQuestion(importId, id);
  }
  @Post("import/:id/confirm") confirm(
    @Param("id") id: string,
    @Body() dto: ConfirmImportDto,
  ) {
    return this.imports.confirm(id, dto);
  }
}
