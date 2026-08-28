import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  overallScore: number; // 0 - 100
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

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly defaultModel: string;
  private readonly fallbackModels: string[];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.defaultModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.6-flash';

    const configuredFallbacks = this.configService.get<string>('GEMINI_FALLBACK_MODELS');
    this.fallbackModels = configuredFallbacks
      ? configuredFallbacks.split(',').map((m) => m.trim()).filter(Boolean)
      : [
          'gemini-3.6-flash',
          'gemini-3.5-flash',
          'gemini-flash-latest',
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
          'gemini-flash-lite-latest',
        ];

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      const chain = Array.from(new Set([this.defaultModel, ...this.fallbackModels]));
      this.logger.log(`🤖 Gemini AI initialized with model cascade: ${chain.join(' ➔ ')}`);
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY is not set. Mock/fallback AI mode will be active until key is provided.');
    }
  }

  /**
   * Cascading Fallback AI Generation Engine
   * Tries the primary high-priority model first. If quota/rate limit (429) or model error occurs,
   * it automatically cascades down to the next model in the fallback chain.
   */
  private async generateWithFallback(options: {
    prompt: string;
    temperature?: number;
    responseMimeType?: string;
    actionName?: string;
  }): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini AI is not initialized (missing GEMINI_API_KEY)');
    }

    const modelsToTry = Array.from(
      new Set([this.defaultModel, ...this.fallbackModels].filter(Boolean)),
    );

    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      try {
        if (i === 0) {
          this.logger.log(
            `🚀 [${options.actionName || 'AI'}] Calling primary model: "${modelName}"...`,
          );
        } else {
          this.logger.log(
            `🔄 [${options.actionName || 'AI'}] Cascading to fallback model (${i + 1}/${modelsToTry.length}): "${modelName}"...`,
          );
        }

        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            responseMimeType: options.responseMimeType || 'application/json',
          },
        });

        const result = await model.generateContent(options.prompt);
        const text = result.response.text();

        if (text && text.trim().length > 0) {
          if (i > 0) {
            this.logger.log(
              `✅ [${options.actionName || 'AI'}] Successfully recovered and generated content using fallback model "${modelName}"!`,
            );
          }
          return text;
        }

        throw new Error(`Empty response returned from model "${modelName}"`);
      } catch (err: any) {
        lastError = err;
        const isQuota =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('Quota') ||
          err?.message?.includes('quota');
        const isNotFound =
          err?.status === 404 ||
          err?.message?.includes('not found') ||
          err?.message?.includes('404');
        const reason = isQuota
          ? 'Quota/Rate Limit Exceeded (429)'
          : isNotFound
          ? 'Model Not Found (404)'
          : err?.message || 'Error';

        this.logger.warn(
          `⚠️ [${options.actionName || 'AI'}] Model "${modelName}" failed: [${reason}]. ${
            i < modelsToTry.length - 1
              ? `Cascading down to "${modelsToTry[i + 1]}"...`
              : 'All fallback models exhausted.'
          }`,
        );
      }
    }

    throw lastError || new Error('All models in Gemini fallback chain failed');
  }

  /**
   * Parse uploaded CV raw text into structured JSON
   */
  async parseCvDocument(rawText: string): Promise<ExtractedCvData> {
    if (!this.genAI) {
      return this.getMockCvData(rawText);
    }

    const prompt = `
You are an expert HR AI Resume Parser. Extract all candidate information from the following CV text into strict JSON format.
Do NOT output any markdown ticks like \`\`\`json or explanation. Output ONLY the raw valid JSON object.

JSON Schema:
{
  "fullName": "string (Candidate full name)",
  "headline": "string (e.g. Senior Fullstack Developer)",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string (Professional summary)",
  "primarySkills": ["string (Core programming languages, main stacks)"],
  "secondarySkills": ["string"],
  "toolsAndFrameworks": ["string (Databases, frameworks, tools, cloud)"],
  "totalYearsOfExperience": number,
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "isCurrent": boolean,
      "description": "string",
      "highlights": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "graduationYear": "string"
    }
  ],
  "certifications": ["string"],
  "languages": ["string"],
  "portfolioUrl": "string",
  "linkedinUrl": "string",
  "githubUrl": "string"
}

CV RAW TEXT:
${rawText}
`;

    try {
      const text = await this.generateWithFallback({
        prompt,
        temperature: 0.1,
        responseMimeType: 'application/json',
        actionName: 'CV Parse',
      });
      return JSON.parse(this.cleanJsonText(text)) as ExtractedCvData;
    } catch (error) {
      this.logger.error('Gemini CV parse error (all fallbacks exhausted)', error);
      return this.getMockCvData(rawText);
    }
  }

  /**
   * Parse Job posting text or scraped HTML into structured JSON
   */
  async extractJobDetails(rawText: string): Promise<ExtractedJobData> {
    if (!this.genAI) {
      return this.getMockJobData(rawText);
    }

    const prompt = `
You are an expert Technical Job Post Analyzer. Extract structured job posting details from the raw job text into strict JSON format.
Do NOT output any markdown ticks or explanation. Output ONLY the raw valid JSON object.

JSON Schema:
{
  "title": "string (Exact Job Title)",
  "companyName": "string (Company / Organization Name)",
  "location": "string (City, State or Region)",
  "country": "string",
  "workMode": "REMOTE" | "HYBRID" | "ON_SITE",
  "jobType": "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE",
  "experienceRequired": "string (e.g. 3+ years)",
  "minSalary": number or null,
  "maxSalary": number or null,
  "salaryCurrency": "USD" (or EUR, GBP, BDT, etc),
  "salaryPeriod": "YEARLY" | "MONTHLY" | "HOURLY",
  "description": "string (Clean comprehensive overview of the role)",
  "responsibilities": ["string"],
  "requirements": ["string"],
  "requiredSkills": ["string (Must-have tech stack & tools)"],
  "preferredSkills": ["string (Nice-to-have skills)"],
  "benefits": ["string (Perks, health, equipment, etc)"],
  "deadline": "YYYY-MM-DD" or null,
  "recruiterName": "string or null",
  "recruiterEmail": "string or null"
}

RAW JOB TEXT:
${rawText}
`;

    try {
      const text = await this.generateWithFallback({
        prompt,
        temperature: 0.1,
        responseMimeType: 'application/json',
        actionName: 'Job Details Extraction',
      });
      return JSON.parse(this.cleanJsonText(text)) as ExtractedJobData;
    } catch (error) {
      this.logger.error('Gemini Job extraction error (all fallbacks exhausted)', error);
      return this.getMockJobData(rawText);
    }
  }

  /**
   * Multi-dimensional CV vs Job Match Evaluation
   */
  async evaluateJobMatch(
    structuredCv: ExtractedCvData,
    structuredJob: ExtractedJobData,
  ): Promise<MatchAnalysisData> {
    if (!this.genAI) {
      return this.getMockMatchData(structuredCv, structuredJob);
    }

    const prompt = `
You are a Lead Hiring Architect and Technical Recruiter. Evaluate the compatibility of this candidate's CV against the target Job posting.
Calculate a mathematically grounded match score (0 to 100) using this weight distribution:
- Skills & Tech Stack: 40%
- Experience & Seniority: 25%
- Education & Certs: 10%
- Location & Work Mode: 15%
- Salary Compatibility: 10%

Output ONLY a valid JSON object matching the schema below:

{
  "overallScore": number (0 to 100),
  "recommendation": "HIGHLY_RECOMMENDED" (85+) | "RECOMMENDED" (70-84) | "MODERATE_MATCH" (50-69) | "LOW_MATCH" (<50),
  "breakdown": {
    "skillsScore": number (0-100),
    "experienceScore": number (0-100),
    "educationScore": number (0-100),
    "locationScore": number (0-100),
    "salaryScore": number (0-100)
  },
  "matchedSkills": ["string (Skills candidate has that job requires)"],
  "missingSkills": ["string (Important skills required by job that candidate lacks)"],
  "partialSkills": ["string (Adjacent skills, e.g. React for Vue or MySQL for Postgres)"],
  "strengths": ["string (Key candidate strengths that align perfectly)"],
  "gaps": ["string (Notable gaps or areas where candidate falls short)"],
  "actionableTips": ["string (Specific suggestions to tailor CV or prep for interview)"],
  "explanation": "string (Clear 2-3 paragraph objective executive summary of the evaluation)"
}

CANDIDATE CV DATA:
${JSON.stringify(structuredCv, null, 2)}

TARGET JOB DATA:
${JSON.stringify(structuredJob, null, 2)}
`;

    try {
      const text = await this.generateWithFallback({
        prompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        actionName: 'Match Evaluation',
      });
      return JSON.parse(this.cleanJsonText(text)) as MatchAnalysisData;
    } catch (error) {
      this.logger.error('Gemini Match evaluation error (all fallbacks exhausted)', error);
      return this.getMockMatchData(structuredCv, structuredJob);
    }
  }

  /**
   * AI Cold Application and Follow-up Email Generator with Tone & Custom Prompts
   */
  async generateEmailDraft(params: {
    type: 'COLD_APPLICATION' | 'FOLLOW_UP_1' | 'FOLLOW_UP_2' | 'THANK_YOU_POST_INTERVIEW' | 'OFFER_NEGOTIATION' | 'WITHDRAWAL' | string;
    job: ExtractedJobData;
    cv: ExtractedCvData;
    recruiterName?: string;
    tone?: 'PROFESSIONAL' | 'CONFIDENT_IMPACT' | 'CASUAL_FRIENDLY' | 'SHORT_PUNCHY' | 'TECHNICAL_DEEP' | 'ENTHUSIASTIC' | string;
    customInstructions?: string;
    customNotes?: string;
  }): Promise<{ subject: string; bodyMarkdown: string }> {
    if (!this.genAI) {
      return {
        subject: `Application for ${params.job.title} - ${params.cv.fullName}`,
        bodyMarkdown: `Dear ${params.recruiterName || 'Hiring Team'},\n\nI am writing to express my strong interest in the ${params.job.title} role at ${params.job.companyName}.\n\nWith my background in ${params.cv.primarySkills.slice(0, 4).join(', ')}, I am confident in my ability to deliver immediate value.\n\nBest regards,\n${params.cv.fullName}\n${params.cv.email || ''}`,
      };
    }

    const toneGuide = {
      PROFESSIONAL: 'Professional, courteous, well-structured corporate tone.',
      CONFIDENT_IMPACT: 'Assertive, bold, highly confident, metrics-oriented, highlighting high value proposition.',
      CASUAL_FRIENDLY: 'Conversational, warm, modern startup tone, friendly and engaging while professional.',
      SHORT_PUNCHY: 'Ultra-concise (under 120 words). 2-3 brief punchy paragraphs, optimized for quick mobile reading.',
      TECHNICAL_DEEP: 'Deeply technical, emphasizing architecture, scalability, algorithms, and specific stack nuances.',
      ENTHUSIASTIC: 'High energy, genuinely passionate about the company mission, product impact, and problem domain.',
    }[params.tone || 'PROFESSIONAL'] || params.tone || 'Professional, confident, and direct.';

    const prompt = `
You are an expert Career Outreach Specialist and Executive Ghostwriter. Write a compelling, authentic, natural, and human-sounding email for this job application.
Type: ${params.type}
Selected Tone / Mood: ${toneGuide}

CRITICAL FORMATTING INSTRUCTIONS (STRICT):
- DO NOT use markdown bolding (NEVER use **word** or __word__).
- DO NOT use markdown link formatting (NEVER use [Label](url) or [Email](mailto:url)). Write emails and URLs directly (e.g. twahanur.rahman@gmail.com | linkedin.com/in/username | github.com/username).
- DO NOT use markdown headers (# or ##).
- DO NOT include robotic AI placeholders or AI-sounding commentary.
- Use natural paragraphs with clean line breaks. For bullet points, use clean dots (• ) or dashes (- ).
- Tailor specifically to the company (${params.job.companyName}) and role (${params.job.title}).
- Highlight 2-3 genuine achievements matching the candidate's actual CV (${params.cv.fullName}).
- Keep tone matching the selected mood: "${toneGuide}".

${
  params.customInstructions || params.customNotes
    ? `USER'S SPECIAL INSTRUCTIONS (HIGHEST PRIORITY):
"${params.customInstructions || params.customNotes}"
Note: The user may provide instructions in English, Bengali, or Banglish (Bengali written with English letters). You MUST fully understand their intent and explicitly integrate these points into the email in fluent, professional English.`
    : ''
}

JSON Schema:
{
  "subject": "string (Compelling subject line matching the requested tone without quotes or markdown)",
  "bodyMarkdown": "string (Natural, clean email text ready to send via Gmail/Outlook without any ** or [] markdown artifacts)"
}

JOB DETAILS:
${JSON.stringify(params.job)}

CANDIDATE PROFILE:
${JSON.stringify(params.cv)}

RECRUITER / CONTACT:
${params.recruiterName || 'Hiring Team'}
`;

    try {
      const text = await this.generateWithFallback({
        prompt,
        temperature: 0.3,
        responseMimeType: 'application/json',
        actionName: 'Email Generation',
      });
      const parsed = JSON.parse(this.cleanJsonText(text));
      return {
        subject: this.cleanEmailText(parsed.subject || `Application for ${params.job.title} - ${params.cv.fullName}`),
        bodyMarkdown: this.cleanEmailText(parsed.bodyMarkdown || ''),
      };
    } catch (error) {
      this.logger.error('Gemini Email generation error (all fallbacks exhausted)', error);
      return {
        subject: `Application for ${params.job.title} - ${params.cv.fullName}`,
        bodyMarkdown: this.cleanEmailText(
          `Dear ${params.recruiterName || 'Hiring Team'},\n\nI am writing to express my strong interest in the ${params.job.title} role at ${params.job.companyName}.\n\nWith my experience in ${params.cv.primarySkills.slice(0, 4).join(', ')}, I am confident in my ability to deliver immediate value.\n\nBest regards,\n${params.cv.fullName}\n${params.cv.email || ''}`,
        ),
      };
    }
  }

  public cleanEmailText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\[Email\]\(mailto:(.*?)\)/gi, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, (_match, label, url) => {
        if (url.startsWith('mailto:')) return url.replace('mailto:', '');
        return `${label}: ${url}`;
      })
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/^\s*\*\s+/gm, '• ')
      .trim();
  }

  private cleanJsonText(raw: string): string {
    return raw.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  private getMockCvData(rawText: string): ExtractedCvData {
    return {
      fullName: 'Twahanur Rahman',
      headline: 'Senior Fullstack Software Engineer',
      email: 'twahanur@example.com',
      summary: 'Experienced Fullstack Engineer specializing in NestJS, Next.js, PostgreSQL, and scalable distributed systems.',
      primarySkills: ['TypeScript', 'NestJS', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'],
      toolsAndFrameworks: ['Prisma', 'TailwindCSS', 'BullMQ', 'Git', 'Linux'],
      totalYearsOfExperience: 5,
      experience: [
        {
          company: 'Tech Solutions Inc',
          role: 'Senior Fullstack Engineer',
          startDate: '2022',
          endDate: 'Present',
          isCurrent: true,
          description: 'Architected high-throughput microservices and reactive frontend apps.',
          highlights: ['Improved API response time by 45%', 'Built AI matching engine'],
          technologies: ['NestJS', 'Next.js', 'PostgreSQL', 'Redis'],
        },
      ],
      education: [
        {
          institution: 'State University',
          degree: 'B.Sc. in Computer Science',
          fieldOfStudy: 'Computer Science and Engineering',
          graduationYear: '2021',
        },
      ],
      certifications: ['AWS Certified Solutions Architect'],
      languages: ['English', 'Bengali'],
    };
  }

  private getMockJobData(rawText: string): ExtractedJobData {
    return {
      title: 'Senior Fullstack Developer',
      companyName: 'Acme Corp',
      location: 'Remote, US',
      country: 'United States',
      workMode: 'REMOTE',
      jobType: 'FULL_TIME',
      experienceRequired: '4+ years',
      minSalary: 120000,
      maxSalary: 150000,
      salaryCurrency: 'USD',
      salaryPeriod: 'YEARLY',
      description: 'We are looking for a Senior Fullstack Developer proficient in NestJS, Next.js, and PostgreSQL to lead our core products.',
      responsibilities: [
        'Design and build high-performance REST and GraphQL APIs',
        'Implement responsive Next.js frontend interfaces',
        'Collaborate with product and engineering leaders',
      ],
      requirements: [
        '4+ years production experience with Node.js/TypeScript',
        'Strong expertise in NestJS, PostgreSQL, and Next.js',
        'Experience with Redis caching and asynchronous queues',
      ],
      requiredSkills: ['TypeScript', 'NestJS', 'Next.js', 'PostgreSQL'],
      preferredSkills: ['Redis', 'BullMQ', 'Docker', 'AWS'],
      benefits: ['Health, Dental, Vision', 'Remote First Stipend', '401k Matching'],
      deadline: '2026-09-30',
    };
  }

  private getMockMatchData(cv: ExtractedCvData, job: ExtractedJobData): MatchAnalysisData {
    return {
      overallScore: 92,
      recommendation: 'HIGHLY_RECOMMENDED',
      breakdown: {
        skillsScore: 95,
        experienceScore: 90,
        educationScore: 90,
        locationScore: 100,
        salaryScore: 85,
      },
      matchedSkills: ['TypeScript', 'NestJS', 'Next.js', 'PostgreSQL', 'Redis'],
      missingSkills: [],
      partialSkills: ['AWS (Candidate has GCP/Docker background)'],
      strengths: [
        'Deep production mastery of the exact core stack (NestJS + Next.js + PostgreSQL)',
        'Extensive experience building scalable backend microservices and modern web UIs',
      ],
      gaps: ['Slightly lower years in AWS cloud infrastructure relative to senior role'],
      actionableTips: [
        'Highlight containerization and cloud orchestration projects in the summary section',
        'Mention recent experience with AI integrations and queue processing architectures',
      ],
      explanation:
        'The candidate demonstrates an outstanding 92% alignment with the Senior Fullstack Developer role. Their technical stack matches all primary requirements with solid experience in TypeScript, NestJS, and Next.js.',
    };
  }
}
