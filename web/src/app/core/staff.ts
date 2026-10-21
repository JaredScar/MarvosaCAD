import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StaffUser } from './models';
import { RuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class StaffApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfig);

  list() {
    return this.http.get<StaffUser[]>(`${this.config.apiUrl}/users`);
  }

  create(body: { username: string; name: string; password: string; role: string }) {
    return this.http.post<StaffUser>(`${this.config.apiUrl}/users`, body);
  }

  update(id: string, body: { name?: string; password?: string; role?: string; active?: boolean }) {
    return this.http.patch<StaffUser>(`${this.config.apiUrl}/users/${id}`, body);
  }
}
