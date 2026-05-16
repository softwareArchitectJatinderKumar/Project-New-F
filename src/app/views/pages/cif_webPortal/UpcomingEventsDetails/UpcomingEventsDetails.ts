
import swal from 'sweetalert2';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { StorageService } from 'src/app/_services/storage.service';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DOCUMENT } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface EventDetail {
    eventId: any;
    eventName: any;
    imageUrl: any;
    eventDate: any;
}

@Component({
    selector: 'app-UpcomingEventsDeails',
    templateUrl: './UpcomingEventsDetails.html',
    styleUrls: ['./UpcomingEventsDetails.scss'],
    standalone: false,
    animations: [
        trigger('slideInOut', [
            state('void', style({ height: '0px', opacity: 0 })),
            state('*', style({ height: '*', opacity: 1 })),
            transition('void <=> *', animate('300ms ease-in-out'))
        ])
    ]
})
export class UpcomingEventsDetailsComponent implements OnInit {

    constructor(
        private CIFwebService: LpuCIFWebService,
        private storageService: StorageService,
        private authService: AuthService,
        private fb: FormBuilder,
        private cdRef: ChangeDetectorRef,
        @Inject(DOCUMENT) document: Document,
        private modalService: NgbModal,
        private cdr: ChangeDetectorRef,
        private AuthSession: LoginSessionService,
        private router: Router,
        private route: ActivatedRoute,
        private cookieService: CookieService
    ) { }

    goto(val: any): void {
        this.router.navigateByUrl(val);
    }

    serverUrl: any;
    EventId: any;


    // ngOnInit(): void {
    //     this.GetAllEventDetails();
    //     this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/'

    //     this.route.paramMap.subscribe((params) => {
    //         this.EventId = Number(params.get('id'));
    //         if (this.EventId) {
    //             this.fetchSpecifications(this.EventId);
    //         }
    //     });


    // }
    ngOnInit(): void {
  this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/'
  
  // Get EventId from route
  this.route.paramMap.subscribe(params => {
    this.EventId = Number(params.get('id'));
    
    // Load all events first
    this.GetAllEventDetails().then(() => {
      // Now fetch the event details once events are loaded
      if (this.EventId) {
        this.fetchSpecifications(this.EventId);
      }
    });
  });
}

GetAllEventDetails(): Promise<void> {
  this.loadingIndicator = true;
  return new Promise((resolve, reject) => {
    this.CIFwebService.GetAllEventDetails().subscribe({
      next: (response) => {
        // Check if response has error flag from service
        if (response && response.error) {
          this.serverError = true;
          this.errorMessage = response.message || 'Error';
          this.loadingIndicator = false;
          resolve();
          return;
        }

        if (response.item1 && response.item1.length > 0) {
          this.events = response.item1;
        } else {
          this.events = [];
        }
        this.chunkedEventsC = this.chunkArray(this.events, 3);
        this.allEvents = this.chunkedEventsC.flat();
        this.loadingIndicator = false;
        resolve();
      },
      error: (err) => {
        this.loadingIndicator = false;
        this.serverError = true;
        this.errorMessage = 'Error';
        this.events = [];
        this.chunkedEventsC = [];
        reject(err);
      }
    });
  });
}



    // added on 25-sep-25
    ColumnMode = ColumnMode; columns: any; loadingIndicator = false;
    chunkedEventsC: any[][] = [];
    chunkedEvents: any[][] = [];
    allEvents: any = [];
    events: EventDetail[] = []; // full list of events
    // Error handling properties
    serverError = false;
    errorMessage = '';

    eventName: string = '';
    eventDate: string = '';
    ImageUrl: string = '';

    chunkArray(arr: any[], size: number): any[][] {
        return arr.reduce((acc, _, i) =>
            (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
    }

 
    fetchSpecifications(id: number): void {
        this.EventId = id;
        const event: EventDetail | undefined = this.events.find(e => e.eventId === this.EventId);
        if (event) {
            this.eventName = event.eventName;
            this.ImageUrl = event.imageUrl;
            this.eventDate = event.eventDate;
        } else {
            this.eventName = '';
            this.ImageUrl = '';
            this.eventDate = '';
            console.warn(`Event with ID ${this.EventId} not found.`);
        }

        this.cdr.detectChanges();
    }


}