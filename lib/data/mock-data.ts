import type {
  AdminDashboardCard,
  AssignedWorkout,
  AthleteProfile,
  ExerciseLibraryEntry,
  TrainingWeek,
  WorkoutTemplate
} from "@/lib/types/domain";
import { calculateWorkoutProgress } from "@/lib/workouts/progress";
import { buildWeekDates, formatLongDate } from "@/lib/workouts/date";

export const mockAthletes: AthleteProfile[] = [
  {
    id: "athlete-colt",
    firstName: "Colt",
    lastName: "Ramirez",
    graduationYear: 2027,
    dateOfBirth: "2009-08-18",
    hometown: "Frisco, TX",
    primaryPosition: "C",
    secondaryPosition: "RHP",
    height: "6'0\"",
    weight: "184 lb",
    currentTeam: "Dallas Tigers Scout",
    developmentGoals: ["Improve pop time consistency", "Add rotational power", "Build mound recovery routine"],
    availableEquipment: ["Trap bar", "Med balls", "Plyoballs", "Pocket radar"],
    restrictionsOrInjuryNotes: "Monitor throwing volume after bullpen days.",
    recruitingNotes: "Projectable catcher with emerging right-handed power.",
    active: true,
    currentDevelopmentFocus: "Rotational power and transfer speed",
    accountConnection: {
      status: "connected",
      email: "colt@demo.athletedevelopmenthub.app",
      userId: "demo-athlete-colt-user",
      invitedAt: "2026-07-10T15:00:00.000Z",
      connectedAt: "2026-07-10T18:30:00.000Z",
      disabledAt: null
    }
  },
  {
    id: "athlete-lane",
    firstName: "Lane",
    lastName: "Walker",
    graduationYear: 2028,
    dateOfBirth: "2010-02-04",
    hometown: "Prosper, TX",
    primaryPosition: "OF",
    secondaryPosition: "",
    height: "5'11\"",
    weight: "168 lb",
    currentTeam: "Canes Southwest",
    developmentGoals: ["Improve first-step acceleration", "Raise average exit velocity", "Own post-game recovery"],
    availableEquipment: ["Sprint timer", "Trap bar", "Bands", "Blast Motion"],
    restrictionsOrInjuryNotes: "",
    recruitingNotes: "Strong mover with room for more force output.",
    active: true,
    currentDevelopmentFocus: "Acceleration and exit velocity",
    accountConnection: {
      status: "invited",
      email: "lane@demo.athletedevelopmenthub.app",
      userId: "demo-athlete-lane-user",
      invitedAt: "2026-07-14T14:00:00.000Z",
      connectedAt: null,
      disabledAt: null
    }
  }
];

