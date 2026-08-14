import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, cvs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { CvManager } from "./cv-manager";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, userCvs] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
    db.query.cvs.findMany({
      where: eq(cvs.userId, user.id),
      orderBy: (cvs, { desc }) => [desc(cvs.createdAt)],
    }),
  ]);

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Career context used by the AI to evaluate jobs and generate application materials.
        </p>
      </div>

      <CvManager
        cvs={userCvs.map((cv) => ({
          id: cv.id,
          name: cv.name,
          fileName: cv.fileName,
          isDefault: cv.isDefault,
        }))}
      />

      <ProfileForm
        key={profile.updatedAt.toISOString()}
        profile={{
          fullName: profile.fullName,
          currentRole: profile.currentRole,
          yearsExperience: profile.yearsExperience,
          location: profile.location,
          preferredLocations: profile.preferredLocations ?? [],
          workPreference: profile.workPreference,
          workAuthorization: profile.workAuthorization,
          salaryExpectationMin: profile.salaryExpectationMin,
          salaryExpectationMax: profile.salaryExpectationMax,
          salaryCurrency: profile.salaryCurrency,
          targetRoles: profile.targetRoles ?? [],
          targetSeniority: profile.targetSeniority,
          preferredIndustries: profile.preferredIndustries ?? [],
          preferredCompanyTypes: profile.preferredCompanyTypes ?? [],
          preferredCompanySizes: profile.preferredCompanySizes ?? [],
          avoidRolesIndustries: profile.avoidRolesIndustries,
          portfolioUrl: profile.portfolioUrl,
          portfolioCaseStudies: profile.portfolioCaseStudies ?? [],
          linkedinUrl: profile.linkedinUrl,
          skills: profile.skills ?? [],
          experienceSummary: profile.experienceSummary,
        }}
      />
    </div>
  );
}
