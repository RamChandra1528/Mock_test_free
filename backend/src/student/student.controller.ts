import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser, Roles } from "../auth/auth.decorators";
import {
  AttemptHistoryQueryDto,
  ExamListQueryDto,
  LeaderboardQueryDto,
  SaveAnswerDto,
  UpdateLanguageDto,
  UpdateProfileDto,
} from "./student.dto";
import { StudentService } from "./student.service";
import { CalendarService } from "../calendar/calendar.service";
import {
  CalendarRangeDto,
  CreateCalendarNoteDto,
  CreateCalendarTaskDto,
  CreateStickyNoteDto,
  UpdateCalendarGoalsDto,
  UpdateCalendarNoteDto,
  UpdateCalendarTaskDto,
  UpdateStickyNoteDto,
} from "../calendar/calendar.dto";

@Roles(Role.STUDENT)
@Controller("student")
export class StudentController {
  constructor(
    private readonly student: StudentService,
    private readonly calendar: CalendarService,
  ) {}
  @Get("categories") categories() {
    return this.student.categories();
  }
  @Get("subjects") subjects() {
    return this.student.subjects();
  }
  @Get("dashboard") dashboard(@CurrentUser() user: AuthUser) {
    return this.student.dashboard(user.id);
  }
  @Get("calendar") calendarDashboard(
    @CurrentUser() user: AuthUser,
    @Query() query: CalendarRangeDto,
  ) {
    return this.calendar.studentCalendar(user.id, query);
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
  @Post("calendar/sticky-notes") createStickyNote(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateStickyNoteDto,
  ) {
    return this.calendar.createStickyNote(user.id, dto);
  }
  @Put("calendar/sticky-notes/:id") updateStickyNote(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateStickyNoteDto,
  ) {
    return this.calendar.updateStickyNote(user.id, id, dto);
  }
  @Delete("calendar/sticky-notes/:id") deleteStickyNote(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.calendar.deleteStickyNote(user.id, id);
  }
  @Put("calendar/goals") updateCalendarGoals(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCalendarGoalsDto,
  ) {
    return this.calendar.updateGoals(user.id, dto);
  }
  @Post("calendar/tasks") createCalendarTask(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCalendarTaskDto,
  ) {
    return this.calendar.createTask(user.id, dto);
  }
  @Patch("calendar/tasks/:id") updateCalendarTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateCalendarTaskDto,
  ) {
    return this.calendar.updateTask(user.id, id, dto);
  }
  @Delete("calendar/tasks/:id") deleteCalendarTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.calendar.deleteTask(user.id, id);
  }
  @Get("leaderboard") leaderboard(
    @CurrentUser() user: AuthUser,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.student.leaderboard(user.id, query.period);
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
