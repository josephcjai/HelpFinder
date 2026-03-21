import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './modules/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true
  app.enableCors({ origin: origins, credentials: true })
  app.enableShutdownHooks()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const config = new DocumentBuilder()
    .setTitle('HelpFinder4U API')
    .setDescription('Public API for HelpFinder4U')
    .setVersion('0.1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT ? Number(process.env.PORT) : 4000
  await app.listen(port, '0.0.0.0')
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`)
}

bootstrap()