export const mockExerciseLibrary: ExerciseLibraryEntry[] = [
  {
    id: "exercise-readiness-questionnaire",
    name: "Readiness questionnaire",
    category: "readiness",
    description: "Daily self-report before training.",
    coachingCues: "Answer honestly before the warm-up starts.",
    defaultUnitType: "rating",
    equipment: "None",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-dynamic-warm-up",
    name: "Dynamic warm-up",
    category: "warm_up",
    description: "Foundational movement prep for practice or training.",
    coachingCues: "Own each position and keep the pace controlled.",
    defaultUnitType: "duration",
    equipment: "Open space",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-med-ball-scoop-toss",
    name: "Med-ball scoop toss",
    category: "power",
    description: "Build rotational force transfer.",
    coachingCues: "Load the back hip and finish through the wall.",
    defaultUnitType: "sets_reps",
    equipment: "Med ball",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-tee-exit-velo",
    name: "Tee exit-velocity swings",
    category: "hitting",
    description: "Intent-based swings tracked for peak exit velocity.",
    coachingCues: "Attack the middle of the ball with intent, not overswing.",
    defaultUnitType: "velocity",
    equipment: "Bat, tee, pocket radar",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-blast-motion-swings",
    name: "Blast Motion measured swings",
    category: "hitting",
    description: "Sensor-based swing tracking.",
    coachingCues: "Stay consistent so the sensor data stays clean.",
    defaultUnitType: "numeric",
    equipment: "Blast Motion sensor",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-catcher-receiving",
    name: "Catcher receiving",
    category: "catching",
    description: "Receiving and pocket presentation reps.",
    coachingCues: "Beat the ball to the spot and hold the pocket quietly.",
    defaultUnitType: "count",
    equipment: "Catching gear",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-timed-catcher-throws",
    name: "Timed catcher throws",
    category: "catching",
    description: "Pop time and transfer work.",
    coachingCues: "Feet first, then clean hand exchange.",
    defaultUnitType: "duration",
    equipment: "Stopwatch",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-plyoball-routine",
    name: "Plyoball routine",
    category: "throwing",
    description: "Arm-care and patterning sequence.",
    coachingCues: "Stay crisp and stop before mechanics fade.",
    defaultUnitType: "checkbox",
    equipment: "Plyoballs",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-bullpen",
    name: "Bullpen",
    category: "pitching",
    description: "Structured mound session.",
    coachingCues: "Compete through the glove side without rushing down the mound.",
    defaultUnitType: "count",
    equipment: "Mound",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-trap-bar-deadlift",
    name: "Trap-bar deadlift",
    category: "strength",
    description: "Primary lower-body strength pattern.",
    coachingCues: "Brace, push the floor away, and finish tall.",
    defaultUnitType: "sets_reps_weight",
    equipment: "Trap bar",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-bulgarian-split-squat",
    name: "Bulgarian split squat",
    category: "strength",
    description: "Single-leg force and control.",
    coachingCues: "Own the bottom position and drive straight up.",
    defaultUnitType: "sets_reps_weight",
    equipment: "Dumbbells",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-cable-rotation",
    name: "Cable rotation",
    category: "power",
    description: "Rotational force and trunk control.",
    coachingCues: "Turn around a stable front hip.",
    defaultUnitType: "sets_reps_weight",
    equipment: "Cable machine",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-sprint-work",
    name: "Sprint work",
    category: "speed",
    description: "Acceleration or max-velocity sprint prescription.",
    coachingCues: "Project with intent and keep your rhythm clean.",
    defaultUnitType: "distance",
    equipment: "Turf",
    videoUrl: null,
    active: true
  },
  {
    id: "exercise-recovery-breathing",
    name: "Recovery breathing",
    category: "recovery",
    description: "Down-regulation and recovery routine.",
    coachingCues: "Exhale long and let the rib cage drop.",
    defaultUnitType: "duration",
    equipment: "None",
    videoUrl: null,
    active: true
  }
];

