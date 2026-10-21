import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { PasswordModule } from '@openng/optimus-ui/password';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  busy = false;
  error = '';

  readonly form = new FormGroup({
    username: new FormControl('dispatch', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('marvosa', { nonNullable: true, validators: [Validators.required] }),
  });

  submit() {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    this.error = '';
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.busy = false;
        void this.router.navigateByUrl('/dashboard');
      },
      error: (err: unknown) => {
        this.busy = false;
        if (err instanceof HttpErrorResponse && err.status === 0) {
          this.error = 'The API is not running on port 3000.';
          return;
        }
        const message = err instanceof HttpErrorResponse ? err.error?.message : undefined;
        this.error = typeof message === 'string' ? message : 'Those credentials were not accepted.';
      },
    });
  }
}
