import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { Profile } from './models';
import { RuntimeConfig } from './runtime-config';
import { CadState } from './cad-state';

const TOKEN_KEY = 'marvosa.token';

interface LoginResponse {
  accessToken: string;
  user: Profile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly config = inject(RuntimeConfig);
  private readonly state = inject(CadState);

  readonly token = signal(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<Profile | null>(null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  login(credentials: { username: string; password: string }) {
    return this.http.post<LoginResponse>(`${this.config.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        this.token.set(response.accessToken);
        this.user.set(response.user);
      }),
    );
  }

  refresh() {
    return this.http.get<Profile>(`${this.config.apiUrl}/auth/me`).pipe(tap((user) => this.user.set(user)));
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
    this.state.reset();
  }

  logout() {
    this.clear();
    void this.router.navigateByUrl('/login');
  }
}
