import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TagModule } from '@openng/optimus-ui/tag';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';
import { ToastModule } from '@openng/optimus-ui/toast';
import { AuthService } from '../core/auth.service';
import { CadState } from '../core/cad-state';
import { labelFor } from '../core/labels';
import { Realtime } from '../core/realtime';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, ButtonModule, TagModule, ToastModule, ConfirmDialogModule],
  templateUrl: './shell.html',
})
export class Shell implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly state = inject(CadState);
  readonly realtime = inject(Realtime);
  readonly now = signal(new Date());
  readonly dark = signal(document.documentElement.classList.contains('app-dark'));
  private clock = 0;

  readonly roleLabel = computed(() => labelFor(this.auth.user()?.role));
  readonly sections = computed(() => {
    const items = [
      { path: '/dashboard', label: 'Board', icon: 'pi pi-th-large' },
      { path: '/calls', label: 'Calls', icon: 'pi pi-phone' },
      { path: '/units', label: 'Units', icon: 'pi pi-users' },
      { path: '/bolos', label: 'BOLOs', icon: 'pi pi-flag' },
      { path: '/people', label: 'People', icon: 'pi pi-id-card' },
      { path: '/vehicles', label: 'Vehicles', icon: 'pi pi-car' },
      { path: '/warrants', label: 'Warrants', icon: 'pi pi-shield' },
    ];
    if (this.auth.isAdmin()) items.push({ path: '/staff', label: 'Staff', icon: 'pi pi-cog' });
    return items;
  });

  ngOnInit() {
    this.clock = window.setInterval(() => this.now.set(new Date()), 1000);
    this.auth.refresh().subscribe();
    this.state.load();
    this.realtime.connect();
  }

  ngOnDestroy() {
    window.clearInterval(this.clock);
    this.realtime.disconnect();
  }

  toggleTheme() {
    document.documentElement.classList.toggle('app-dark');
    const dark = document.documentElement.classList.contains('app-dark');
    this.dark.set(dark);
    localStorage.setItem('marvosa.theme', dark ? 'dark' : 'light');
  }

  clearPanic(id: string) {
    this.state.clearPanic(id).subscribe(() => this.state.load());
  }
}
