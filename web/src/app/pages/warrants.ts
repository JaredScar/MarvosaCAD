import { DatePipe } from '@angular/common';
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
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { CadState } from '../core/cad-state';

@Component({
  selector: 'app-warrants',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, TableModule, TagModule, ButtonModule, DialogModule, FluidModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './warrants.html',
})
export class WarrantsPage {
  readonly state = inject(CadState);
  private readonly messages = inject(MessageService);
  readonly show = signal('active');
  readonly filters = [
    { label: 'Active', value: 'active' },
    { label: 'All', value: 'all' },
  ];
  visible = false;
  busy = false;

  readonly people = computed(() => this.state.people().map((person) => ({ label: `${person.lastName}, ${person.firstName}`, value: person.id })));
  readonly rows = computed(() => this.state.warrants().filter((warrant) => this.show() === 'all' || warrant.active));

  readonly form = new FormGroup({
    personId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    charge: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    issuedBy: new FormControl('LSPD', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  openCreate() {
    this.form.reset({ personId: '', charge: '', issuedBy: 'LSPD', notes: '' });
    this.visible = true;
  }

  save() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    this.state.createWarrant(this.form.getRawValue()).subscribe({
      next: () => {
        this.busy = false;
        this.visible = false;
        this.messages.add({ severity: 'success', summary: 'Warrant issued' });
      },
      error: () => {
        this.busy = false;
      },
    });
  }

  serve(id: string) {
    this.state.updateWarrant(id, { active: false }).subscribe(() => this.messages.add({ severity: 'success', summary: 'Warrant cleared' }));
  }
}
