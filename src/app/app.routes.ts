import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home';
import { CustomerDashboardComponent } from './pages/customer-dashboard/customer-dashboard';
import { ProfileComponent } from './pages/profile/profile';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'dashboard', component: CustomerDashboardComponent },
  { path: 'profile', component: ProfileComponent },

  { path: 'forgot-password', component: ForgotPasswordComponent }
];