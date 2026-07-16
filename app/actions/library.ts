"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppViewer } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { getWorkoutTemplateByIdForViewer } from "@/lib/data/library";
import { duplicateTemplate } from "@/lib/workouts/mutations";
import { exerciseLibrarySchema, workoutTemplateSchema } from "@/lib/validation/library";

function redirectToLibrary(path: string, search: string): never {
  redirect(`${path}?${search}`);
}

export async function seedStarterLibraryAction() {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  if (!getSupabaseConfig()) {
    redirectToLibrary("/library/exercises", "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("seed_baseball_starter_data", {
    target_owner_user_id: viewer.id
  });

  if (error) {
    redirectToLibrary("/library/exercises", "error=seed_failed");
  }

  revalidatePath("/library/exercises");
  revalidatePath("/library/templates");
  redirectToLibrary("/library/exercises", "status=seeded");
}

export async function saveExerciseLibraryAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  const parsed = exerciseLibrarySchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    coachingCues: formData.get("coachingCues"),
    defaultUnitType: formData.get("defaultUnitType"),
    equipment: formData.get("equipment"),
    videoUrl: formData.get("videoUrl"),
    active: formData.get("active") ?? "true"
  });

  if (!parsed.success) {
    redirectToLibrary("/library/exercises", "error=invalid_exercise");
  }

  if (!getSupabaseConfig()) {
    redirectToLibrary("/library/exercises", "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const data = parsed.data;
  const insertPayload = {
    owner_user_id: viewer.id,
    name: data.name,
    category: data.category,
    description: data.description,
    coaching_cues: data.coachingCues,
    default_unit_type: data.defaultUnitType,
    equipment: data.equipment,
    video_url: data.videoUrl,
    active: data.active
  };

  if (data.exerciseId) {
    const { error } = await supabase
      .from("exercise_library")
      .update({
        name: data.name,
        category: data.category,
        description: data.description,
        coaching_cues: data.coachingCues,
        default_unit_type: data.defaultUnitType,
        equipment: data.equipment,
        video_url: data.videoUrl,
        active: data.active
      })
      .eq("id", data.exerciseId)
      .eq("owner_user_id", viewer.id);

    if (error) {
      redirectToLibrary("/library/exercises", "error=save_failed");
    }
  } else {
    const { error } = await supabase.from("exercise_library").insert(insertPayload);

    if (error) {
      redirectToLibrary("/library/exercises", "error=create_failed");
    }
  }

  revalidatePath("/library/exercises");
  redirectToLibrary("/library/exercises", "status=saved");
}

export async function toggleExerciseActiveAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  const exerciseId = String(formData.get("exerciseId") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "false") === "true";

  if (!getSupabaseConfig()) {
    redirectToLibrary("/library/exercises", "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("exercise_library")
    .update({ active: nextActive })
    .eq("id", exerciseId)
    .eq("owner_user_id", viewer.id);

  if (error) {
    redirectToLibrary("/library/exercises", "error=toggle_failed");
  }

  revalidatePath("/library/exercises");
  redirectToLibrary("/library/exercises", "status=updated");
}

export async function saveWorkoutTemplateAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  const parsed = workoutTemplateSchema.safeParse({
    templateId: formData.get("templateId"),
    name: formData.get("name"),
    description: formData.get("description"),
    estimatedDurationMinutes: formData.get("estimatedDurationMinutes"),
    focus: formData.get("focus"),
    active: formData.get("active") ?? "true"
  });

  if (!parsed.success) {
    redirectToLibrary("/library/templates", "error=invalid_template");
  }

  if (!getSupabaseConfig()) {
    redirectToLibrary("/library/templates", "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const data = parsed.data;
  const insertPayload = {
    owner_user_id: viewer.id,
    name: data.name,
    description: data.description,
    estimated_duration_minutes: data.estimatedDurationMinutes,
    focus: data.focus,
    active: data.active
  };

  if (data.templateId) {
    const { error } = await supabase
      .from("workout_templates")
      .update({
        name: data.name,
        description: data.description,
        estimated_duration_minutes: data.estimatedDurationMinutes,
        focus: data.focus,
        active: data.active
      })
      .eq("id", data.templateId)
      .eq("owner_user_id", viewer.id);

    if (error) {
      redirectToLibrary("/library/templates", "error=save_failed");
    }
  } else {
    const { error } = await supabase.from("workout_templates").insert(insertPayload);

    if (error) {
      redirectToLibrary("/library/templates", "error=create_failed");
    }
  }

  revalidatePath("/library/templates");
  redirectToLibrary("/library/templates", "status=saved");
}

export async function duplicateWorkoutTemplateAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  const templateId = String(formData.get("templateId") ?? "");

  if (!getSupabaseConfig()) {
    redirectToLibrary("/library/templates", "status=demo_mode");
  }

  const template = await getWorkoutTemplateByIdForViewer(viewer, templateId);

  if (!template) {
    redirectToLibrary("/library/templates", "error=missing_template");
  }

  const supabase = await createSupabaseServerClient();

  try {
    await duplicateTemplate(supabase, template!, viewer.id);
  } catch {
    redirectToLibrary("/library/templates", "error=duplicate_failed");
  }

  revalidatePath("/library/templates");
  redirectToLibrary("/library/templates", "status=duplicated");
}

export async function toggleWorkoutTemplateActiveAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  const templateId = String(formData.get("templateId") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "false") === "true";

  if (!getSupabaseConfig()) {
    redirectToLibrary("/library/templates", "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workout_templates")
    .update({ active: nextActive })
    .eq("id", templateId)
    .eq("owner_user_id", viewer.id);

  if (error) {
    redirectToLibrary("/library/templates", "error=toggle_failed");
  }

  revalidatePath("/library/templates");
  redirectToLibrary("/library/templates", "status=updated");
}
