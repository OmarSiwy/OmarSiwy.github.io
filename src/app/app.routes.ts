import { Routes } from '@angular/router';

/*
 * For Navigation Purposes:
 */
export const RouteNames = [
  'home',
  'about',
  'skills',
  'experience',
  'projects'
];

export const routes: Routes = [
  { path: 'home', loadChildren: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'about', loadChildren: () => import('./about/about.component').then(m => m.AboutComponent) },
  { path: 'skills', loadChildren: () => import('./skills/skills.component').then(m => m.SkillsComponent) },
  { path: 'experience', loadChildren: () => import('./experience/experience.component').then(m => m.ExperienceComponent) },
  { path: 'projects', loadChildren: () => import('./projects/projects.component').then(m => m.ProjectsComponent) },

  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
