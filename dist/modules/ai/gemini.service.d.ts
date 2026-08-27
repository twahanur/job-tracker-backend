import { ConfigService } from '@nestjs/config';
export interface ExtractedJobData {
    title: string;
    companyName: string;
    location?: string;
    country?: string;
    workMode: 'REMOTE' | 'HYBRID' | 'ON_SITE';
    jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
    experienceRequired?: string;
    minSalary?: number;
    maxSalary?: number;
    salaryCurrency: string;
    salaryPeriod: 'YEARLY' | 'MONTHLY' | 'HOURLY';
    description: string;
    responsibilities: string[];
    requirements: string[];
    requiredSkills: string[];
    preferredSkills: string[];
    benefits: string[];
    deadline?: string;
    recruiterName?: string;
    recruiterEmail?: string;
}
export interface ExtractedCvData {
    fullName: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    primarySkills: string[];
    secondarySkills?: string[];
    toolsAndFrameworks: string[];
    totalYearsOfExperience?: number;
    experience: Array<{
        company: string;
        role: string;
        startDate?: string;
        endDate?: string;
        isCurrent?: boolean;
        description?: string;
        highlights?: string[];
        technologies?: string[];
    }>;
    education: Array<{
        institution: string;
        degree: string;
        fieldOfStudy?: string;
        graduationYear?: string;
    }>;
    certifications: string[];
    languages: string[];
    portfolioUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
}
export interface MatchAnalysisData {
    overallScore: number;
    recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'MODERATE_MATCH' | 'LOW_MATCH';
    breakdown: {
        skillsScore: number;
        experienceScore: number;
        educationScore: number;
        locationScore: number;
        salaryScore: number;
    };
    matchedSkills: string[];
    missingSkills: string[];
    partialSkills: string[];
    strengths: string[];
    gaps: string[];
    actionableTips: string[];
    explanation: string;
}
export declare class GeminiService {
    private configService;
    private readonly logger;
    private genAI;
    private readonly defaultModel;
    private readonly fallbackModels;
    constructor(configService: ConfigService);
    private generateWithFallback;
    parseCvDocument(rawText: string): Promise<ExtractedCvData>;
    extractJobDetails(rawText: string): Promise<ExtractedJobData>;
    evaluateJobMatch(structuredCv: ExtractedCvData, structuredJob: ExtractedJobData): Promise<MatchAnalysisData>;
    generateEmailDraft(params: {
        type: 'COLD_APPLICATION' | 'FOLLOW_UP_1' | 'FOLLOW_UP_2' | 'THANK_YOU_POST_INTERVIEW' | 'OFFER_NEGOTIATION' | 'WITHDRAWAL' | string;
        job: ExtractedJobData;
        cv: ExtractedCvData;
        recruiterName?: string;
        tone?: 'PROFESSIONAL' | 'CONFIDENT_IMPACT' | 'CASUAL_FRIENDLY' | 'SHORT_PUNCHY' | 'TECHNICAL_DEEP' | 'ENTHUSIASTIC' | string;
        customInstructions?: string;
        customNotes?: string;
    }): Promise<{
        subject: string;
        bodyMarkdown: string;
    }>;
    cleanEmailText(text: string): string;
    private cleanJsonText;
    private getMockCvData;
    private getMockJobData;
    private getMockMatchData;
}
