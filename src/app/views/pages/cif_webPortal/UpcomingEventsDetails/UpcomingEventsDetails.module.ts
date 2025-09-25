import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { UpcomingEventsDetailsComponent } from './UpcomingEventsDetails';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { HomePageTopBarModule } from '../HomePage/HomePageTopBar/HomePageTopBar.module';

const routes: Routes = [
  {
    path: '',
    component: UpcomingEventsDetailsComponent,
  }
];

@NgModule({
  declarations: [
    UpcomingEventsDetailsComponent,  
  ],
  imports: [
    CommonModule,                  
    RouterModule.forChild(routes),
    NgbNavModule,
    HomePageTopBarModule
  ]
})
export class UpcomingEventsDetailsModule { }
