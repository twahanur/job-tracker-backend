import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(
    @CurrentUser('id') userId: string,
    @Query('timeframe') timeframe?: string,
    @Query('stage') stage?: string,
    @Query('domain') domain?: string,
    @Query('chartMode') chartMode?: string,
  ) {
    const stats = await this.dashboardService.getDashboardStats(userId, {
      timeframe,
      stage,
      domain,
      chartMode,
    });
    return {
      message: 'Dashboard intelligence statistics fetched successfully',
      data: stats,
    };
  }

  @Patch('reminders/:id/complete')
  async completeReminder(
    @CurrentUser('id') userId: string,
    @Param('id') reminderId: string,
  ) {
    const result = await this.dashboardService.completeFollowUp(userId, reminderId);
    return {
      message: 'Follow-up reminder completed successfully',
      data: result,
    };
  }
}