export const mockWorkoutTemplates: WorkoutTemplate[] = [
  {
    id: "template-colt-power",
    name: "Catcher Power + Throw Transfer",
    description: "Lower-body force, rotational power, and transfer speed work.",
    estimatedDurationMinutes: 75,
    focus: "Explosive force and catcher transfer speed",
    active: true,
    sections: [
      {
        id: "template-colt-power-section-1",
        title: "Prep",
        description: "Get hips, trunk, and shoulders ready to move fast.",
        sortOrder: 1,
        items: [
          {
            id: "template-colt-power-item-1",
            exerciseId: "exercise-dynamic-warm-up",
            customName: null,
            instructions: "Flow through each movement without rushing.",
            prescribedSets: "",
            prescribedReps: "",
            prescribedLoad: "",
            prescribedDurationSeconds: "600",
            prescribedDistance: "",
            prescribedUnit: "seconds",
            targetValue: "",
            targetUnit: "",
            restSeconds: "",
            sortOrder: 1,
            required: true,
            resultEntryType: "checkbox",
            notes: "",
            exerciseName: "Dynamic warm-up"
          }
        ]
      },
      {
        id: "template-colt-power-section-2",
        title: "Power + skill",
        description: "Pair explosive work with transfer-speed skill work.",
        sortOrder: 2,
        items: [
          {
            id: "template-colt-power-item-2",
            exerciseId: "exercise-med-ball-scoop-toss",
            customName: null,
            instructions: "Throw into the wall with max intent and full reset between reps.",
            prescribedSets: "4",
            prescribedReps: "4 / side",
            prescribedLoad: "6 lb",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "",
            targetUnit: "",
            restSeconds: "75",
            sortOrder: 1,
            required: true,
            resultEntryType: "sets_reps_weight",
            notes: "",
            exerciseName: "Med-ball scoop toss"
          },
          {
            id: "template-colt-power-item-3",
            exerciseId: "exercise-timed-catcher-throws",
            customName: null,
            instructions: "Record your best rep and your average pop time.",
            prescribedSets: "5",
            prescribedReps: "2 throws",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "1.95",
            targetUnit: "seconds",
            restSeconds: "60",
            sortOrder: 2,
            required: true,
            resultEntryType: "duration",
            notes: "",
            exerciseName: "Timed catcher throws"
          }
        ]
      }
    ]
  },
  {
    id: "template-lane-exit-velo",
    name: "Outfield Speed + Exit Velo",
    description: "Speed, rotational intent, and measured swing quality.",
    estimatedDurationMinutes: 70,
    focus: "Acceleration and batted-ball quality",
    active: true,
    sections: [
      {
        id: "template-lane-exit-velo-section-1",
        title: "Movement prep",
        description: "Prime sprint posture and bat speed.",
        sortOrder: 1,
        items: [
          {
            id: "template-lane-exit-velo-item-1",
            exerciseId: "exercise-dynamic-warm-up",
            customName: null,
            instructions: "Own each drill and stay deliberate.",
            prescribedSets: "",
            prescribedReps: "",
            prescribedLoad: "",
            prescribedDurationSeconds: "540",
            prescribedDistance: "",
            prescribedUnit: "seconds",
            targetValue: "",
            targetUnit: "",
            restSeconds: "",
            sortOrder: 1,
            required: true,
            resultEntryType: "checkbox",
            notes: "",
            exerciseName: "Dynamic warm-up"
          }
        ]
      },
      {
        id: "template-lane-exit-velo-section-2",
        title: "Speed + hitting",
        description: "Keep the day fast without excess volume.",
        sortOrder: 2,
        items: [
          {
            id: "template-lane-exit-velo-item-2",
            exerciseId: "exercise-sprint-work",
            customName: null,
            instructions: "Full recovery between reps. Log best split if you time it.",
            prescribedSets: "6",
            prescribedReps: "1",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "15 yd",
            prescribedUnit: "yards",
            targetValue: "",
            targetUnit: "",
            restSeconds: "75",
            sortOrder: 1,
            required: true,
            resultEntryType: "duration",
            notes: "",
            exerciseName: "Sprint work"
          },
          {
            id: "template-lane-exit-velo-item-3",
            exerciseId: "exercise-tee-exit-velo",
            customName: null,
            instructions: "Take your top 5 intent swings and record peak EV.",
            prescribedSets: "5",
            prescribedReps: "2 swings",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "88",
            targetUnit: "mph",
            restSeconds: "45",
            sortOrder: 2,
            required: true,
            resultEntryType: "velocity",
            notes: "",
            exerciseName: "Tee exit-velocity swings"
          }
        ]
      }
    ]
  }
];

