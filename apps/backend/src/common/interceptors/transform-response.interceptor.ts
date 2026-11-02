import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@industrial-bakery/shared-types';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // Trường hợp service đã chủ động format { data, meta }
        if (res && typeof res === 'object' && ('data' in res || 'meta' in res)) {
          return {
            success: true,
            data: res.data ?? null,
            error: null,
            meta: res.meta,
          };
        }

        return {
          success: true,
          data: res ?? null,
          error: null,
        };
      }),
    );
  }
}
