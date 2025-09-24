import { SecurePasswordChangeComponent } from './SecurePasswordChange.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {  FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ArchwizardModule } from 'angular-archwizard';
import { MatSelectModule } from "@angular/material/select";
import { CifMenuBarModule } from '../cif-menu-bar/cif-menu-bar.module';

const routes: Routes = [
  {
    path: '',
    component: SecurePasswordChangeComponent, 
  }
]
@NgModule({
  declarations: [SecurePasswordChangeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgxDatatableModule,
    FormsModule,
    ArchwizardModule,
    ReactiveFormsModule,
    PerfectScrollbarModule,
    NgbModule,
    MatSelectModule,        
    CifMenuBarModule // Include the menu bar module
],
})
export class SecurePasswordChangeComponentModule { }
