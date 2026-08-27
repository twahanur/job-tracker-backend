"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookieParser = require("cookie-parser");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = parseInt(process.env.PORT || '5000', 10);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    app.use((0, helmet_1.default)());
    app.use(cookieParser());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const allowedOrigins = [
                frontendUrl,
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ];
            const isAllowed = allowedOrigins.includes(origin) ||
                origin.endsWith('.pages.dev') ||
                origin.endsWith('.workers.dev') ||
                origin.includes('localhost');
            if (isAllowed || process.env.NODE_ENV !== 'production') {
                callback(null, true);
            }
            else {
                callback(null, true);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Job Recruitment Tracking Platform API')
        .setDescription('Production REST API with Google Gemini Flash AI Engine and PostgreSQL')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Application is running on: http://0.0.0.0:${port}/api`);
    logger.log(`📚 Swagger documentation available at: http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map