import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { FluidModule } from '@openng/optimus-ui/fluid';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { TagModule } from '@openng/optimus-ui/tag';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { CadState } from '../core/cad-state';
import { BOLO_KINDS, BOLO_RISKS, labelFor, riskSeverity } from '../core/labels';

@Component({
  selector: 'app-bolos',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, FluidModule, InputTextModule, TextareaModule, SelectModule, TagModule],
  templateUrl: './bolos.html',
})
export class BolosPage {
  readonly state = inject(CadState);
  private readonly messages = inject(MessageService);
  readonly labelFor = labelFor;
  readonly riskSeverity = riskSeverity;
  readonly kinds = BOLO_KINDS;
  readonly risks = BOLO_RISKS;
  readonly show = signal('active');
  readonly filters = [
    { label: 'Active', value: 'active' },
    { label: 'All', value: 'all' },
  ];
  visible = false;
  busy = false;

  readonly visibleBolos = computed(() => this.state.bolos().filter((bolo) => this.show() === 'all' || bolo.active));

  readonly form = new FormGroup({
    kind: new FormControl('person', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    subject: new FormControl('', { nonNullable: true }),
    plate: new FormControl('', { nonNullable: true }),
    risk: new FormControl('high', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  openCreate() {
    this.form.reset({ kind: 'person', title: '', subject: '', plate: '', risk: 'high', description: '' });
    this.visible = true;
  }

  save() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    const value = this.form.getRawValue();
    this.state.createBolo({ ...value, subject: value.subject || undefined, plate: value.plate || undefined }).subscribe({
      next: () => {
        this.busy = false;
        this.visible = false;
        this.messages.add({ severity: 'success', summary: 'BOLO broadcast' });
      },
      error: () => {
        this.busy = false;
      },
    });
  }

  clear(id: string) {
    this.state.updateBolo(id, { active: false }).subscribe(() => this.messages.add({ severity: 'success', summary: 'BOLO cleared' }));
  }
}
