import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { CurrentUser, Public, AuthUser } from "./auth.decorators";
import { LoginDto, RegisterDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto);
    this.setSessionCookie(response, result.token);
    return { user: result.user, dailyReward: result.dailyReward };
  }
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto);
    this.setSessionCookie(response, result.token);
    return { user: result.user, dailyReward: result.dailyReward };
  }
  @Post("logout") logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("mockmaster_access", this.cookieOptions());
    return { success: true };
  }
  @Get("me") me(@CurrentUser() user: AuthUser) {
    return user;
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie("mockmaster_access", token, {
      ...this.cookieOptions(),
      maxAge: this.sessionMilliseconds(),
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get("COOKIE_SECURE", "false") === "true",
      sameSite: "lax" as const,
      path: "/",
    };
  }

  private sessionMilliseconds() {
    const value = this.config.get("JWT_EXPIRES_IN", "8h");
    const match = /^(\d+)([mhd])$/.exec(value);
    if (!match) return 8 * 60 * 60 * 1000;
    const unit =
      match[2] === "m" ? 60_000 : match[2] === "d" ? 86_400_000 : 3_600_000;
    return Number(match[1]) * unit;
  }
}
