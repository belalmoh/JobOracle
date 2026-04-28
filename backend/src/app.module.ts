import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResumeModule } from './resume/resume.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseInterceptor } from './common/interceptors/response/response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core/constants';

@Module({
	imports: [
		ResumeModule,
		ConfigModule.forRoot(),
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: 'sqlite',
				database: 'test.sqlite',
				autoLoadEntities: true,
				entities: [__dirname + '/**/*.entity{.ts,.js}'],
				synchronize: true,
				logging: true,
			}),
		}),
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor,
		},
	],
})
export class AppModule {}
