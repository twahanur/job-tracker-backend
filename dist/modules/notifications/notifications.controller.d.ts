import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string): Promise<{
        message: string;
        data: {
            message: string;
            id: string;
            createdAt: Date;
            userId: string;
            isRead: boolean;
            title: string;
            jobId: string | null;
            type: import("@prisma/client").$Enums.NotificationType;
            readAt: Date | null;
        }[];
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
}
