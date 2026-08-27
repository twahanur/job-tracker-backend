export declare class ExtractJobDto {
    rawText?: string;
    url?: string;
}
export declare class FilterJobsDto {
    search?: string;
    status?: string;
    recommendation?: string;
    workMode?: string;
    jobType?: string;
    minSalary?: number;
    maxSalary?: number;
    minMatchScore?: number;
    tab?: 'all' | 'high-match' | 'applied' | 'interviews' | 'expiring' | 'archived';
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'deadline' | 'matchScore' | 'salary';
    sortOrder?: 'asc' | 'desc';
}
