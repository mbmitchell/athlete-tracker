import { saveAthleteProfileAction } from "@/app/actions/athletes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AthleteProfile } from "@/lib/types/domain";
import { formatListInput } from "@/lib/utils";

type AthleteFormProps = {
  athlete?: AthleteProfile | null;
  mode: "create" | "edit";
};

export function AthleteForm({ athlete, mode }: AthleteFormProps) {
  return (
    <form action={saveAthleteProfileAction} className="space-y-6">
      <input name="athleteId" type="hidden" value={athlete?.id ?? ""} />
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Create athlete profile" : "Edit athlete profile"}</CardTitle>
          <CardDescription>
            Capture the training, readiness, and recruiting context needed to support individualized programming.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" required defaultValue={athlete?.firstName ?? ""} />
            <Field label="Last name" name="lastName" required defaultValue={athlete?.lastName ?? ""} />
            <Field
              label="Graduation year"
              name="graduationYear"
              required
              type="number"
              defaultValue={athlete?.graduationYear?.toString() ?? ""}
            />
            <Field
              label="Date of birth"
              name="dateOfBirth"
              type="date"
              defaultValue={athlete?.dateOfBirth ?? ""}
            />
            <Field label="Hometown" name="hometown" required defaultValue={athlete?.hometown ?? ""} />
            <Field label="Current team" name="currentTeam" defaultValue={athlete?.currentTeam ?? ""} />
            <Field
              label="Primary position"
              name="primaryPosition"
              required
              defaultValue={athlete?.primaryPosition ?? ""}
            />
            <Field label="Secondary position" name="secondaryPosition" defaultValue={athlete?.secondaryPosition ?? ""} />
            <Field label="Height" name="height" defaultValue={athlete?.height ?? ""} />
            <Field label="Weight" name="weight" defaultValue={athlete?.weight ?? ""} />
            <Field
              label="Current development focus"
              name="currentDevelopmentFocus"
              defaultValue={athlete?.currentDevelopmentFocus ?? ""}
            />
            <div className="space-y-2">
              <Label htmlFor="activeStatus">Status</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={athlete?.active === false ? "inactive" : "active"}
                id="activeStatus"
                name="activeStatus"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4">
            <TextField
              label="Development goals"
              name="developmentGoals"
              defaultValue={formatListInput(athlete?.developmentGoals.join("\n"))}
              description="One per line or comma-separated."
            />
            <TextField
              label="Available equipment"
              name="availableEquipment"
              defaultValue={formatListInput(athlete?.availableEquipment.join("\n"))}
              description="One per line or comma-separated."
            />
            <TextField
              label="Restrictions or injury notes"
              name="restrictionsOrInjuryNotes"
              defaultValue={athlete?.restrictionsOrInjuryNotes ?? ""}
            />
            <TextField
              label="Recruiting notes"
              name="recruitingNotes"
              defaultValue={athlete?.recruitingNotes ?? ""}
            />
          </div>
          <div className="flex justify-end">
            <Button size="lg" type="submit">
              {mode === "create" ? "Create athlete" : "Save athlete profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
};

function Field({ label, name, defaultValue, type = "text", required = false }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} id={name} name={name} required={required} type={type} />
    </div>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  description?: string;
};

function TextField({ label, name, defaultValue, description }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea defaultValue={defaultValue} id={name} name={name} />
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
