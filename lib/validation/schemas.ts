import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const profileSchema = z.object({
  fullName: z.string().trim().nullable(),
  currentRole: z.string().trim().nullable(),
  yearsExperience: z.number().int().min(0).nullable(),
  location: z.string().trim().nullable(),
  preferredLocations: z.array(z.string()),
  workPreference: z.enum(["remote", "hybrid", "onsite", "flexible"]).nullable(),
  workAuthorization: z.string().trim().nullable(),
  salaryExpectationMin: z.number().int().min(0).nullable(),
  salaryExpectationMax: z.number().int().min(0).nullable(),
  salaryCurrency: z.string().trim().nullable(),
  targetRoles: z.array(z.string()),
  targetSeniority: z.string().trim().nullable(),
  preferredIndustries: z.array(z.string()),
  preferredCompanyTypes: z.array(z.string()),
  preferredCompanySizes: z.array(z.string()),
  avoidRolesIndustries: z.string().trim().nullable(),
  portfolioUrl: z.string().trim().nullable(),
  portfolioCaseStudies: z.array(z.object({ label: z.string(), url: z.string() })),
  linkedinUrl: z.string().trim().nullable(),
  skills: z.array(z.string()),
  experienceSummary: z.string().trim().nullable(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const opportunitySchema = z.object({
  company: z.string().trim().min(1, "Company is required."),
  title: z.string().trim().min(1, "Job title is required."),
  location: z.string().trim().nullable(),
  remoteStatus: z.enum(["remote", "hybrid", "onsite", "unknown"]),
  salaryMin: z.number().int().min(0).nullable(),
  salaryMax: z.number().int().min(0).nullable(),
  salaryCurrency: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  experienceRequirements: z.string().trim().nullable(),
  jobUrl: z.string().trim().nullable(),
  applicationUrl: z.string().trim().nullable(),
  source: z.enum([
    "linkedin",
    "company_website",
    "referral",
    "indeed",
    "recruiter",
    "other",
  ]),
});
export type OpportunityInput = z.infer<typeof opportunitySchema>;
