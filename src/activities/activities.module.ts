import { Global, Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service.js';
import { ActivitiesController } from './activities.controller.js';
import { ActivityInterceptor } from './activity.interceptor.js';

@Global()
@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivityInterceptor],
  exports: [ActivitiesService, ActivityInterceptor],
})
export class ActivitiesModule {}
