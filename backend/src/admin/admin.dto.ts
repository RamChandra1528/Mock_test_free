import { Exclude, Transform, Type } from "class-transformer";
import {
  Difficulty,
  DuplicateAction,
  ExamStatus,
  Language,
  QuestionStatus,
  UserStatus,
} from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() search?: string;
}

/** Fields an administrator is allowed to maintain on a student account. */
export class UpdateStudentDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @IsOptional() @IsEmail() @MaxLength(190) email?: string;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsOptional() @IsEnum(Language) preferredLanguage?: Language;
}

export class ExamQueryDto extends PageQueryDto {
  @IsOptional() @IsEnum(ExamStatus) status?: ExamStatus;
}

export class QuestionQueryDto extends PageQueryDto {
  @IsOptional() @IsUUID() examId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsOptional() @IsUUID() topicId?: string;
  @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
}

export class CreateExamDto {
  @IsString() @MinLength(3) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(180) titleHi?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionHi?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() instructionsHi?: string;
  @IsUUID() categoryId!: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(600) durationMinutes!: number;
  @Type(() => Number) @IsNumber() @Min(0.01) totalMarks!: number;
  @Type(() => Number) @IsNumber() @Min(0.01) marksPerQuestion!: number;
  @Type(() => Number) @IsNumber() @Min(0) negativeMarks!: number;
  @IsEnum(Difficulty) difficulty!: Difficulty;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) attemptLimit?: number;
  @IsBoolean() randomizeQuestions = false;
  @IsBoolean() randomizeOptions = false;
  @IsBoolean() showResultImmediately = false;
  @IsBoolean() allowAnswerReview = true;
  @IsBoolean() requireExplanations = false;
  @IsBoolean() allowResume = true;
}

export class UpdateExamDto {
  // Compatibility with open clients that submit the full exam detail response.
  // These fields must never reach Prisma or override the route's exam ID.
  @Exclude({ toClassOnly: true }) declare id?: string;
  @Exclude({ toClassOnly: true }) declare examId?: string;
  @Exclude({ toClassOnly: true }) declare status?: string;
  @Exclude({ toClassOnly: true }) declare createdAt?: string;
  @Exclude({ toClassOnly: true }) declare updatedAt?: string;
  @Exclude({ toClassOnly: true }) declare publishedAt?: string;
  @Exclude({ toClassOnly: true }) declare category?: unknown;
  @Exclude({ toClassOnly: true }) declare subject?: unknown;
  @Exclude({ toClassOnly: true }) declare sections?: unknown;
  @Exclude({ toClassOnly: true }) declare _count?: unknown;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(180) titleHi?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() descriptionHi?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() instructionsHi?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.01) totalMarks?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  marksPerQuestion?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) negativeMarks?: number;
  @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) attemptLimit?: number;
  @IsOptional() @IsBoolean() randomizeQuestions?: boolean;
  @IsOptional() @IsBoolean() randomizeOptions?: boolean;
  @IsOptional() @IsBoolean() showResultImmediately?: boolean;
  @IsOptional() @IsBoolean() allowAnswerReview?: boolean;
  @IsOptional() @IsBoolean() requireExplanations?: boolean;
  @IsOptional() @IsBoolean() allowResume?: boolean;
}

export class OptionDto {
  @IsString() @MaxLength(5) label!: string;
  // An option can be text-only, image-only, or contain both. The service
  // verifies that at least one of text and imageUrl is present.
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() textHi?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsBoolean() isCorrect!: boolean;
}

export class CreateQuestionDto {
  @IsUUID() examId!: string;
  @IsOptional() @IsUUID() sectionId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsOptional() @IsUUID() topicId?: string;
  @IsString() @MinLength(3) text!: string;
  @IsOptional() @IsString() textHi?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsString() explanationHi?: string;
  @IsEnum(Difficulty) difficulty!: Difficulty;
  @Type(() => Number) @IsNumber() @Min(0.01) marks!: number;
  @Type(() => Number) @IsNumber() @Min(0) negativeMarks!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) order?: number;
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options!: OptionDto[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}

export class TaxonomyDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(100) nameHi?: string;
  @IsOptional() @IsString() @MaxLength(255) description?: string;
}

export class TopicDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) nameHi?: string;
  @IsUUID() subjectId!: string;
}

export class ExamSectionDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) nameHi?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @Type(() => Number) @IsInt() @Min(1) order!: number;
}

export class BulkQuestionDto {
  @IsArray() @ArrayMinSize(1) @IsUUID("4", { each: true }) ids!: string[];
}

export class UpdateImportedQuestionDto {
  // Older review clients submit the entire preview record. Never persist its
  // server-owned fields; the URL and database remain authoritative.
  @Exclude({ toClassOnly: true }) declare id?: string;
  @Exclude({ toClassOnly: true }) declare importId?: string;
  @Exclude({ toClassOnly: true }) declare warnings?: unknown;
  @Exclude({ toClassOnly: true }) declare duplicateOfId?: string;
  @Exclude({ toClassOnly: true }) declare order?: number;
  @Exclude({ toClassOnly: true }) declare createdAt?: string;
  @Exclude({ toClassOnly: true }) declare updatedAt?: string;
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() textHi?: string;
  @IsOptional() @IsString() optionA?: string;
  @IsOptional() @IsString() optionAHi?: string;
  @IsOptional() @IsString() optionB?: string;
  @IsOptional() @IsString() optionBHi?: string;
  @IsOptional() @IsString() optionC?: string;
  @IsOptional() @IsString() optionCHi?: string;
  @IsOptional() @IsString() optionD?: string;
  @IsOptional() @IsString() optionDHi?: string;
  @IsOptional() @IsString() correctAnswer?: string;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsString() explanationHi?: string;
  @IsOptional() @IsString() subjectName?: string;
  @IsOptional() @IsString() subjectNameHi?: string;
  @IsOptional() @IsString() topicName?: string;
  @IsOptional() @IsString() topicNameHi?: string;
  @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value, obj }) =>
    // The old CSV parser stored blank marks as zero, and old clients send that
    // value back with preview metadata. Repair only that legacy request shape.
    value === 0 && typeof obj.id === "string" && typeof obj.importId === "string"
      ? 1
      : value,
  )
  @IsNumber() @Min(0.01) marks?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) negativeMarks?: number;
  @IsOptional() @IsEnum(QuestionStatus) status?: QuestionStatus;
  @IsOptional() @IsEnum(DuplicateAction) duplicateAction?: DuplicateAction;
}

export class ConfirmImportDto {
  @IsUUID() examId!: string;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) questionIds?: string[];
}
