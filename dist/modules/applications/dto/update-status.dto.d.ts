import { ApplicationStatus, EmailType, EmailStatus } from '@prisma/client';
export declare class UpdateApplicationStatusDto {
    status: ApplicationStatus;
    notes?: string;
    appliedAt?: string;
}
export declare class UpdateApplicationDetailsDto {
    selectedCvId?: string;
    expectedSalary?: number;
    salaryCurrency?: string;
    portalUrl?: string;
    applicationNotes?: string;
}
export declare class GenerateEmailDto {
    type: EmailType;
    recruiterName?: string;
    recipientEmail?: string;
    tone?: string;
    customInstructions?: string;
    customNotes?: string;
}
export declare class UpdateEmailDraftDto {
    recipientName?: string;
    recipientEmail?: string;
    subject?: string;
    bodyMarkdown?: string;
    status?: EmailStatus;
}
export declare class CreateFollowUpDto {
    scheduledDate: string;
    reminderTitle: string;
    notes?: string;
}
