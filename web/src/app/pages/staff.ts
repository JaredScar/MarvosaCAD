import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { FluidModule } from '@openng/optimus-ui/fluid';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { PasswordModule } from '@openng/optimus-ui/password';
import { SelectModule } from '@openng/optimus-ui/select';
import { TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { AuthService } from '../core/auth.service';
import { labelFor } from '../core/labels';
import { StaffUser } from '../core/models';
import { StaffApi } from '../core/staff';

@Component({
  selector: 'app-staff',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, TableModule, TagModule, ButtonModule, DialogModule, FluidModule, InputTextModule, PasswordModule, SelectModule],
  templateUrl: './staff.html',
})
export class StaffPage implements OnInit {
  private readonly staff = inject(StaffApi);
  private readonly messages = inject(MessageService);
  readonly auth = inject(AuthService);
  readonly labelFor = labelFor;
  readonly accounts = signal<StaffUser[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly resetting = signal<StaffUser | null>(null);
  readonly busy = signal(false);
  readonly roles = [
    { label: 'Administrator', value: 'admin' },
    { label: 'Dispatcher', value: 'dispatcher' },
    { label: 'Officer', value: 'officer' },
  ];
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl('dispatcher', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  readonly passwordForm = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.staff.list().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Staff', detail: this.describe(err) });
      },
    });
  }

  openCreate() {
    this.form.reset({ name: '', username: '', role: 'dispatcher', password: '' });
    this.creating.set(true);
  }

  create() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.staff.create(this.form.getRawValue()).subscribe({
      next: (account) => {
        this.busy.set(false);
        this.creating.set(false);
        this.accounts.update((list) => [...list, account].sort((a, b) => a.name.localeCompare(b.name)));
        this.messages.add({ severity: 'success', summary: `${account.username} can sign in` });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.messages.add({ severity: 'error', summary: 'Staff', detail: this.describe(err) });
      },
    });
  }

  setRole(account: StaffUser, role: string) {
    if (role === account.role) return;
    this.staff.update(account.id, { role }).subscribe({
      next: (updated) => this.replace(updated),
      error: (err: unknown) => {
        this.messages.add({ severity: 'error', summary: 'Staff', detail: this.describe(err) });
        this.reload();
      },
    });
  }

  toggle(account: StaffUser) {
    this.staff.update(account.id, { active: !account.active }).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.messages.add({ severity: 'success', summary: updated.active ? `${updated.username} can sign in` : `${updated.username} is disabled` });
      },
      error: (err: unknown) => this.messages.add({ severity: 'error', summary: 'Staff', detail: this.describe(err) }),
    });
  }

  openReset(account: StaffUser) {
    this.resetting.set(account);
    this.passwordForm.reset({ password: '' });
  }

  resetPassword() {
    const account = this.resetting();
    if (!account || this.passwordForm.invalid || this.busy()) return;
    this.busy.set(true);
    this.staff.update(account.id, { password: this.passwordForm.getRawValue().password }).subscribe({
      next: () => {
        this.busy.set(false);
        this.resetting.set(null);
        this.messages.add({ severity: 'success', summary: `Password updated for ${account.username}` });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.messages.add({ severity: 'error', summary: 'Staff', detail: this.describe(err) });
      },
    });
  }

  private replace(updated: StaffUser) {
    this.accounts.update((list) => list.map((account) => (account.id === updated.id ? updated : account)));
  }

  private describe(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      const message: unknown = err.error?.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(' ');
    }
    return 'The request failed.';
  }
}
