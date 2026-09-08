import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { Language, Role } from "@prisma/client";
import { LoginDto, RegisterDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword)
      throw new BadRequestException("Passwords do not match");
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new BadRequestException(
        "An account with this email already exists",
      );
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        preferredLanguage: dto.preferredLanguage,
        role: { connect: { code: Role.STUDENT } },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        preferredLanguage: true,
        role: { select: { code: true } },
      },
    });
    return this.issue({ ...user, role: user.role.code });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { role: true },
    });
    if (
      !user ||
      user.status !== "ACTIVE" ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issue({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.code,
      preferredLanguage: user.preferredLanguage,
    });
  }

  private async issue(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    preferredLanguage: Language;
  }) {
    return {
      token: await this.jwt.signAsync({ sub: user.id, role: user.role }),
      user,
    };
  }
}
