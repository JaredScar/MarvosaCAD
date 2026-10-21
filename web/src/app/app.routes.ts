import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth.guard';
import { Shell } from './layout/shell';
import { BolosPage } from './pages/bolos';
import { CallDetailPage } from './pages/call-detail';
import { CallsPage } from './pages/calls';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';
import { PeoplePage } from './pages/people';
import { StaffPage } from './pages/staff';
import { UnitsPage } from './pages/units';
import { VehiclesPage } from './pages/vehicles';
import { WarrantsPage } from './pages/warrants';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPage },
      { path: 'calls', component: CallsPage },
      { path: 'calls/:id', component: CallDetailPage },
      { path: 'units', component: UnitsPage },
      { path: 'bolos', component: BolosPage },
      { path: 'people', component: PeoplePage },
      { path: 'vehicles', component: VehiclesPage },
      { path: 'warrants', component: WarrantsPage },
      { path: 'staff', component: StaffPage, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
