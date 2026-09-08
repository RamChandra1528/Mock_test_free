import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsEnum,
} from "class-validator";
import { Language } from "@prisma/client";

export class ExamListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 12;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsString() status?: "attempted" | "not-attempted";
  @IsOptional() @IsString() sort?:
    "newest" | "popular" | "highest-score" | "difficulty";
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) minDuration?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxDuration?: number;
}

export class SaveAnswerDto {
  @IsUUID() questionId!: string;
  @IsOptional() @IsUUID() selectedOptionId?: string | null;
  @IsBoolean() markedForReview = false;
  @IsBoolean() visited = true;
  @Type(() => Number) @IsInt() @Min(0) currentQuestion!: number;
}

export class AttemptHistoryQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() sort?: "newest" | "score" | "accuracy";
}

export class UpdateProfileDto {
  @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
}

export class UpdateLanguageDto {
  @IsEnum(Language) preferredLanguage!: Language;
}
