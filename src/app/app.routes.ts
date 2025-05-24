import { Routes } from '@angular/router';
import {RegisterPage} from "./pages/register/register.page";
import {HomePage} from "./pages/home/home.page";
import {LoginPage} from "./pages/login/login.page";

export const routes: Routes = [
  { path: '', component: LoginPage },
  { path:'home', component: HomePage },
  { path: 'register', component: RegisterPage },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites.page').then( m => m.FavouritesPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },

];
