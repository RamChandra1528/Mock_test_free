import { Type } from "class-transformer";
import { AcademicEventType, TaskPriority } from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CalendarRangeDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class CreateCalendarNoteDto {
  @IsDateString() date!: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsString() @MinLength(1) @MaxLength(10000) content!: string;
}

export class UpdateCalendarNoteDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(10000) content?: string;
}

export class CreateStickyNoteDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsString() @MinLength(1) @MaxLength(5000) content!: string;
  @IsOptional()
  @IsIn(["yellow", "pink", "blue", "green", "lavender"])
  color?: "yellow" | "pink" | "blue" | "green" | "lavender";
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10000)
  @Max(10000)
  positionX?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10000)
  @Max(10000)
  positionY?: number;
}

export class UpdateStickyNoteDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(5000) content?: string;
  @IsOptional()
  @IsIn(["yellow", "pink", "blue", "green", "lavender"])
  color?: "yellow" | "pink" | "blue" | "green" | "lavender";
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10000)
  @Max(10000)
  positionX?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10000)
  @Max(10000)
  positionY?: number;
}

export class UpdateCalendarGoalsDto {
  @IsOptional() @IsString() @MaxLength(5000) overallTarget?: string;
  @IsOptional() @IsString() @MaxLength(5000) longTermGoal?: string;
  @IsOptional() @IsString() @MaxLength(5000) shortTermGoal?: string;
  @IsOptional() @IsString() @MaxLength(5000) todayGoal?: string;
}

export class CreateCalendarTaskDto {
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(TaskPriority) priority: TaskPriority =
    TaskPriority.MEDIUM;
}

export class UpdateCalendarTaskDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string | null;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsBoolean() completed?: boolean;
}

export class CreateAcademicEventDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsEnum(AcademicEventType) eventType!: AcademicEventType;
  @IsDateString() startAt!: string;
  @IsOptional() @IsDateString() endAt?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
}

export class UpdateAcademicEventDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsEnum(AcademicEventType) eventType?: AcademicEventType;
  @IsOptional() @IsDateString() startAt?: string;
  @IsOptional() @IsDateString() endAt?: string | null;
  @IsOptional() @IsString() @MaxLength(5000) description?: string | null;
}
