import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { NgbModule, NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
// Ng-ApexCharts
import { ReactiveFormsModule } from '@angular/forms';
import {  OurTermsConditionsComponent } from './OurTermsConditions.component';
import {} from './OurTermsConditions.component'
 




import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
// Ng-select
import { CifMenuBarModule } from '../cif-menu-bar/cif-menu-bar.module';
import { HomePageTopBarComponent } from '../../cif_webPortal/HomePage/HomePageTopBar/HomePageTopBar.component';
import { HomePageTopBarModule } from "../../cif_webPortal/HomePage/HomePageTopBar/HomePageTopBar.module";

const routes: Routes = [
  {
    path: '',
    component: OurTermsConditionsComponent
  }
]
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};
@NgModule({
  declarations: [OurTermsConditionsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PerfectScrollbarModule,
    NgbModule,
    ReactiveFormsModule,
    CifMenuBarModule,
    HomePageTopBarModule
],
  providers: [
    NgbRatingConfig,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class OurTermsConditionsModule { }
// Added by Jatinder Kumar 31309






// const routes: Routes = [
//   {
//     path: '',
//     component: OurTermsConditionsComponent
//   }
// ]
// const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
//   suppressScrollX: true
// };
// @NgModule({
//   declarations: [OurTermsConditionsComponent],
//   imports: [
//     CommonModule,
//     RouterModule.forChild(routes),
//     PerfectScrollbarModule,
//     NgbModule,
//     ReactiveFormsModule,
//     CifMenuBarModule,
//     CommonHeaderModule
//   ],
//   providers: [
//     NgbRatingConfig,
//     {
//       provide: PERFECT_SCROLLBAR_CONFIG,
//       useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
//     }
//   ]
// })
// export class OurTermsConditionsModule { }
// // Added by Jatinder Kumar 31309
