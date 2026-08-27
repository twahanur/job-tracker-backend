import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((resData) => {
        // If data is already in custom format, return directly
        if (resData && typeof resData === 'object' && 'success' in resData && 'data' in resData) {
          return resData;
        }

        const message = resData?.message || 'Success';
        const data = resData?.data !== undefined ? resData.data : resData;

        return {
          success: true,
          statusCode,
          message,
          data,
        };
      }),
    );
  }
}
