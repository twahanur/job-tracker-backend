import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  async getCareerAnalytics(@CurrentUser('id') userId: string) {
    const analytics = await this.analyticsService.getCareerAnalytics(userId);
    return {
      message: 'Career funnel analytics fetched successfully',
      data: analytics,
    };
  }
}
