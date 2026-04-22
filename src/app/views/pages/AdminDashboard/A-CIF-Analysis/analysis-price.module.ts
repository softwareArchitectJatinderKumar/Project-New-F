import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { AnalysisPriceComponent } from './analysis-price.component';
import { AdminDashboardModule }   from '../AdminDashboard/AdminDashboard.module';

const routes: Routes = [
  { path: '', component: AnalysisPriceComponent }
];

@NgModule({
  declarations: [
    AnalysisPriceComponent,
  ],
  imports: [
    CommonModule,                       // *ngIf, *ngFor, [ngClass]
    FormsModule,                        // [(ngModel)], NgForm, template-driven validation
  ReactiveFormsModule,                // formGroup, FormBuilder (reactive forms)
    NgbModalModule,                     // NgbModal for Add Analysis / Add Price modals
    AdminDashboardModule,               // <app-AdminDashboard> menu bar
    RouterModule.forChild(routes),      // lazy child route
  ],
})
export class AnalysisPriceModule { }
