import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/202607152330_fix_athlete_admin_rls.sql"
);

const migrationSql = fs.readFileSync(migrationPath, "utf8");

describe("athlete admin RLS migration", () => {
  it("defines admin status from user_profiles and auth.uid(), not auth.role() = admin", () => {
    expect(migrationSql).toContain("create or replace function public.is_admin()");
    expect(migrationSql).toContain("from public.user_profiles");
    expect(migrationSql).toContain("where id = auth.uid()");
    expect(migrationSql).toContain("and role = 'admin'");
    expect(migrationSql).not.toMatch(/auth\.role\(\)\s*=\s*'admin'/);
  });

  it("allows athlete inserts only for application admins inserting with managed_by = auth.uid()", () => {
    expect(migrationSql).toMatch(
      /create policy "admins can create athletes"[\s\S]*for insert[\s\S]*with check \(\s*public\.is_admin\(\)\s*and managed_by = auth\.uid\(\)\s*\);/
    );
  });

  it("prevents admins from inserting athletes for another managed_by uuid", () => {
    expect(migrationSql).toContain("and managed_by = auth.uid()");
  });

  it("keeps select and update athlete policies routed through the same admin helper", () => {
    expect(migrationSql).toMatch(
      /create or replace function public\.can_manage_athlete\(target_athlete_id uuid\)[\s\S]*select public\.is_admin\(\)[\s\S]*managed_by = auth\.uid\(\)/
    );
    expect(migrationSql).toMatch(
      /create policy "admins can update managed athletes"[\s\S]*using \(public\.can_manage_athlete\(id\)\)[\s\S]*with check \(public\.can_manage_athlete\(id\)\);/
    );
    expect(migrationSql).toMatch(
      /create policy "admins can view managed athletes"[\s\S]*using \(public\.can_access_athlete\(id\)\);/
    );
  });

  it("grants the narrow is_admin helper to authenticated users", () => {
    expect(migrationSql).toContain("revoke all on function public.is_admin() from public;");
    expect(migrationSql).toContain("grant execute on function public.is_admin() to authenticated;");
  });
});
