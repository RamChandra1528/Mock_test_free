import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { resolve } from "path";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.useStaticAssets(resolve(config.get("UPLOAD_DIR", "uploads"), "public"), {
    prefix: "/uploads/",
    // The React app runs on a different local origin in development
    // (localhost:5173 vs localhost:3000). Helmet's default same-origin
    // resource policy otherwise makes browsers block uploaded question images.
    setHeaders: (response) => {
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  });
  app.enableCors({
    origin: config.get("FRONTEND_URL", "http://localhost:5173"),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
  await app.listen(config.get<number>("PORT", 3000));
}

void bootstrap();
