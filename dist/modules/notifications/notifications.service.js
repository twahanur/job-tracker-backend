"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleDailyRemindersCron() {
        this.logger.log('Running daily automation cron for follow-ups and deadlines...');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const fortyEightHoursLater = new Date();
        fortyEightHoursLater.setDate(fortyEightHoursLater.getDate() + 2);
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
                    type: client_1.NotificationType.FOLLOW_UP_DUE,
                    title: `Follow-Up Due: ${f.reminderTitle}`,
                    message: `Scheduled follow-up reminder for ${jobTitle} at ${companyName}.`,
                },
            });
        }
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
                    type: client_1.NotificationType.DEADLINE_APPROACHING,
                    title: `Application Deadline Approaching`,
                    message: `Deadline for ${j.title} at ${j.company?.name || 'Company'} is within 48 hours.`,
                },
            });
        }
        this.logger.log(`Created ${dueFollowUps.length} follow-up notifications and ${expiringJobs.length} deadline alerts.`);
    }
    async getUserNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async markAsRead(userId, notificationId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleDailyRemindersCron", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map