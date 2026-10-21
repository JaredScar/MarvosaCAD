import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { AuthService } from '../core/auth.service';
import { CadState } from '../core/cad-state';
import { DEPARTMENT_NAMES, callSeverity, labelFor, prioritySeverity } from '../core/labels';
import { Unit } from '../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, TableModule, TagModule, ButtonModule],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly state = inject(CadState);
  readonly auth = inject(AuthService);
  readonly labelFor = labelFor;
  readonly callSeverity = callSeverity;
  readonly prioritySeverity = prioritySeverity;
  readonly departmentName = DEPARTMENT_NAMES;

  callsigns(call: { assignments: { unit: { callsign: string } }[] }) {
    return call.assignments.length ? call.assignments.map((item) => item.unit.callsign).join(', ') : 'Unassigned';
  }

  readonly available = computed(() => this.state.units().filter((unit) => unit.status === 'available').length);
  readonly activeBolos = computed(() => this.state.bolos().filter((bolo) => bolo.active).length);
  readonly departments = computed(() => {
    const groups = new Map<string, Unit[]>();
    for (const unit of this.state.units()) {
      const list = groups.get(unit.department) ?? [];
      list.push(unit);
      groups.set(unit.department, list);
    }
    return [...groups.entries()];
  });
  readonly activity = computed(() =>
    this.state
      .calls()
      .flatMap((call) => call.notes.map((note) => ({ ...note, callNumber: call.number, callId: call.id, callTitle: call.title })))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 6),
  );
}
