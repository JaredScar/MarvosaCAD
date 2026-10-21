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
import { LICENSES, labelFor, splitFlags } from '../core/labels';
import { Person } from '../core/models';

@Component({
  selector: 'app-people',
  imports: [ReactiveFormsModule, TableModule, TagModule, ButtonModule, DialogModule, FluidModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './people.html',
})
export class PeoplePage {
  readonly state = inject(CadState);
  private readonly messages = inject(MessageService);
  readonly labelFor = labelFor;
  readonly splitFlags = splitFlags;
  readonly licenses = LICENSES;
  readonly genders = [
    { label: 'Female', value: 'female' },
    { label: 'Male', value: 'male' },
    { label: 'Unspecified', value: 'unspecified' },
  ];
  readonly query = signal('');
  visible = false;
  busy = false;
  editing: Person | null = null;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.state.people().filter((person) => !q || `${person.firstName} ${person.lastName} ${person.phone ?? ''} ${person.address ?? ''}`.toLowerCase().includes(q));
  });

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dob: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gender: new FormControl('unspecified', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    license: new FormControl('valid', { nonNullable: true, validators: [Validators.required] }),
    flags: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  warrantsFor(personId: string) {
    return this.state.warrants().filter((warrant) => warrant.personId === personId && warrant.active);
  }

  onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  openCreate() {
    this.editing = null;
    this.form.reset({ firstName: '', lastName: '', dob: '', gender: 'unspecified', phone: '', address: '', license: 'valid', flags: '', notes: '' });
    this.visible = true;
  }

  openEdit(person: Person) {
    this.editing = person;
    this.form.reset({
      firstName: person.firstName,
      lastName: person.lastName,
      dob: person.dob,
      gender: person.gender || 'unspecified',
      phone: person.phone ?? '',
      address: person.address ?? '',
      license: person.license,
      flags: person.flags ?? '',
      notes: person.notes ?? '',
    });
    this.visible = true;
  }

  save() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    const editing = this.editing;
    const request = editing ? this.state.updatePerson(editing.id, this.form.getRawValue()) : this.state.createPerson(this.form.getRawValue());
    request.subscribe({
      next: () => {
        this.busy = false;
        this.visible = false;
        this.messages.add({ severity: 'success', summary: editing ? 'Record updated' : 'Person added' });
      },
      error: () => {
        this.busy = false;
      },
    });
  }
}
