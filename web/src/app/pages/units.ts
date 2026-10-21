import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { FluidModule } from '@openng/optimus-ui/fluid';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { AuthService } from '../core/auth.service';
import { CadState } from '../core/cad-state';
import { DEPARTMENTS, UNIT_STATUSES, UNIT_TYPES, callSeverity, labelFor } from '../core/labels';

@Component({
  selector: 'app-units',
  imports: [FormsModule, ReactiveFormsModule, TableModule, TagModule, ButtonModule, DialogModule, SelectModule, InputTextModule, FluidModule],
  templateUrl: './units.html',
})
export class UnitsPage {
  readonly state = inject(CadState);
  readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  readonly labelFor = labelFor;
  readonly callSeverity = callSeverity;
  readonly statuses = UNIT_STATUSES;
  readonly departments = DEPARTMENTS;
  readonly types = UNIT_TYPES;
  readonly query = signal('');
  visible = false;
  busy = false;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.state.units().filter((unit) => !q || `${unit.callsign} ${unit.officerName} ${unit.department} ${unit.location ?? ''}`.toLowerCase().includes(q));
  });

  readonly form = new FormGroup({
    callsign: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    officerName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    department: new FormControl('LSPD', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl('leo', { nonNullable: true, validators: [Validators.required] }),
    location: new FormControl('', { nonNullable: true }),
  });

  onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setStatus(id: string, status: string) {
    this.state.updateUnit(id, { status }).subscribe(() => {
      if (status === 'panic') this.state.load();
    });
  }

  openCreate() {
    this.form.reset({ callsign: '', officerName: '', department: 'LSPD', type: 'leo', location: '' });
    this.visible = true;
  }

  save() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    this.state.createUnit(this.form.getRawValue()).subscribe({
      next: (unit) => {
        this.busy = false;
        this.visible = false;
        this.messages.add({ severity: 'success', summary: `${unit.callsign} is on the board` });
      },
      error: () => {
        this.busy = false;
      },
    });
  }
}
