import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { resolve } from "path";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { RequestContextMiddleware } from "./common/request-context.middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger("Bootstrap");
  app.setGlobalPrefix("api");
  app.use(new RequestContextMiddleware().use);
  // Uploaded PDFs are displayed by the frontend's in-app iframe. Allow only
  // the configured frontend origin to embed responses from this server.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          frameAncestors: ["'self'", config.get("FRONTEND_URL", "http://localhost:5173")],
        },
      },
      frameguard: false,
    }),
  );
  app.useStaticAssets(resolve(config.get("UPLOAD_DIR", "uploads"), "public"), {
    prefix: "/uploads/",
    // The React app runs on a different local origin in development
    // (localhost:5173 vs localhost:3000). Helmet's default same-origin
    // resource policy otherwise makes browsers block uploaded question images.
    setHeaders: (response) => {
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      // Public uploads are content-addressed UUID filenames, so a replacement
      // receives a new URL. Let browsers reuse images and PDFs between pages.
      response.setHeader(
        "Cache-Control",
        "public, max-age=31536000, immutable",
      );
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
  process.on("unhandledRejection", (reason) =>
    logger.error({ event: "unhandledRejection", reason: describeUnknown(reason) }),
  );
  process.on("uncaughtException", (error) =>
    logger.fatal({ event: "uncaughtException", error: describeUnknown(error) }),
  );
}

void bootstrap();

function describeUnknown(value: unknown) {
  return value instanceof Error ? value.stack ?? value.message : String(value);
}
