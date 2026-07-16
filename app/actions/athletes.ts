"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppViewer } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { athleteProfileSchema } from "@/lib/validation/athlete";
import { getSupabaseConfig } from "@/lib/env";

export async function saveAthleteProfileAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/athlete");
  }

  const parsed = athleteProfileSchema.safeParse({
    athleteId: formData.get("athleteId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    graduationYear: formData.get("graduationYear"),
    dateOfBirth: formData.get("dateOfBirth"),
    hometown: formData.get("hometown"),
    primaryPosition: formData.get("primaryPosition"),
    secondaryPosition: formData.get("secondaryPosition"),
    height: formData.get("height"),
    weight: formData.get("weight"),
    currentTeam: formData.get("currentTeam"),
    developmentGoals: formData.get("developmentGoals"),
    availableEquipment: formData.get("availableEquipment"),
    restrictionsOrInjuryNotes: formData.get("restrictionsOrInjuryNotes"),
    recruitingNotes: formData.get("recruitingNotes"),
    currentDevelopmentFocus: formData.get("currentDevelopmentFocus"),
    activeStatus: formData.get("activeStatus")
  });

  if (!parsed.success) {
    redirect("/athletes?error=invalid_athlete_profile");
  }

  if (!getSupabaseConfig()) {
    redirect("/athletes?status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const input = parsed.data;

  const payload = {
    managed_by: viewer.id,
    first_name: input.firstName,
    last_name: input.lastName,
    graduation_year: input.graduationYear,
    date_of_birth: input.dateOfBirth,
    hometown: input.hometown,
    primary_position: input.primaryPosition,
    secondary_position: input.secondaryPosition,
    height: input.height,
    weight: input.weight,
    current_team: input.currentTeam,
    development_goals: input.developmentGoals,
    available_equipment: input.availableEquipment,
    restrictions_or_injury_notes: input.restrictionsOrInjuryNotes,
    recruiting_notes: input.recruitingNotes,
    current_development_focus: input.currentDevelopmentFocus,
    active: input.activeStatus === "active"
  };

  if (input.athleteId) {
    const { error } = await supabase.from("athletes").update(payload).eq("id", input.athleteId);

    if (error) {
      redirect(`/athletes/${input.athleteId}/edit?error=save_failed`);
    }

    revalidatePath("/admin");
    revalidatePath("/athletes");
    revalidatePath(`/athletes/${input.athleteId}/edit`);
    redirect(`/athletes/${input.athleteId}/edit?status=saved`);
  }

  const { data, error } = await supabase.from("athletes").insert(payload).select("id").single();

  if (error || !data) {
    redirect("/athletes/new?error=create_failed");
  }

  revalidatePath("/admin");
  revalidatePath("/athletes");
  redirect(`/athletes/${data.id}/edit?status=created`);
}
