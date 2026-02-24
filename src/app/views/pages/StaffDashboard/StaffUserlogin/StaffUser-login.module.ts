import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StaffUserLoginComponent } from './StaffUser-login.component';
import { NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgSelectModule } from '@ng-select/ng-select';
import { StaffMenuModule } from '../StaffMenu/StaffMenu.module';
import { HomePageTopBarModule } from "../../cif_webPortal/HomePage/HomePageTopBar/HomePageTopBar.module"; 
const routes: Routes = [
  {
    path: '',
    component: StaffUserLoginComponent  
  }
];

@NgModule({
  declarations: [
    StaffUserLoginComponent  
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
    StaffMenuModule,
    HomePageTopBarModule
]
})
export class StaffUserLoginModule {}