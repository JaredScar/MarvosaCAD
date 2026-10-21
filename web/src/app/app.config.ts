import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';
import { definePreset } from '@openng/optimus-ui-themes';
import Aura from '@openng/optimus-ui-themes/aura';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { RuntimeConfig } from './core/runtime-config';

const Marvosa = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f2f7fc',
      100: '#e0edf8',
      200: '#c2daf0',
      300: '#93bfe4',
      400: '#5e9ed4',
      500: '#2f6fad',
      600: '#24598c',
      700: '#1d4a74',
      800: '#1a3d60',
      900: '#12283f',
      950: '#0c1a2b',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(RuntimeConfig).load()),
    provideOptimus({
      theme: {
        preset: Marvosa,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'optimus', order: 'theme, base, optimus' },
        },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};