export const mockTrainingWeeks: TrainingWeek[] = [
  {
    id: "week-colt-2026-07-13",
    athleteId: "athlete-colt",
    weekStartDate: "2026-07-13",
    title: "Week 29: Catcher Transfer",
    focus: "Transfer speed, rotational power, and mound recovery",
    status: "published",
    adminNotes: "Keep throwing volume moderate after Wednesday bullpen.",
    workouts: [
      {
        id: "workout-colt-2026-07-14",
        athleteId: "athlete-colt",
        workoutDate: "2026-07-14",
        title: "Lower-body power + transfer speed",
        objective: "Move faster from glove to release without losing lower-half force.",
        estimatedDurationMinutes: 72,
        status: "completed",
        sourceTemplateId: "template-colt-power"
      },
      {
        id: "workout-colt-2026-07-16",
        athleteId: "athlete-colt",
        workoutDate: "2026-07-16",
        title: "Bullpen + recovery blend",
        objective: "Get quality mound work and own the recovery pieces.",
        estimatedDurationMinutes: 68,
        status: "in_progress",
        sourceTemplateId: null
      },
      {
        id: "workout-colt-2026-07-18",
        athleteId: "athlete-colt",
        workoutDate: "2026-07-18",
        title: "Game-prep activation",
        objective: "Short activation before tournament play.",
        estimatedDurationMinutes: 35,
        status: "published",
        sourceTemplateId: null
      }
    ]
  },
  {
    id: "week-lane-2026-07-13",
    athleteId: "athlete-lane",
    weekStartDate: "2026-07-13",
    title: "Week 29: Speed + EV",
    focus: "Acceleration, force expression, and batted-ball intent",
    status: "draft",
    adminNotes: "If legs feel heavy after travel ball, cut sprint volume by 1-2 reps.",
    workouts: [
      {
        id: "workout-lane-2026-07-15",
        athleteId: "athlete-lane",
        workoutDate: "2026-07-15",
        title: "Sprint + exit velocity",
        objective: "Pair quality acceleration with intent-based bat speed work.",
        estimatedDurationMinutes: 70,
        status: "published",
        sourceTemplateId: "template-lane-exit-velo"
      },
      {
        id: "workout-lane-2026-07-17",
        athleteId: "athlete-lane",
        workoutDate: "2026-07-17",
        title: "Strength + recovery",
        objective: "Build force without beating up the legs before the weekend.",
        estimatedDurationMinutes: 60,
        status: "draft",
        sourceTemplateId: null
      }
    ]
  }
];

