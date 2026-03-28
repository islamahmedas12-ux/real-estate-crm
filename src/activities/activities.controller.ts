import {
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityEntityType } from '@prisma/client';
import { ActivitiesService } from './activities.service.js';
import { ActivityFilterDto } from './dto/activity-filter.dto.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all activities with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of activities' })
  findAll(@Query() filter: ActivityFilterDto) {
    return this.activitiesService.findAll(filter);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activities for dashboard feed' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent activities (default 20)',
  })
  @ApiResponse({ status: 200, description: 'Recent activities' })
  findRecent(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.activitiesService.findRecent(limit ?? 20);
  }

  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Get activities for a specific entity' })
  @ApiParam({ name: 'type', enum: ActivityEntityType, description: 'Entity type' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Activities for the entity' })
  findByEntity(
    @Param('type', new ParseEnumPipe(ActivityEntityType)) type: ActivityEntityType,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: ActivityFilterDto,
  ) {
    return this.activitiesService.findByEntity(type, id, filter);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activities by a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Activities performed by the user' })
  findByUser(@Param('userId', ParseUUIDPipe) userId: string, @Query() filter: ActivityFilterDto) {
    return this.activitiesService.findByUser(userId, filter);
  }

  @Delete('purge/:days')
  @Roles('admin')
  @ApiOperation({ summary: 'Purge activities older than N days (admin only)' })
  @ApiParam({
    name: 'days',
    type: Number,
    description: 'Delete activities older than this many days',
  })
  @ApiResponse({ status: 200, description: 'Purge result with count of deleted records' })
  purge(@Param('days', ParseIntPipe) days: number) {
    return this.activitiesService.purgeOlderThan(days);
  }
}
