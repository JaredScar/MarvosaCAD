import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
import { Socket, io } from 'socket.io-client';
import { AuthService } from './auth.service';
import { CadState } from './cad-state';
import { Bolo, Call, LiveEvent, PanicAlert, Person, Unit, Vehicle, Warrant } from './models';
import { RuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class Realtime {
  private readonly auth = inject(AuthService);
  private readonly state = inject(CadState);
  private readonly config = inject(RuntimeConfig);
  private readonly messages = inject(MessageService);
  private socket: Socket | null = null;

  readonly connected = signal(false);

  connect() {
    this.disconnect();
    const token = this.auth.token();
    if (!token) return;
    const socket = io(this.config.wsUrl, { auth: { token } });
    this.socket = socket;
    socket.on('connect', () => this.connected.set(true));
    socket.on('disconnect', () => this.connected.set(false));
    socket.on('call', (event: LiveEvent<Call>) => {
      this.state.applyCall(event);
      if (event.reason === 'create' && event.actorId !== this.auth.user()?.id) {
        this.messages.add({
          severity: event.data.priority === 1 ? 'error' : 'info',
          summary: `New call #${event.data.number}`,
          detail: event.data.title,
        });
      }
    });
    socket.on('unit', (event: LiveEvent<Unit>) => this.state.applyUnit(event));
    socket.on('bolo', (event: LiveEvent<Bolo>) => this.state.applyBolo(event));
    socket.on('person', (event: LiveEvent<Person>) => this.state.applyPerson(event));
    socket.on('vehicle', (event: LiveEvent<Vehicle>) => this.state.applyVehicle(event));
    socket.on('warrant', (event: LiveEvent<Warrant>) => this.state.applyWarrant(event));
    socket.on('panic', (event: LiveEvent<PanicAlert>) => {
      this.state.applyPanic(event);
      if (event.reason === 'panic') {
        this.messages.add({
          severity: 'error',
          summary: `Panic ${event.data.callsign}`,
          detail: event.data.location ?? event.data.message,
        });
      }
    });
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }
}
