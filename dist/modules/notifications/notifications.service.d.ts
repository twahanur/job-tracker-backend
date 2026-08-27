import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleDailyRemindersCron(): Promise<void>;
    getUserNotifications(userId: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        isRead: boolean;
        title: string;
        jobId: string | null;
        type: import("@prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }[]>;
    markAsRead(userId: string, notificationId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
