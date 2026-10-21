import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { FluidModule } from '@openng/optimus-ui/fluid';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { CadState } from '../core/cad-state';
import { CALL_STATUSES, CALL_TYPES, callSeverity, labelFor, prioritySeverity } from '../core/labels';

@Component({
  selector: 'app-calls',
  imports: [DatePipe, RouterLink, FormsModule, ReactiveFormsModule, TableModule, TagModule, ButtonModule, DialogModule, FluidModule, InputTextModule, TextareaModule, SelectModule, IconFieldModule, InputIconModule],
  templateUrl: './calls.html',
})
export class CallsPage {
  readonly state = inject(CadState);
  private readonly messages = inject(MessageService);
  readonly labelFor = labelFor;
  readonly callSeverity = callSeverity;
  readonly prioritySeverity = prioritySeverity;
  readonly callTypes = CALL_TYPES;
  readonly statuses = [{ label: 'All statuses', value: 'all' }, ...CALL_STATUSES];
  readonly priorities = [
    { label: 'Priority 1 — emergency', value: 1 },
    { label: 'Priority 2 — urgent', value: 2 },
    { label: 'Priority 3 — routine', value: 3 },
  ];

  readonly query = signal('');
  readonly status = signal('all');
  visible = false;
  busy = false;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.state.calls().filter((call) => {
      if (this.status() !== 'all' && call.status !== this.status()) return false;
      if (!q) return true;
      return `${call.number} ${call.title} ${call.location} ${call.caller ?? ''} ${call.type}`.toLowerCase().includes(q);
    });
  });

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl('911', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl(2, { nonNullable: true, validators: [Validators.required] }),
    location: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    postal: new FormControl('', { nonNullable: true }),
    caller: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  callsigns(call: { assignments: { unit: { callsign: string } }[] }) {
    return call.assignments.length ? call.assignments.map((item) => item.unit.callsign).join(', ') : 'Unassigned';
  }

  onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  openCreate() {
    this.form.reset({ title: '', type: '911', priority: 2, location: '', postal: '', caller: '', description: '' });
    this.visible = true;
  }

  save() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    const value = this.form.getRawValue();
    this.state
      .createCall({ ...value, postal: value.postal || undefined, caller: value.caller || undefined })
      .subscribe({
        next: (call) => {
          this.busy = false;
          this.visible = false;
          this.messages.add({ severity: 'success', summary: `Call #${call.number} opened`, detail: call.title });
        },
        error: () => {
          this.busy = false;
        },
      });
  }
}