export const mockAssignedWorkouts: AssignedWorkout[] = [
  {
    id: "workout-colt-2026-07-14",
    athleteId: "athlete-colt",
    trainingWeekId: "week-colt-2026-07-13",
    sourceTemplateId: "template-colt-power",
    workoutDate: "2026-07-14",
    title: "Lower-body power + transfer speed",
    objective: "Move faster from glove to release without losing lower-half force.",
    estimatedDurationMinutes: 72,
    status: "completed",
    adminNotes: "Record best pop time and keep soreness notes after throwing.",
    athleteNotes: "Legs felt good. Transfer was cleaner than last week.",
    skipReason: "",
    startedAt: "2026-07-14T14:30:00Z",
    completedAt: "2026-07-14T15:39:00Z",
    readinessEntry: {
      id: "readiness-colt-2026-07-14",
      athleteId: "athlete-colt",
      assignedWorkoutId: "workout-colt-2026-07-14",
      sleepHours: "8.0",
      sleepQuality: "4",
      energy: "4",
      soreness: "2",
      stress: "2",
      bodyWeight: "184.2",
      note: "Felt fresh after the off day.",
      recordedAt: "2026-07-14T14:25:00Z"
    },
    sections: [
      {
        id: "assigned-section-colt-1",
        title: "Prep",
        description: "Open up hips and trunk before power work.",
        sortOrder: 1,
        items: [
          {
            id: "assigned-item-colt-1",
            sourceExerciseId: "exercise-dynamic-warm-up",
            name: "Dynamic warm-up",
            instructions: "Flow through the sequence without rushing.",
            prescribedSets: "",
            prescribedReps: "",
            prescribedLoad: "",
            prescribedDurationSeconds: "600",
            prescribedDistance: "",
            prescribedUnit: "seconds",
            targetValue: "",
            targetUnit: "",
            restSeconds: "",
            sortOrder: 1,
            required: true,
            resultEntryType: "checkbox",
            result: {
              id: "result-colt-1",
              assignedWorkoutItemId: "assigned-item-colt-1",
              athleteId: "athlete-colt",
              completed: true,
              actualSets: "",
              actualReps: "",
              actualLoad: "",
              actualDurationSeconds: "",
              actualDistance: "",
              actualValue: "",
              actualUnit: "",
              rating: "",
              textResult: "",
              athleteNotes: "Quick and smooth.",
              completedAt: "2026-07-14T14:40:00Z"
            }
          }
        ]
      },
      {
        id: "assigned-section-colt-2",
        title: "Power + skill",
        description: "Explosive throws and timed transfers.",
        sortOrder: 2,
        items: [
          {
            id: "assigned-item-colt-2",
            sourceExerciseId: "exercise-med-ball-scoop-toss",
            name: "Med-ball scoop toss",
            instructions: "Full reset and max intent each rep.",
            prescribedSets: "4",
            prescribedReps: "4 / side",
            prescribedLoad: "6 lb",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "",
            targetUnit: "",
            restSeconds: "75",
            sortOrder: 1,
            required: true,
            resultEntryType: "sets_reps_weight",
            result: {
              id: "result-colt-2",
              assignedWorkoutItemId: "assigned-item-colt-2",
              athleteId: "athlete-colt",
              completed: true,
              actualSets: "4",
              actualReps: "4 / side",
              actualLoad: "6 lb",
              actualDurationSeconds: "",
              actualDistance: "",
              actualValue: "",
              actualUnit: "",
              rating: "",
              textResult: "",
              athleteNotes: "Best output on set 3.",
              completedAt: "2026-07-14T15:02:00Z"
            }
          },
          {
            id: "assigned-item-colt-3",
            sourceExerciseId: "exercise-timed-catcher-throws",
            name: "Timed catcher throws",
            instructions: "Record best rep and average.",
            prescribedSets: "5",
            prescribedReps: "2 throws",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "1.95",
            targetUnit: "seconds",
            restSeconds: "60",
            sortOrder: 2,
            required: true,
            resultEntryType: "duration",
            result: {
              id: "result-colt-3",
              assignedWorkoutItemId: "assigned-item-colt-3",
              athleteId: "athlete-colt",
              completed: true,
              actualSets: "",
              actualReps: "",
              actualLoad: "",
              actualDurationSeconds: "1.93",
              actualDistance: "",
              actualValue: "",
              actualUnit: "seconds",
              rating: "",
              textResult: "Average 1.97, best 1.93.",
              athleteNotes: "",
              completedAt: "2026-07-14T15:20:00Z"
            }
          }
        ]
      }
    ]
  },
  {
    id: "workout-colt-2026-07-16",
    athleteId: "athlete-colt",
    trainingWeekId: "week-colt-2026-07-13",
    sourceTemplateId: null,
    workoutDate: "2026-07-16",
    title: "Bullpen + recovery blend",
    objective: "Get quality mound work and own the recovery pieces.",
    estimatedDurationMinutes: 68,
    status: "in_progress",
    adminNotes: "Keep mound work crisp; recovery breathing is required.",
    athleteNotes: "Arm felt good. Need to finish recovery breathing tonight.",
    skipReason: "",
    startedAt: "2026-07-16T14:10:00Z",
    completedAt: null,
    readinessEntry: {
      id: "readiness-colt-2026-07-16",
      athleteId: "athlete-colt",
      assignedWorkoutId: "workout-colt-2026-07-16",
      sleepHours: "7.2",
      sleepQuality: "3",
      energy: "4",
      soreness: "3",
      stress: "2",
      bodyWeight: "183.6",
      note: "Shoulder feels normal.",
      recordedAt: "2026-07-16T14:05:00Z"
    },
    sections: [
      {
        id: "assigned-section-colt-3",
        title: "Throwing",
        description: "Mound work and arm care.",
        sortOrder: 1,
        items: [
          {
            id: "assigned-item-colt-4",
            sourceExerciseId: "exercise-bullpen",
            name: "Bullpen",
            instructions: "Track total quality pitches and 3 best fastball shapes.",
            prescribedSets: "1",
            prescribedReps: "28 pitches",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "pitches",
            targetValue: "28",
            targetUnit: "pitches",
            restSeconds: "",
            sortOrder: 1,
            required: true,
            resultEntryType: "count",
            result: {
              id: "result-colt-4",
              assignedWorkoutItemId: "assigned-item-colt-4",
              athleteId: "athlete-colt",
              completed: true,
              actualSets: "",
              actualReps: "",
              actualLoad: "",
              actualDurationSeconds: "",
              actualDistance: "",
              actualValue: "28",
              actualUnit: "pitches",
              rating: "4",
              textResult: "Fastball command better glove-side.",
              athleteNotes: "",
              completedAt: "2026-07-16T14:42:00Z"
            }
          },
          {
            id: "assigned-item-colt-5",
            sourceExerciseId: "exercise-plyoball-routine",
            name: "Plyoball routine",
            instructions: "Stop if arm slot starts to drift.",
            prescribedSets: "",
            prescribedReps: "",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "",
            targetUnit: "",
            restSeconds: "",
            sortOrder: 2,
            required: true,
            resultEntryType: "checkbox",
            result: {
              id: "result-colt-5",
              assignedWorkoutItemId: "assigned-item-colt-5",
              athleteId: "athlete-colt",
              completed: true,
              actualSets: "",
              actualReps: "",
              actualLoad: "",
              actualDurationSeconds: "",
              actualDistance: "",
              actualValue: "",
              actualUnit: "",
              rating: "",
              textResult: "",
              athleteNotes: "Moved well.",
              completedAt: "2026-07-16T14:58:00Z"
            }
          },
          {
            id: "assigned-item-colt-6",
            sourceExerciseId: "exercise-recovery-breathing",
            name: "Recovery breathing",
            instructions: "Five breaths per round with full exhales.",
            prescribedSets: "3",
            prescribedReps: "5 breaths",
            prescribedLoad: "",
            prescribedDurationSeconds: "240",
            prescribedDistance: "",
            prescribedUnit: "seconds",
            targetValue: "",
            targetUnit: "",
            restSeconds: "20",
            sortOrder: 3,
            required: true,
            resultEntryType: "checkbox",
            result: null
          }
        ]
      }
    ]
  },
  {
    id: "workout-colt-2026-07-18",
    athleteId: "athlete-colt",
    trainingWeekId: "week-colt-2026-07-13",
    sourceTemplateId: null,
    workoutDate: "2026-07-18",
    title: "Game-prep activation",
    objective: "Short activation before tournament play.",
    estimatedDurationMinutes: 35,
    status: "published",
    adminNotes: "Keep it sharp and low volume.",
    athleteNotes: "",
    skipReason: "",
    startedAt: null,
    completedAt: null,
    readinessEntry: null,
    sections: [
      {
        id: "assigned-section-colt-4",
        title: "Activation",
        description: "Move well and prime the nervous system.",
        sortOrder: 1,
        items: [
          {
            id: "assigned-item-colt-7",
            sourceExerciseId: "exercise-dynamic-warm-up",
            name: "Dynamic warm-up",
            instructions: "Stay smooth and athletic.",
            prescribedSets: "",
            prescribedReps: "",
            prescribedLoad: "",
            prescribedDurationSeconds: "480",
            prescribedDistance: "",
            prescribedUnit: "seconds",
            targetValue: "",
            targetUnit: "",
            restSeconds: "",
            sortOrder: 1,
            required: true,
            resultEntryType: "checkbox",
            result: null
          }
        ]
      }
    ]
  },
  {
    id: "workout-lane-2026-07-15",
    athleteId: "athlete-lane",
    trainingWeekId: "week-lane-2026-07-13",
    sourceTemplateId: "template-lane-exit-velo",
    workoutDate: "2026-07-15",
    title: "Sprint + exit velocity",
    objective: "Pair quality acceleration with intent-based bat speed work.",
    estimatedDurationMinutes: 70,
    status: "published",
    adminNotes: "Record peak EV and best 15-yard split.",
    athleteNotes: "",
    skipReason: "",
    startedAt: null,
    completedAt: null,
    readinessEntry: null,
    sections: [
      {
        id: "assigned-section-lane-1",
        title: "Movement prep",
        description: "Prime sprint posture and bat speed.",
        sortOrder: 1,
        items: [
          {
            id: "assigned-item-lane-1",
            sourceExerciseId: "exercise-dynamic-warm-up",
            name: "Dynamic warm-up",
            instructions: "Stay deliberate through every position.",
            prescribedSets: "",
            prescribedReps: "",
            prescribedLoad: "",
            prescribedDurationSeconds: "540",
            prescribedDistance: "",
            prescribedUnit: "seconds",
            targetValue: "",
            targetUnit: "",
            restSeconds: "",
            sortOrder: 1,
            required: true,
            resultEntryType: "checkbox",
            result: null
          }
        ]
      },
      {
        id: "assigned-section-lane-2",
        title: "Speed + hitting",
        description: "Keep the day fast without adding junk volume.",
        sortOrder: 2,
        items: [
          {
            id: "assigned-item-lane-2",
            sourceExerciseId: "exercise-sprint-work",
            name: "Sprint work",
            instructions: "Log your best split or your feel if not timed.",
            prescribedSets: "6",
            prescribedReps: "1",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "15 yd",
            prescribedUnit: "yards",
            targetValue: "",
            targetUnit: "",
            restSeconds: "75",
            sortOrder: 1,
            required: true,
            resultEntryType: "duration",
            result: null
          },
          {
            id: "assigned-item-lane-3",
            sourceExerciseId: "exercise-tee-exit-velo",
            name: "Tee exit-velocity swings",
            instructions: "Take top intent swings and record best EV.",
            prescribedSets: "5",
            prescribedReps: "2 swings",
            prescribedLoad: "",
            prescribedDurationSeconds: "",
            prescribedDistance: "",
            prescribedUnit: "",
            targetValue: "88",
            targetUnit: "mph",
            restSeconds: "45",
            sortOrder: 2,
            required: true,
            resultEntryType: "velocity",
            result: null
          }
        ]
      }
    ]
  }
];

