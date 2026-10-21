import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
import { Observable, catchError, forkJoin, tap, throwError } from 'rxjs';
import { Bolo, Call, LiveEvent, PanicAlert, Person, Unit, Vehicle, Warrant } from './models';
import { RuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class CadState {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfig);
  private readonly messages = inject(MessageService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly calls = signal<Call[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly bolos = signal<Bolo[]>([]);
  readonly people = signal<Person[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly warrants = signal<Warrant[]>([]);
  readonly panics = signal<PanicAlert[]>([]);
  readonly activePanics = computed(() => this.panics().filter((alert) => alert.active));
  readonly openCalls = computed(() => this.calls().filter((call) => call.status !== 'closed'));

  load() {
    this.loading.set(true);
    this.error.set('');
    const api = this.config.apiUrl;
    forkJoin({
      calls: this.http.get<Call[]>(`${api}/calls`),
      units: this.http.get<Unit[]>(`${api}/units`),
      bolos: this.http.get<Bolo[]>(`${api}/bolos`),
      people: this.http.get<Person[]>(`${api}/people`),
      vehicles: this.http.get<Vehicle[]>(`${api}/vehicles`),
      warrants: this.http.get<Warrant[]>(`${api}/warrants`),
      panics: this.http.get<PanicAlert[]>(`${api}/panic`),
    }).subscribe({
      next: (data) => {
        this.calls.set(data.calls);
        this.units.set(data.units);
        this.bolos.set(data.bolos);
        this.people.set(data.people);
        this.vehicles.set(data.vehicles);
        this.warrants.set(data.warrants);
        this.panics.set(data.panics);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.describe(err));
      },
    });
  }

  reset() {
    this.calls.set([]);
    this.units.set([]);
    this.bolos.set([]);
    this.people.set([]);
    this.vehicles.set([]);
    this.warrants.set([]);
    this.panics.set([]);
    this.error.set('');
  }

  applyCall(event: LiveEvent<Call>) {
    this.upsert(this.calls, event.data, (a, b) => b.number - a.number);
  }

  applyUnit(event: LiveEvent<Unit>) {
    this.upsert(this.units, event.data, (a, b) => a.callsign.localeCompare(b.callsign));
  }

  applyBolo(event: LiveEvent<Bolo>) {
    this.upsert(this.bolos, event.data, (a, b) => Number(b.active) - Number(a.active));
  }

  applyPanic(event: LiveEvent<PanicAlert>) {
    this.upsert(this.panics, event.data, (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  applyPerson(event: LiveEvent<Person>) {
    this.upsert(this.people, event.data, (a, b) => a.lastName.localeCompare(b.lastName));
  }

  applyVehicle(event: LiveEvent<Vehicle>) {
    this.upsert(this.vehicles, event.data, (a, b) => a.plate.localeCompare(b.plate));
  }

  applyWarrant(event: LiveEvent<Warrant>) {
    this.upsert(this.warrants, event.data, (a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt));
  }

  createCall(body: unknown) {
    return this.mutate(this.http.post<Call>(`${this.config.apiUrl}/calls`, body), (call) => this.applyCall({ action: 'upsert', data: call }));
  }

  updateCall(id: string, body: unknown) {
    return this.mutate(this.http.patch<Call>(`${this.config.apiUrl}/calls/${id}`, body), (call) => this.applyCall({ action: 'upsert', data: call }));
  }

  addNote(id: string, body: string) {
    return this.mutate(this.http.post<Call>(`${this.config.apiUrl}/calls/${id}/notes`, { body }), (call) =>
      this.applyCall({ action: 'upsert', data: call }),
    );
  }

  assign(id: string, unitId: string) {
    return this.mutate(this.http.post<Call>(`${this.config.apiUrl}/calls/${id}/assignments`, { unitId }), (call) =>
      this.applyCall({ action: 'upsert', data: call }),
    );
  }

  unassign(id: string, unitId: string) {
    return this.mutate(this.http.delete<Call>(`${this.config.apiUrl}/calls/${id}/assignments/${unitId}`), (call) =>
      this.applyCall({ action: 'upsert', data: call }),
    );
  }

  createUnit(body: unknown) {
    return this.mutate(this.http.post<Unit>(`${this.config.apiUrl}/units`, body), (unit) => this.applyUnit({ action: 'upsert', data: unit }));
  }

  updateUnit(id: string, body: unknown) {
    return this.mutate(this.http.patch<Unit>(`${this.config.apiUrl}/units/${id}`, body), (unit) => this.applyUnit({ action: 'upsert', data: unit }));
  }

  createBolo(body: unknown) {
    return this.mutate(this.http.post<Bolo>(`${this.config.apiUrl}/bolos`, body), (bolo) => this.applyBolo({ action: 'upsert', data: bolo }));
  }

  updateBolo(id: string, body: unknown) {
    return this.mutate(this.http.patch<Bolo>(`${this.config.apiUrl}/bolos/${id}`, body), (bolo) => this.applyBolo({ action: 'upsert', data: bolo }));
  }

  createPerson(body: unknown) {
    return this.mutate(this.http.post<Person>(`${this.config.apiUrl}/people`, body), (person) =>
      this.applyPerson({ action: 'upsert', data: person }),
    );
  }

  updatePerson(id: string, body: unknown) {
    return this.mutate(this.http.patch<Person>(`${this.config.apiUrl}/people/${id}`, body), (person) =>
      this.applyPerson({ action: 'upsert', data: person }),
    );
  }

  createVehicle(body: unknown) {
    return this.mutate(this.http.post<Vehicle>(`${this.config.apiUrl}/vehicles`, body), (vehicle) =>
      this.applyVehicle({ action: 'upsert', data: vehicle }),
    );
  }

  updateVehicle(id: string, body: unknown) {
    return this.mutate(this.http.patch<Vehicle>(`${this.config.apiUrl}/vehicles/${id}`, body), (vehicle) =>
      this.applyVehicle({ action: 'upsert', data: vehicle }),
    );
  }

  createWarrant(body: unknown) {
    return this.mutate(this.http.post<Warrant>(`${this.config.apiUrl}/warrants`, body), (warrant) =>
      this.applyWarrant({ action: 'upsert', data: warrant }),
    );
  }

  updateWarrant(id: string, body: unknown) {
    return this.mutate(this.http.patch<Warrant>(`${this.config.apiUrl}/warrants/${id}`, body), (warrant) =>
      this.applyWarrant({ action: 'upsert', data: warrant }),
    );
  }

  clearPanic(id: string) {
    return this.mutate(this.http.post<PanicAlert>(`${this.config.apiUrl}/panic/${id}/clear`, {}), (alert) =>
      this.applyPanic({ action: 'upsert', data: alert }),
    );
  }

  private mutate<T>(source: Observable<T>, apply: (value: T) => void) {
    return source.pipe(
      tap(apply),
      catchError((err: unknown) => {
        this.messages.add({ severity: 'error', summary: 'CAD', detail: this.describe(err) });
        return throwError(() => err);
      }),
    );
  }

  private upsert<T extends { id: string }>(target: { update: (fn: (list: T[]) => T[]) => void }, item: T, compare: (a: T, b: T) => number) {
    target.update((list) => {
      const exists = list.some((entry) => entry.id === item.id);
      const next = exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
      return [...next].sort(compare);
    });
  }

  private describe(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'The API is not reachable.';
      const message: unknown = err.error?.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(' ');
    }
    return 'The request failed.';
  }
}
