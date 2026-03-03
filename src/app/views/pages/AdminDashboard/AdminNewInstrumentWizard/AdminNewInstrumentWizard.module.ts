import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FeatherIconModule } from 'src/app/core/feather-icon/feather-icon.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AdminNewInstrumentWizardComponent } from './AdminNewInstrumentWizard.component';
import { AdminDashboardModule } from "../AdminDashboard/AdminDashboard.module";

const routes: Routes = [
  {
    path: '',
    component: AdminNewInstrumentWizardComponent
  }
];

@NgModule({
  declarations: [
    AdminNewInstrumentWizardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    FeatherIconModule,
    NgbModule,
    AdminDashboardModule
]
})
export class AdminNewInstrumentWizardModule { }
