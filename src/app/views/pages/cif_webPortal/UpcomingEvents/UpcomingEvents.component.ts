import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';

import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
import { EventModel } from 'src/app/_model/Event.model';
import { catchError, finalize, of, tap } from 'rxjs';
import Swal from 'sweetalert2';
import swal from 'sweetalert2';

@Component({
    selector: 'app-UpcomingEvents',
    templateUrl: './UpcomingEvents.html',
    styleUrls: ['./UpcomingEvents.scss'],

})

export class UpcomingEventsComponent implements OnInit {
    serverUrl: any;

    @ViewChild('ngbCarousel', { static: false }) carousel!: NgbCarousel;


    // set to 0 to disable auto-slide, or ms (e.g. 5000)
    autoSlideInterval = 4000;
    ngOnInit(): void {
        this.GetAllEventDetails();
        this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/'
    }

    constructor(
        private CIFwebService: LpuCIFWebService,
        private fb: FormBuilder,
        private router: Router, private route: ActivatedRoute) { }

    // ── REQ #3: Carousel shows only 'Happenings' events ──────────────────────
    chunkedEvents: any[][] = [];
    UpcomingchunkedEvents: any[][] = [];
    ServerUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/';

    // added on 25-sep-25
    ColumnMode = ColumnMode; columns: any; loadingIndicator = false;
    chunkedEventsC: any[][] = [];
    // events = [];
    events: EventModel[] = [];
    // chunkedEvents: any[][] = [];
    // Error handling properties
    serverError = false;
    errorMessage = '';
    allEvents: any = [];
    EventsData = [
        {
            eventId: 1011,
            eventDate: "00:00.0",
            eventName: "ANRF Sponsored Summer Training Programme",
            eventDetails: "ANRF Sponsored Summer Training Programme  date: (2 June - 11 July 2025)",
            imageUrl: "CIF_Events_New_File_352100192_summer-training-programme-2025.webp"
        }
    ];

    chunkArray(arr: any[], size: number): any[][] {
        return arr.reduce((acc, _, i) =>
            (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
    }


    GetAllEventDetails(): void {

        const startTime = Date.now();
        this.events = [];

        const formData = new FormData();
        formData.append('Action', 'View');


        this.CIFwebService.EventsCrudOperation(formData, 'View').pipe(
            tap((response: any) => {
                if (response?.item1?.length > 0) {
                    this.events = response.item1 as EventModel[];
                } else {
                    this.events = [];
                }
            }),
            catchError(error => {
                console.error('Error fetching events:', error);
                swal.fire({ title: 'Data Error', text: 'Failed to load event list.', icon: 'error' });
                this.events = [];
                return of(null);
            }),
            finalize(() => {
                // const elapsed = Date.now() - startTime;
                // const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
                // setTimeout(() => this.isLoading = false, remaining);

                // REQ #3: rebuild carousel chunks (Happenings-only) after data loads
                this.updateChunks();
            })
        ).subscribe();

    }

    // GetAllEventDetails(): void {
    //     this.loadingIndicator = true;
    //     const startTime = new Date().getTime();
    //     this.CIFwebService.GetAllEventDetails().subscribe({
    //         next: response => {

    //             if (response.item1 && response.item1.length > 0) {
    //                 this.events = response.item1;
    //                 // console.log(JSON.stringify(this.events))
    //             } else {
    //                 this.events = [];
    //             }
    //             // Update chunkedEvents after events are set
    //             this.chunkedEventsC = this.chunkArray(this.events.length>0 ? this.events: this.EventsData, 3);
    //             this.allEvents = this.chunkedEventsC ? this.chunkedEventsC.flat() : [];
    //             const elapsed = new Date().getTime() - startTime;
    //             const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 2.5s

    //             setTimeout(() => {
    //                 this.loadingIndicator = false;
    //             }, remainingDelay);
    //         },
    //         error: err => {
    //             this.loadingIndicator = false;
    //             this.serverError = true;
    //             this.errorMessage = 'Data Server Connection error , Try again later';
    //             console.error(err);
    //             // Fallback to static events and chunk them
    //             this.events = [];
    //             this.chunkedEventsC = this.chunkArray(this.events, 3);
    //         }
    //     });
    // }

    updateChunks(): void {
        const width = window.innerWidth;
        let itemsPerSlide = 3;
        if (width < 768) { itemsPerSlide = 1; }
        else if (width < 992) { itemsPerSlide = 2; }

        // ── CHANGED: filter to Happenings only before chunking ────────────────
        const happeningEvents = this.events.filter(e => e.eventCategory === 'Happenings');


        const groups: any[][] = [];
        for (let i = 0; i < happeningEvents.length; i += itemsPerSlide) {
            groups.push(happeningEvents.slice(i, i + itemsPerSlide));
        }
        this.chunkedEvents = groups;



        const upcomingEvents = this.events.filter(e => e.eventCategory === 'Upcoming');
        const upcominggroups: any[][] = [];
        for (let i = 0; i < upcomingEvents.length; i += itemsPerSlide) {
            upcominggroups.push(upcomingEvents.slice(i, i + itemsPerSlide));
        }
        this.UpcomingchunkedEvents = upcominggroups;
    }


    goToEventX() {
        this.router.navigateByUrl(`Home`);
    }
    goToEvent(eventId: any) {
        this.router.navigateByUrl(`Home`);
    }

    goToEventC(eventId: any) {
        if (!eventId) {
            return;
        }
        this.router.navigate(['/Events', eventId]);
    }

    // called by the template buttons
    prev(): void {
        if (this.carousel) {
            this.carousel.prev();
        }
    }

    next(): void {
        if (this.carousel) {
            this.carousel.next();
        }
    }

}