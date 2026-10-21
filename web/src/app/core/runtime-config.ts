import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RuntimeConfig {
  apiUrl = 'http://localhost:3000/api';
  wsUrl = 'http://localhost:3000';

  async load() {
    try {
      const response = await fetch('config.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { apiUrl?: string; wsUrl?: string };
      if (data.apiUrl) this.apiUrl = data.apiUrl.replace(/\/$/, '');
      if (data.wsUrl) this.wsUrl = data.wsUrl.replace(/\/$/, '');
    } catch {
      // The development defaults above are used when config.json cannot be read.
    }
  }
}
