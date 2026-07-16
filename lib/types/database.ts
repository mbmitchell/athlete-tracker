export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "athlete" | "parent";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: "admin" | "athlete" | "parent";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: "admin" | "athlete" | "parent";
          updated_at?: string;
        };
        Relationships: [];
      };
      athletes: {
        Row: {
          id: string;
          managed_by: string;
          user_id: string | null;
          athlete_login_status: "none" | "invited" | "connected" | "disabled";
          login_email: string | null;
          invited_at: string | null;
          connected_at: string | null;
          disabled_at: string | null;
          first_name: string;
          last_name: string;
          graduation_year: number;
          date_of_birth: string | null;
          hometown: string;
          primary_position: string;
          secondary_position: string | null;
          height: string | null;
          weight: string | null;
          current_team: string | null;
          development_goals: string[];
          available_equipment: string[];
          restrictions_or_injury_notes: string | null;
          recruiting_notes: string | null;
          current_development_focus: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          managed_by: string;
          user_id?: string | null;
          athlete_login_status?: "none" | "invited" | "connected" | "disabled";
          login_email?: string | null;
          invited_at?: string | null;
          connected_at?: string | null;
          disabled_at?: string | null;
          first_name: string;
          last_name: string;
          graduation_year: number;
          date_of_birth?: string | null;
          hometown: string;
          primary_position: string;
          secondary_position?: string | null;
          height?: string | null;
          weight?: string | null;
          current_team?: string | null;
          development_goals?: string[];
          available_equipment?: string[];
          restrictions_or_injury_notes?: string | null;
          recruiting_notes?: string | null;
          current_development_focus?: string | null;
          active?: boolean;
        };
        Update: {
          managed_by?: string;
          user_id?: string | null;
          athlete_login_status?: "none" | "invited" | "connected" | "disabled";
          login_email?: string | null;
          invited_at?: string | null;
          connected_at?: string | null;
          disabled_at?: string | null;
          first_name?: string;
          last_name?: string;
          graduation_year?: number;
          date_of_birth?: string | null;
          hometown?: string;
          primary_position?: string;
          secondary_position?: string | null;
          height?: string | null;
          weight?: string | null;
          current_team?: string | null;
          development_goals?: string[];
          available_equipment?: string[];
          restrictions_or_injury_notes?: string | null;
          recruiting_notes?: string | null;
          current_development_focus?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      parent_athletes: {
        Row: {
          parent_user_id: string;
          athlete_id: string;
          created_at: string;
        };
        Insert: {
          parent_user_id: string;
          athlete_id: string;
          created_at?: string;
        };
        Update: {};
        Relationships: [];
      };
      training_weeks: {
        Row: {
          id: string;
          athlete_id: string;
          week_start_date: string;
          title: string;
          focus: string | null;
          status: "draft" | "published" | "archived";
          admin_notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          week_start_date: string;
          title: string;
          focus?: string | null;
          status?: "draft" | "published" | "archived";
          admin_notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          focus?: string | null;
          status?: "draft" | "published" | "archived";
          admin_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      athlete_readiness_logs: {
        Row: {
          id: string;
          athlete_id: string;
          assigned_workout_id: string | null;
          readiness_status: "ready" | "monitor" | "recover";
          sleep_hours: number | null;
          sleep_quality: number | null;
          energy: number | null;
          soreness: number | null;
          stress: number | null;
          body_weight: number | null;
          development_focus: string | null;
          notes: string | null;
          entered_by: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          assigned_workout_id?: string | null;
          readiness_status?: "ready" | "monitor" | "recover";
          sleep_hours?: number | null;
          sleep_quality?: number | null;
          energy?: number | null;
          soreness?: number | null;
          stress?: number | null;
          body_weight?: number | null;
          development_focus?: string | null;
          notes?: string | null;
          entered_by?: string | null;
          recorded_at?: string;
        };
        Update: {
          readiness_status?: "ready" | "monitor" | "recover";
          sleep_hours?: number | null;
          sleep_quality?: number | null;
          energy?: number | null;
          soreness?: number | null;
          stress?: number | null;
          body_weight?: number | null;
          development_focus?: string | null;
          notes?: string | null;
          entered_by?: string | null;
        };
        Relationships: [];
      };
      exercise_library: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          category:
            | "readiness"
            | "warm_up"
            | "mobility"
            | "strength"
            | "power"
            | "speed"
            | "agility"
            | "hitting"
            | "throwing"
            | "catching"
            | "defense"
            | "pitching"
            | "recovery"
            | "nutrition"
            | "recruiting"
            | "custom";
          description: string | null;
          coaching_cues: string | null;
          default_unit_type:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
          equipment: string | null;
          video_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          category:
            | "readiness"
            | "warm_up"
            | "mobility"
            | "strength"
            | "power"
            | "speed"
            | "agility"
            | "hitting"
            | "throwing"
            | "catching"
            | "defense"
            | "pitching"
            | "recovery"
            | "nutrition"
            | "recruiting"
            | "custom";
          description?: string | null;
          coaching_cues?: string | null;
          default_unit_type:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
          equipment?: string | null;
          video_url?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          category?:
            | "readiness"
            | "warm_up"
            | "mobility"
            | "strength"
            | "power"
            | "speed"
            | "agility"
            | "hitting"
            | "throwing"
            | "catching"
            | "defense"
            | "pitching"
            | "recovery"
            | "nutrition"
            | "recruiting"
            | "custom";
          description?: string | null;
          coaching_cues?: string | null;
          default_unit_type?:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
          equipment?: string | null;
          video_url?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      workout_templates: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          description: string | null;
          estimated_duration_minutes: number | null;
          focus: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          description?: string | null;
          estimated_duration_minutes?: number | null;
          focus?: string | null;
          active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          estimated_duration_minutes?: number | null;
          focus?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      workout_template_sections: {
        Row: {
          id: string;
          workout_template_id: string;
          title: string;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          workout_template_id: string;
          title: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      workout_template_items: {
        Row: {
          id: string;
          workout_template_section_id: string;
          exercise_id: string | null;
          custom_name: string | null;
          instructions: string | null;
          prescribed_sets: string | null;
          prescribed_reps: string | null;
          prescribed_load: string | null;
          prescribed_duration_seconds: number | null;
          prescribed_distance: string | null;
          prescribed_unit: string | null;
          target_value: string | null;
          target_unit: string | null;
          rest_seconds: number | null;
          sort_order: number;
          required: boolean;
          result_entry_type:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_template_section_id: string;
          exercise_id?: string | null;
          custom_name?: string | null;
          instructions?: string | null;
          prescribed_sets?: string | null;
          prescribed_reps?: string | null;
          prescribed_load?: string | null;
          prescribed_duration_seconds?: number | null;
          prescribed_distance?: string | null;
          prescribed_unit?: string | null;
          target_value?: string | null;
          target_unit?: string | null;
          rest_seconds?: number | null;
          sort_order?: number;
          required?: boolean;
          result_entry_type:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
          notes?: string | null;
        };
        Update: {
          exercise_id?: string | null;
          custom_name?: string | null;
          instructions?: string | null;
          prescribed_sets?: string | null;
          prescribed_reps?: string | null;
          prescribed_load?: string | null;
          prescribed_duration_seconds?: number | null;
          prescribed_distance?: string | null;
          prescribed_unit?: string | null;
          target_value?: string | null;
          target_unit?: string | null;
          rest_seconds?: number | null;
          sort_order?: number;
          required?: boolean;
          result_entry_type?:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
          notes?: string | null;
        };
        Relationships: [];
      };
      assigned_workouts: {
        Row: {
          id: string;
          athlete_id: string;
          training_week_id: string | null;
          source_template_id: string | null;
          workout_date: string;
          title: string;
          objective: string | null;
          estimated_duration_minutes: number | null;
          status: "draft" | "published" | "in_progress" | "completed" | "skipped";
          admin_notes: string | null;
          athlete_notes: string | null;
          skip_reason: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          training_week_id?: string | null;
          source_template_id?: string | null;
          workout_date: string;
          title: string;
          objective?: string | null;
          estimated_duration_minutes?: number | null;
          status?: "draft" | "published" | "in_progress" | "completed" | "skipped";
          admin_notes?: string | null;
          athlete_notes?: string | null;
          skip_reason?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          training_week_id?: string | null;
          source_template_id?: string | null;
          workout_date?: string;
          title?: string;
          objective?: string | null;
          estimated_duration_minutes?: number | null;
          status?: "draft" | "published" | "in_progress" | "completed" | "skipped";
          admin_notes?: string | null;
          athlete_notes?: string | null;
          skip_reason?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      assigned_workout_sections: {
        Row: {
          id: string;
          assigned_workout_id: string;
          title: string;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          assigned_workout_id: string;
          title: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      assigned_workout_items: {
        Row: {
          id: string;
          assigned_workout_section_id: string;
          source_exercise_id: string | null;
          name: string;
          instructions: string | null;
          prescribed_sets: string | null;
          prescribed_reps: string | null;
          prescribed_load: string | null;
          prescribed_duration_seconds: number | null;
          prescribed_distance: string | null;
          prescribed_unit: string | null;
          target_value: string | null;
          target_unit: string | null;
          rest_seconds: number | null;
          sort_order: number;
          required: boolean;
          result_entry_type:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
        };
        Insert: {
          id?: string;
          assigned_workout_section_id: string;
          source_exercise_id?: string | null;
          name: string;
          instructions?: string | null;
          prescribed_sets?: string | null;
          prescribed_reps?: string | null;
          prescribed_load?: string | null;
          prescribed_duration_seconds?: number | null;
          prescribed_distance?: string | null;
          prescribed_unit?: string | null;
          target_value?: string | null;
          target_unit?: string | null;
          rest_seconds?: number | null;
          sort_order?: number;
          required?: boolean;
          result_entry_type:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
        };
        Update: {
          source_exercise_id?: string | null;
          name?: string;
          instructions?: string | null;
          prescribed_sets?: string | null;
          prescribed_reps?: string | null;
          prescribed_load?: string | null;
          prescribed_duration_seconds?: number | null;
          prescribed_distance?: string | null;
          prescribed_unit?: string | null;
          target_value?: string | null;
          target_unit?: string | null;
          rest_seconds?: number | null;
          sort_order?: number;
          required?: boolean;
          result_entry_type?:
            | "checkbox"
            | "sets_reps"
            | "sets_reps_weight"
            | "duration"
            | "distance"
            | "velocity"
            | "count"
            | "text"
            | "numeric"
            | "percentage"
            | "rating";
        };
        Relationships: [];
      };
      workout_item_results: {
        Row: {
          id: string;
          assigned_workout_item_id: string;
          athlete_id: string;
          completed: boolean;
          actual_sets: string | null;
          actual_reps: string | null;
          actual_load: string | null;
          actual_duration_seconds: string | null;
          actual_distance: string | null;
          actual_value: string | null;
          actual_unit: string | null;
          rating: number | null;
          text_result: string | null;
          athlete_notes: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assigned_workout_item_id: string;
          athlete_id: string;
          completed?: boolean;
          actual_sets?: string | null;
          actual_reps?: string | null;
          actual_load?: string | null;
          actual_duration_seconds?: string | null;
          actual_distance?: string | null;
          actual_value?: string | null;
          actual_unit?: string | null;
          rating?: number | null;
          text_result?: string | null;
          athlete_notes?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          completed?: boolean;
          actual_sets?: string | null;
          actual_reps?: string | null;
          actual_load?: string | null;
          actual_duration_seconds?: string | null;
          actual_distance?: string | null;
          actual_value?: string | null;
          actual_unit?: string | null;
          rating?: number | null;
          text_result?: string | null;
          athlete_notes?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      seed_baseball_starter_data: {
        Args: {
          target_owner_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "athlete" | "parent";
      readiness_status: "ready" | "monitor" | "recover";
      completion_status: "not_started" | "in_progress" | "completed";
      exercise_category:
        | "readiness"
        | "warm_up"
        | "mobility"
        | "strength"
        | "power"
        | "speed"
        | "agility"
        | "hitting"
        | "throwing"
        | "catching"
        | "defense"
        | "pitching"
        | "recovery"
        | "nutrition"
        | "recruiting"
        | "custom";
      workout_result_type:
        | "checkbox"
        | "sets_reps"
        | "sets_reps_weight"
        | "duration"
        | "distance"
        | "velocity"
        | "count"
        | "text"
        | "numeric"
        | "percentage"
        | "rating";
      training_week_status: "draft" | "published" | "archived";
      assigned_workout_status: "draft" | "published" | "in_progress" | "completed" | "skipped";
    };
    CompositeTypes: Record<string, never>;
  };
};
