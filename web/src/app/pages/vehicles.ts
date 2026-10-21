import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { FluidModule } from '@openng/optimus-ui/fluid';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { CadState } from '../core/cad-state';
import { RECORD_STATES, labelFor, splitFlags } from '../core/labels';
import { Vehicle } from '../core/models';

@Component({
  selector: 'app-vehicles',
  imports: [ReactiveFormsModule, TableModule, TagModule, ButtonModule, DialogModule, FluidModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './vehicles.html',
})
export class VehiclesPage {
  readonly state = inject(CadState);
  private readonly messages = inject(MessageService);
  readonly labelFor = labelFor;
  readonly splitFlags = splitFlags;
  readonly states = RECORD_STATES;
  readonly query = signal('');
  visible = false;
  busy = false;
  editing: Vehicle | null = null;

  readonly owners = computed(() => [
    { label: 'No owner on file', value: '' },
    ...this.state.people().map((person) => ({ label: `${person.lastName}, ${person.firstName}`, value: person.id })),
  ]);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.state.vehicles().filter((vehicle) => {
      const owner = `${vehicle.owner?.firstName ?? ''} ${vehicle.owner?.lastName ?? ''}`;
      return !q || `${vehicle.plate} ${vehicle.model} ${vehicle.color} ${owner} ${vehicle.flags ?? ''}`.toLowerCase().includes(q);
    });
  });

  readonly form = new FormGroup({
    plate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    model: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    color: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ownerId: new FormControl('', { nonNullable: true }),
    insurance: new FormControl('valid', { nonNullable: true, validators: [Validators.required] }),
    registration: new FormControl('valid', { nonNullable: true, validators: [Validators.required] }),
    flags: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  openCreate() {
    this.editing = null;
    this.form.controls.plate.enable();
    this.form.reset({ plate: '', model: '', color: '', ownerId: '', insurance: 'valid', registration: 'valid', flags: '', notes: '' });
    this.visible = true;
  }

  openEdit(vehicle: Vehicle) {
    this.editing = vehicle;
    this.form.reset({
      plate: vehicle.plate,
      model: vehicle.model,
      color: vehicle.color,
      ownerId: vehicle.ownerId ?? '',
      insurance: vehicle.insurance,
      registration: vehicle.registration,
      flags: vehicle.flags ?? '',
      notes: vehicle.notes ?? '',
    });
    this.form.controls.plate.disable();
    this.visible = true;
  }

  save() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    const editing = this.editing;
    const value = this.form.getRawValue();
    const request = editing
      ? this.state.updateVehicle(editing.id, {
          model: value.model,
          color: value.color,
          ownerId: value.ownerId || null,
          insurance: value.insurance,
          registration: value.registration,
          flags: value.flags,
          notes: value.notes,
        })
      : this.state.createVehicle({ ...value, ownerId: value.ownerId || undefined });
    request.subscribe({
      next: () => {
        this.busy = false;
        this.visible = false;
        this.messages.add({ severity: 'success', summary: editing ? 'Vehicle updated' : 'Vehicle added' });
      },
      error: () => {
        this.busy = false;
      },
    });
  }
}