export function getMockTrainingWeek(athleteId: string, weekStart: string): TrainingWeek | null {
  return (
    mockTrainingWeeks.find(
      (week) => week.athleteId === athleteId && week.weekStartDate === weekStart
    ) ?? null
  );
}

export function getMockAssignedWorkoutById(workoutId: string): AssignedWorkout | null {
  return mockAssignedWorkouts.find((workout) => workout.id === workoutId) ?? null;
}

export function getMockAssignedWorkoutByDate(
  athleteId: string,
  workoutDate: string
): AssignedWorkout | null {
  return (
    mockAssignedWorkouts.find(
      (workout) => workout.athleteId === athleteId && workout.workoutDate === workoutDate
    ) ?? null
  );
}

export function getMockWeekDays(athleteId: string, weekStart: string) {
  const week = getMockTrainingWeek(athleteId, weekStart);

  return buildWeekDates(weekStart).map((date) => {
    const workout = week?.workouts.find((entry) => entry.workoutDate === date) ?? null;

    return {
      date,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
        new Date(`${date}T00:00:00Z`)
      ),
      fullLabel: formatLongDate(date),
      workout
    };
  });
}

export const mockAdminDashboardCards: AdminDashboardCard[] = mockAthletes.map((athlete) => {
  const todaysWorkout =
    mockAssignedWorkouts.find(
      (workout) => workout.athleteId === athlete.id && workout.workoutDate === "2026-07-15"
    ) ?? null;
  const readiness = mockAssignedWorkouts.find((workout) => workout.athleteId === athlete.id)?.readinessEntry;

  return {
    athleteId: athlete.id,
    athleteName: `${athlete.firstName} ${athlete.lastName}`,
    graduationYear: athlete.graduationYear,
    positions: [athlete.primaryPosition, athlete.secondaryPosition].filter(Boolean),
    todayCompletionStatus: todaysWorkout?.status ?? "not_assigned",
    currentDevelopmentFocus: athlete.currentDevelopmentFocus,
    latestReadinessStatus: readiness ? "ready" : "unknown",
    latestBodyWeight: readiness?.bodyWeight ? `${readiness.bodyWeight} lb` : athlete.weight || "-"
  };
});

export function getMockWorkoutProgress(workout: AssignedWorkout) {
  return calculateWorkoutProgress(workout.sections.flatMap((section) => section.items));
}
