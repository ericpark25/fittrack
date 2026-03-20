import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to workouts (guard will redirect to /login if not authenticated)
  { path: '', redirectTo: 'workouts', pathMatch: 'full' },

  // Public routes — no auth required
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },

  // Protected routes — auth guard redirects to /login if no token
  { path: 'workouts', loadComponent: () => import('./features/workouts/workout-list/workout-list.component').then(m => m.WorkoutListComponent), canActivate: [authGuard] },
  { path: 'workouts/:id', loadComponent: () => import('./features/workouts/workout-detail/workout-detail.component').then(m => m.WorkoutDetailComponent), canActivate: [authGuard] },
  { path: 'exercises', loadComponent: () => import('./features/exercises/exercise-list/exercise-list.component').then(m => m.ExerciseListComponent), canActivate: [authGuard] },

  // Fallback — redirect unknown paths to workouts
  { path: '**', redirectTo: 'workouts' }
];
