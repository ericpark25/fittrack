export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED';
export type SetType = 'WORKING' | 'WARMUP' | 'DROP';

export interface WorkoutSet {
  id: number;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  blockIndex: number;   // which visual exercise block this set belongs to
  weight: number;
  reps: number;
  rpe?: number;
  setType: SetType;
  e1rm?: number;
}

export interface WorkoutSetRequest {
  exerciseId: number;
  setNumber: number;
  blockIndex: number;   // assigned by the frontend, used to reconstruct groupings on reload
  weight: number;
  reps: number;
  rpe?: number;
  setType: SetType;
}

export interface Workout {
  id: number;
  name: string;
  description?: string;
  date: string;
  status: WorkoutStatus;
  sets: WorkoutSet[];
}

export interface WorkoutRequest {
  name: string;
  description?: string;
  date: string;
  status: WorkoutStatus;
}
