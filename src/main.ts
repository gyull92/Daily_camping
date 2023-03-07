import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { SocketIoAdapter } from './adapters/socket-io.adapters';
import { AppModule } from './app.module';
import { join } from 'path';
import * as ejs from 'ejs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, '..', 'src', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'src', 'views'));
  app.setViewEngine('ejs');
  app.engine('ejs', ejs.renderFile);

  await app.listen(3000);
}
bootstrap();
