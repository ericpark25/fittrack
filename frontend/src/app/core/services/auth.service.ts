import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = 'http://localhost:8080/api/auth';

  // Token stored in memory only — not in localStorage (more secure, lost on page refresh by design)
  private token: string | null = null;

  // Signal that holds the currently logged-in username — components can react to this
  currentUsername = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  // Sends login credentials and stores the returned token in memory
  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.API}/login`, request).pipe(
      tap(response => this.storeAuth(response))
    );
  }

  // Sends registration data and stores the returned token (user is logged in immediately)
  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.API}/register`, request).pipe(
      tap(response => this.storeAuth(response))
    );
  }

  // Clears the token and username, then redirects to login
  logout() {
    this.token = null;
    this.currentUsername.set(null);
    this.router.navigate(['/login']);
  }

  // Returns the raw JWT string — used by the interceptor to build the Authorization header
  getToken(): string | null {
    return this.token;
  }

  // Returns true if a token exists — used by the auth guard to protect routes
  isLoggedIn(): boolean {
    return this.token !== null;
  }

  // Stores the token and username after a successful login or register
  private storeAuth(response: AuthResponse) {
    this.token = response.token;
    this.currentUsername.set(response.username);
  }
}
