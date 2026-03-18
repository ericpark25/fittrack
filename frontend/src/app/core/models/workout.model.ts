export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED';
export type SetType = 'NORMAL' | 'WARMUP' | 'DROP_SET';

export interface WorkoutSet {
  id: number;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  setType: SetType;
  e1rm?: number;
}

export interface WorkoutSetRequest {
  exerciseId: number;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  setType: SetType;
}

export interface Workout {
  id: number;
  name: string;
  date: string;
  status: WorkoutStatus;
  sets: WorkoutSet[];
}

export interface WorkoutRequest {
  name: string;
  date: string;
  status: WorkoutStatus;
}
