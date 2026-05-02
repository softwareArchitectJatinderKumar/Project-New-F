import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { HomePageComponent } from './HomePage.component';
import {  FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ArchwizardModule } from 'angular-archwizard';
// import { NgbCollapseModule, NgbModule, NgbNav, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbCarouselModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomePageTopBarModule } from "./HomePageTopBar/HomePageTopBar.module";
import { UpcomingEventsModule } from "../UpcomingEvents/UpcomingEvents.module";
import { FixedHomePageComponent } from './FixedHomePage';

const routes: Routes = [
  {
    path: '',
    component: FixedHomePageComponent, 
  }
]
@NgModule({
  declarations: [FixedHomePageComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgxDatatableModule,
    FormsModule,
    ArchwizardModule, ReactiveFormsModule,
    PerfectScrollbarModule,
    NgbModule,
    NgbCarouselModule,
    HomePageTopBarModule,
    UpcomingEventsModule
],
})
export class FixedHomePageComponentModule { }
