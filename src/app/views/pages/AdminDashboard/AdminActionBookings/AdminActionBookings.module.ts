import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminActionBookingsComponent } from './AdminActionBookings.component';
import { NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgSelectModule } from '@ng-select/ng-select';
import { AdminDashboardModule } from '../AdminDashboard/AdminDashboard.module'; // Import the menu bar module

const routes: Routes = [
  {
    path: '',
    component: AdminActionBookingsComponent 
  }
];

@NgModule({
  declarations: [
    AdminActionBookingsComponent  
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbModule,
    PerfectScrollbarModule,
    NgSelectModule,
    AdminDashboardModule  
  ]
})
export class AdminActionBookingsModule {}