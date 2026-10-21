import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectModule } from '@openng/optimus-ui/select';
import { TagModule } from '@openng/optimus-ui/tag';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { map } from 'rxjs';
import { CadState } from '../core/cad-state';
import { CALL_STATUSES, callSeverity, labelFor, prioritySeverity } from '../core/labels';

@Component({
  selector: 'app-call-detail',
  imports: [DatePipe, RouterLink, FormsModule, ButtonModule, SelectModule, TagModule, TextareaModule],
  templateUrl: './call-detail.html',
})
export class CallDetailPage {
  readonly state = inject(CadState);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))));

  readonly labelFor = labelFor;
  readonly callSeverity = callSeverity;
  readonly prioritySeverity = prioritySeverity;
  readonly statuses = CALL_STATUSES;
  note = '';
  selectedUnit: string | null = null;
  busy = false;

  readonly call = computed(() => this.state.calls().find((item) => item.id === this.id()) ?? null);
  readonly unitOptions = computed(() => {
    const taken = new Set(this.call()?.assignments.map((item) => item.unitId) ?? []);
    return this.state
      .units()
      .filter((unit) => !taken.has(unit.id) && unit.status !== 'offduty')
      .map((unit) => ({ label: `${unit.callsign} · ${unit.officerName}`, value: unit.id }));
  });

  setStatus(status: string) {
    const call = this.call();
    if (!call || status === call.status) return;
    this.state.updateCall(call.id, { status }).subscribe(() => {
      this.messages.add({ severity: 'success', summary: `Call #${call.number}`, detail: `Status is now ${labelFor(status)}` });
    });
  }

  assign() {
    const call = this.call();
    if (!call || !this.selectedUnit) return;
    this.state.assign(call.id, this.selectedUnit).subscribe(() => {
      this.selectedUnit = null;
      this.messages.add({ severity: 'success', summary: 'Unit attached' });
    });
  }

  release(unitId: string) {
    const call = this.call();
    if (!call) return;
    this.state.unassign(call.id, unitId).subscribe();
  }

  addNote() {
    const call = this.call();
    const body = this.note.trim();
    if (!call || !body || this.busy) return;
    this.busy = true;
    this.state.addNote(call.id, body).subscribe({
      next: () => {
        this.note = '';
        this.busy = false;
      },
      error: () => {
        this.busy = false;
      },
    });
  }

  closeCall() {
    const call = this.call();
    if (!call) return;
    this.confirm.confirm({
      header: 'Close call',
      message: `Close #${call.number} ${call.title}?`,
      accept: () => this.setStatus('closed'),
    });
  }
}
