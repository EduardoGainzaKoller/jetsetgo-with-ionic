import { Routes } from '@angular/router';
import {RegisterPage} from "./pages/register/register.page";
import {HomePage} from "./pages/home/home.page";

export const routes: Routes = [
  { path: '', component: RegisterPage },
  { path:'home', component: HomePage },
  { path: 'register', component: RegisterPage },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites.page').then( m => m.FavouritesPage)
  },
];
