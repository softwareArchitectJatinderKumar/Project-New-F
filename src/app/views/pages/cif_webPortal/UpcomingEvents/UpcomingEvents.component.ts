import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';

import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-UpcomingEvents',
    templateUrl: './UpcomingEvents.html',
    styleUrls: ['./UpcomingEvents.scss'],

})

export class UpcomingEventsComponent implements OnInit {
    serverUrl:any;
    ngOnInit(): void {
        this.GetAllEventDetails();
        this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/'
    }

    constructor(
        private CIFwebService: LpuCIFWebService,
        private fb: FormBuilder,
        private router: Router, private route: ActivatedRoute) { }



    // added on 25-sep-25
    ColumnMode = ColumnMode; columns: any; loadingIndicator = false;
    chunkedEventsC: any[][] = [];
    events = [];
    chunkedEvents: any[][] = [];
    allEvents: any = [];

    chunkArray(arr: any[], size: number): any[][] {
        return arr.reduce((acc, _, i) =>
            (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
    }

    GetAllEventDetails(): void {
        this.loadingIndicator = true;
        const startTime = new Date().getTime();
        this.CIFwebService.GetAllEventDetails().subscribe({
            next: response => {
                if (response.item1 && response.item1.length > 0) {
                    this.events = response.item1;
                } else {
                    this.events = [];
                }
                // Update chunkedEvents after events are set
                this.chunkedEventsC = this.chunkArray(this.events, 3);
                this.allEvents = this.chunkedEventsC ? this.chunkedEventsC.flat() : [];
                const elapsed = new Date().getTime() - startTime;
                const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 2.5s

                setTimeout(() => {
                    this.loadingIndicator = false;
                }, remainingDelay);
            },
            error: err => {
                this.loadingIndicator = false;
                console.error(err);
                // Fallback to static events and chunk them
                this.events = [];
                this.chunkedEventsC = this.chunkArray(this.events, 3);
            }
        });
    }


    goToEventX() {
        console.log("HELLO")
        //    this.router.navigateByUrl(eventId);
        this.router.navigateByUrl(`Home`);
    }
    goToEvent(eventId: any) {
        //    this.router.navigateByUrl(eventId);
        this.router.navigateByUrl(`Home`);
    }

 goToEventC(eventId: any) {
  console.log('Navigating to event with ID:', eventId);
  if (!eventId) {
    console.warn('Invalid event ID:', eventId);
    return;
  }
  this.router.navigate(['/Events', eventId]);
}


}