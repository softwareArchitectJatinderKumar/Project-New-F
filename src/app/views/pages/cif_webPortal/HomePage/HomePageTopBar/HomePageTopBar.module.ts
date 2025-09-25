// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HomePageTopBarComponent } from './HomePageTopBar.component';
// import { RouterModule, Routes } from '@angular/router';

// const routes: Routes = [
//   {
//     path: '',
//     component: HomePageTopBarComponent, 
//   }
// ]

// @NgModule({
//     imports: [
//       CommonModule,
//       RouterModule.forChild(routes),   
  
//     ],
  
//   })
 
// export class HomePageTopBarModule{ }


import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageTopBarComponent } from './HomePageTopBar.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbCarouselModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UpcomingEventsModule } from "../../UpcomingEvents/UpcomingEvents.module";

@NgModule({
  declarations: [
    HomePageTopBarComponent  
  ],
  exports: [
    HomePageTopBarComponent  
  ],
  imports: [
    CommonModule,
    PerfectScrollbarModule,
    NgbModule,
    NgbCarouselModule,
    UpcomingEventsModule
]
})
export class HomePageTopBarModule {}