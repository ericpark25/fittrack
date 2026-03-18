export type MuscleGroup = 'CHEST' | 'BACK' | 'SHOULDERS' | 'ARMS' | 'LEGS' | 'CORE' | 'FULL_BODY';

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup: MuscleGroup;
  global: boolean;
  createdByUsername?: string;
}

export interface ExerciseRequest {
  name: string;
  description?: string;
  muscleGroup: MuscleGroup;
}
