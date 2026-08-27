import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Daily automation scheduled job at 9:00 AM to check pending follow-ups and deadlines
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyRemindersCron() {
    this.logger.log('Running daily automation cron for follow-ups and deadlines...');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const fortyEightHoursLater = new Date();
    fortyEightHoursLater.setDate(fortyEightHoursLater.getDate() + 2);

    // 1. Find follow-ups due today
    const dueFollowUps = await this.prisma.followUpSchedule.findMany({
      where: {
        scheduledDate: { gte: todayStart, lte: todayEnd },
        isCompleted: false,
      },
      include: {
        application: {
          include: {
            job: { select: { userId: true, title: true, company: { select: { name: true } } } },
          },
        },
      },
    });

    for (const f of dueFollowUps) {
      const userId = f.application.job.userId;
      const jobId = f.application.jobId;
      const jobTitle = f.application.job.title;
      const companyName = f.application.job.company?.name || 'Company';

      await this.prisma.notification.create({
        data: {
          userId,
          jobId,
          type: NotificationType.FOLLOW_UP_DUE,
          title: `Follow-Up Due: ${f.reminderTitle}`,
          message: `Scheduled follow-up reminder for ${jobTitle} at ${companyName}.`,
        },
      });
    }

    // 2. Find jobs with application deadlines in next 48h
    const expiringJobs = await this.prisma.job.findMany({
      where: {
        isArchived: false,
        deadline: { gte: new Date(), lte: fortyEightHoursLater },
        application: { status: 'SAVED' },
      },
      include: {
        company: { select: { name: true } },
      },
    });

    for (const j of expiringJobs) {
      await this.prisma.notification.create({
        data: {
          userId: j.userId,
          jobId: j.id,
          type: NotificationType.DEADLINE_APPROACHING,
          title: `Application Deadline Approaching`,
          message: `Deadline for ${j.title} at ${j.company?.name || 'Company'} is within 48 hours.`,
        },
      });
    }

    this.logger.log(`Created ${dueFollowUps.length} follow-up notifications and ${expiringJobs.length} deadline alerts.`);
  }

  /**
   * Fetch all notifications for the current user
   */
  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
