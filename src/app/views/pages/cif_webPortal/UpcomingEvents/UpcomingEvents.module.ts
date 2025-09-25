
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpcomingEventsComponent } from './UpcomingEvents.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbCarouselModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    UpcomingEventsComponent  
  ],
  exports: [
    UpcomingEventsComponent  
  ],
  imports: [
    CommonModule  ,
        PerfectScrollbarModule,
        NgbModule,
        NgbCarouselModule,
  ]
})
export class UpcomingEventsModule {}