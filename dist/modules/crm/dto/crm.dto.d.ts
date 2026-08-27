export declare class CreateCompanyDto {
    name: string;
    websiteUrl?: string;
    domain?: string;
    logoUrl?: string;
    industry?: string;
    companySize?: string;
    headquarters?: string;
    notes?: string;
}
export declare class UpdateCompanyDto {
    name?: string;
    websiteUrl?: string;
    domain?: string;
    logoUrl?: string;
    industry?: string;
    companySize?: string;
    headquarters?: string;
    notes?: string;
}
export declare class CreateRecruiterDto {
    companyId?: string;
    name: string;
    roleTitle?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    notes?: string;
}
export declare class UpdateRecruiterDto {
    companyId?: string;
    name?: string;
    roleTitle?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    notes?: string;
}
