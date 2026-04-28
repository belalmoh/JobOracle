import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, map, catchError, throwError } from 'rxjs';

export interface ApiSuccessResponse<T> {
	success: true;
	data: T;
	timestamp: string;
	message?: string;
}

export interface ApiErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: any;
	};
	timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			map((data) => {
				return {
					success: true,
					data,
					timestamp: new Date().toISOString(),
				} as ApiResponse<any>;
			}),
			catchError((error) => {
				const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

				const errorResponse: ApiErrorResponse = {
					success: false,
					error: {
						code: error.name || 'InternalServerError',
						message: error.message || 'Something went wrong',
						details: error instanceof HttpException ? error.getResponse() : undefined,
					},
					timestamp: new Date().toISOString(),
				};

				throw new HttpException(errorResponse, status);
			}),
		);
	}
}
