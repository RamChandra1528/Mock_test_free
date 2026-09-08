import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Language } from "@prisma/client";

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsEnum(Language) preferredLanguage?: Language;
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: "Password must include upper, lower, number and special character",
  })
  password!: string;
  @IsString() @MaxLength(72) confirmPassword!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MaxLength(72) password!: string;
}
