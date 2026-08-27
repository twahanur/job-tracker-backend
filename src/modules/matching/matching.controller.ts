import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchJobDto } from './dto/match-job.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('jobs')
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Post(':id/match')
  async evaluateMatch(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
    @Body() dto: MatchJobDto,
  ) {
    const result = await this.matchingService.evaluateMatch(userId, jobId, dto);
    return {
      message: 'Match compatibility evaluation completed via Gemini Flash',
      data: result,
    };
  }

  @Get(':id/matches')
  async getMatchHistory(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    const results = await this.matchingService.getJobMatchResults(userId, jobId);
    return {
      message: 'Match history fetched',
      data: results,
    };
  }
}
