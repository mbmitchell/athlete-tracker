import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/202607160005_fix_athlete_select_returning_rls.sql"
);

const migrationSql = fs.readFileSync(migrationPath, "utf8");

describe("athlete returning/select RLS migration", () => {
  it("makes admin athlete access explicit without relying on current_user_role for admin access", () => {
    expect(migrationSql).toContain("create or replace function public.can_access_athlete(target_athlete_id uuid)");
    expect(migrationSql).toContain("create or replace function public.can_manage_athlete(target_athlete_id uuid)");
    expect(migrationSql).toContain("managed_by = auth.uid()");
    expect(migrationSql).toContain("public.is_admin()");
    expect(migrationSql).not.toMatch(/current_user_role\(\)\s*=\s*'admin'/);
  });

  it("supports admin insert without returning through the insert policy added earlier", () => {
    const priorMigrationPath = path.join(
      process.cwd(),
      "supabase/migrations/202607152330_fix_athlete_admin_rls.sql"
    );
    const priorMigrationSql = fs.readFileSync(priorMigrationPath, "utf8");

    expect(priorMigrationSql).toMatch(
      /create policy "admins can create athletes"[\s\S]*for insert[\s\S]*with check \(\s*public\.is_admin\(\)\s*and managed_by = auth\.uid\(\)\s*\);/
    );
  });

  it("supports admin insert with returning and immediate select of the new managed athlete", () => {
    expect(migrationSql).toMatch(
      /create policy "admins can view managed athletes"[\s\S]*for select[\s\S]*public\.is_admin\(\)[\s\S]*managed_by = auth\.uid\(\)/
    );
  });

  it("prevents an admin from accessing an athlete managed by another admin", () => {
    expect(migrationSql).toMatch(
      /create policy "admins can view managed athletes"[\s\S]*managed_by = auth\.uid\(\)/
    );
    expect(migrationSql).toMatch(
      /create policy "admins can update managed athletes"[\s\S]*managed_by = auth\.uid\(\)/
    );
  });

  it("prevents an ordinary athlete from inserting athletes through the admin-only insert policy", () => {
    const priorMigrationPath = path.join(
      process.cwd(),
      "supabase/migrations/202607152330_fix_athlete_admin_rls.sql"
    );
    const priorMigrationSql = fs.readFileSync(priorMigrationPath, "utf8");

    expect(priorMigrationSql).toContain("public.is_admin()");
    expect(priorMigrationSql).toContain("and managed_by = auth.uid()");
  });

  it("narrows execute permissions on the security definer helper chain", () => {
    expect(migrationSql).toContain("revoke all on function public.can_manage_athlete(uuid) from public;");
    expect(migrationSql).toContain("grant execute on function public.can_manage_athlete(uuid) to authenticated;");
    expect(migrationSql).toContain("revoke all on function public.can_access_athlete(uuid) from public;");
    expect(migrationSql).toContain("grant execute on function public.can_access_athlete(uuid) to authenticated;");
  });
});
