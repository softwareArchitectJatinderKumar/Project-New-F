import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DOCUMENT } from '@angular/common';
import { EventModel } from 'src/app/_model/Event.model';
import swal from 'sweetalert2';
import { catchError, finalize, of, tap } from 'rxjs';

const MIN_LOADING_TIME = 500;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-HomePage',
  templateUrl: './HomePage.component.html',
  styleUrls: ['./HomePage.component.scss'],
})
export class HomePageComponent implements OnInit {
  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
  gotoFacilities() {
    this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  ResultData: any[] = []; currentPage = 1; itemsPerPage = 10; InstrumentsDataData: any[] = [];
  tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
  InstrumentId: any; instrumentName: any = ''; UserRole: any; UserId: any; uploadEnabled: boolean; Remarks: any; dataSource: any;
  Description: any; ImageUrl: any;
  ColumnMode = ColumnMode; columns: any; loadingIndicator = false; headHtmlData: any[] = []; p: any = 1; perPage: any = 5;
  @ViewChild('table') table: ElementRef;
  loadingStates: boolean[] = []; ServerUrl: any; isLoading: boolean = true; loadedCount: number = 0;

  constructor(
    private CIFwebService: LpuCIFWebService,
    private fb: FormBuilder, private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) document: Document,
    private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getAllInstruments();
    this.loadEvents();
  }
  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at Following Address :',
      html: `
           <address>
            <div class="contact-text">
           Central Instrumentation Facility (CIF) <br/>
          Lovely Professional University <br/>
          Block-38, Room No.106 <br/>
          Jalandhar - Delhi G.T. Road, <br/>
          Phagwara, Punjab (India) - 144411 <br/>
          Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
          Email : cif@lpu.co.in<br>
          </div>
           </address>`,
      icon: 'info'
    });


  }
  goto(val: any): void {
    this.router.navigateByUrl(val);
  }
  VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
    this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
  }
  onImageLoad(index: number): void {
    this.loadingStates[index] = false;
  }



  onImageError(event: any, index: number): void {
    event.target.src = '/image.jpg';
    this.loadingStates[index] = false;
  }

  getAllInstruments(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.InstrumentsDataData = response.item1;
          this.tmpsInstrumentsDataData = response.item1.slice(0, response.item1.length);
          this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
        } else {
          this.InstrumentsDataData = [];
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 5s

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        this.loadingIndicator = false;
        console.error(err);
      }
    });

  }

  // added on 21-aug-25
  chunkedEvents: any[][] = [];


  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce((acc, _, i) =>
      (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }
  serverUrl: any = 'https://www.lpu.in/lpu-assets/images/cif/';//https://www.lpu.in/lpu-assets/images/cif/
  get eventGroups() {
    const groups = [];
    for (let i = 0; i < this.events.length; i += 3) {
      groups.push(this.events.slice(i, i + 3));
    }
    return groups;
  }

  testClick(a: any): void {
    const fileName = `${a}.pdf`;
    const fileUrl = `assets/CifDocumentsTemplates/${fileName}`;

    fetch(fileUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
        }
      })
      .catch(error => {
        alert('Error downloading file');
      });
  }
  isDisabled: any = true;
  showSearchForm: boolean = false; show: boolean = true; isSearchOpen: boolean = false;
  toggleSearchForm() {
    this.showSearchForm = !this.showSearchForm;
    this.show = !this.show;
  }
    // --- Data Storage ---
    events: EventModel[] = [];
    categories = ['Upcoming', 'Happenings'];

    // --- Update Mode Management ---
    currentEventId: number | null = null;
    currentImageUrl: string | null = null;  

    EventFileData: string | null = null; 
    EventFileName: string | null = null; 

    // --- Search & Pagination ---
    searchTerm: string = '';
    pageSize: number = 10;
    totalItems: number = 0;
    totalPages: number = 0;
    paginatedEventsData: EventModel[] = [];

    LpuserverUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/';

    readonly MAX_FILE_SIZE_BYTES_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

  loadEvents(): void {
    this.isLoading = true;
    const startTime = Date.now();
    // this.events = [];

    const formData = new FormData();
    formData.append('Action', 'View');  

    this.CIFwebService.EventsCrudOperation(formData, 'View').pipe(
      tap((response: any) => {
        if (response?.item1?.length > 0) {
          // 1. Filter events to only keep 'Happenings'
          const allEvents = response.item1 as EventModel[];
          this.events = allEvents.filter(event => event.eventCategory === 'Happenings');

          // 2. Chunk the filtered events. Using size 3 for col-md-4 layout.
          this.chunkedEvents = this.chunkArray(this.events, 3);
          
        } else {
          this.events = [];
          this.chunkedEvents = [];
        }
        // this.filterAndPaginate();
      }),
      catchError(error => {
        console.error('Error fetching events:', error);
        swal.fire({ title: 'Data Error', text: 'Failed to load event list.', icon: 'error' });
        this.events = [];
        this.chunkedEvents = [];
        // this.filterAndPaginate();
        return of(null);
      }),
      finalize(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
        setTimeout(() => this.isLoading = false, remaining);
      })
    ).subscribe();
  }


   /**
     * Filters the main data array by searchTerm and then slices it for the current page.
     */
    private filterAndPaginate(): void {
        let filteredData = this.events;
        const term = this.searchTerm.toLowerCase().trim();

        if (term) {
            filteredData = filteredData.filter(event =>
                event.eventName.toLowerCase().includes(term) ||
                event.eventDetails.toLowerCase().includes(term) ||
                event.eventCategory.toLowerCase().includes(term)
            );
        }

        this.totalItems = filteredData.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        } else if (this.currentPage === 0 && this.totalPages > 0) {
            this.currentPage = 1;
        } else if (this.totalPages === 0) {
            this.currentPage = 1;
        }
        const startIndex = (this.currentPage - 1) * this.pageSize;
        this.paginatedEventsData = filteredData.slice(startIndex, startIndex + this.pageSize);
    }
}

// import { FormBuilder } from '@angular/forms';
// import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
// import { Router, ActivatedRoute } from '@angular/router';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import { ColumnMode } from '@swimlane/ngx-datatable';
// import { DOCUMENT } from '@angular/common';
// import { EventModel } from 'src/app/_model/Event.model'; // Assuming the EventModel is here
// import swal from 'sweetalert2';
// import { catchError, finalize, of, tap } from 'rxjs';

// const MIN_LOADING_TIME = 1500;
// const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// @Component({
//   selector: 'app-HomePage',
//   templateUrl: './HomePage.component.html',
//   styleUrls: ['./HomePage.component.scss'],
// })
// export class HomePageComponent implements OnInit {
//   @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
//   gotoFacilities() {
//     this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
//   }

//   ResultData: any[] = []; currentPage = 1; itemsPerPage = 10; InstrumentsDataData: any[] = [];
//   tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
//   InstrumentId: any; instrumentName: any = ''; UserRole: any; UserId: any; uploadEnabled: boolean; Remarks: any; dataSource: any;
//   Description: any; ImageUrl: any;
//   ColumnMode = ColumnMode; columns: any; loadingIndicator = false; headHtmlData: any[] = []; p: any = 1; perPage: any = 5;
//   @ViewChild('table') table: ElementRef;
//   loadingStates: boolean[] = []; ServerUrl: any; isLoading: boolean = true; loadedCount: number = 0;

//   constructor(
//     private CIFwebService: LpuCIFWebService,
//     private fb: FormBuilder, private cdRef: ChangeDetectorRef,
//     @Inject(DOCUMENT) document: Document,
//     private router: Router, private route: ActivatedRoute) { }

//   ngOnInit(): void {
//     this.getAllInstruments();
//     this.loadEvents();
//   }
//   openSampleInstructions() {
//     swal.fire({
//       title: 'Send Samples at Following Address :',
//       html: `
//            <address>
//             <div class="contact-text">
//            Central Instrumentation Facility (CIF) <br/>
//           Lovely Professional University <br/>
//           Block-38, Room No.106 <br/>
//           Jalandhar - Delhi G.T. Road, <br/>
//           Phagwara, Punjab (India) - 144411 <br/>
//           Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
//           Email : cif@lpu.co.in<br>
//           </div>
//            </address>`,
//       icon: 'info'
//     });


//   }
//   goto(val: any): void {
//     this.router.navigateByUrl(val);
//   }
//   VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
//     this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
//   }
//   onImageLoad(index: number): void {
//     this.loadingStates[index] = false;
//   }



//   onImageError(event: any, index: number): void {
//     event.target.src = '/image.jpg';
//     this.loadingStates[index] = false;
//   }

//   getAllInstruments(): void {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetAllInstrumentsData().subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.InstrumentsDataData = response.item1;
//           this.tmpsInstrumentsDataData = response.item1.slice(0, response.item1.length);
//           this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
//         } else {
//           this.InstrumentsDataData = [];
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 5s

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: err => {
//         this.loadingIndicator = false;
//         console.error(err);
//       }
//     });

//   }

//   // added on 21-aug-25
//   chunkedEvents: any[][] = [];


//   chunkArray(arr: any[], size: number): any[][] {
//     return arr.reduce((acc, _, i) =>
//       (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
//   }
//   serverUrl: any = 'https://www.lpu.in/lpu-assets/images/cif/';//https://www.lpu.in/lpu-assets/images/cif/
//   get eventGroups() {
//     const groups = [];
//     for (let i = 0; i < this.events.length; i += 3) {
//       groups.push(this.events.slice(i, i + 3));
//     }
//     return groups;
//   }

//   testClick(a: any): void {
//     const fileName = `${a}.pdf`;
//     const fileUrl = `assets/CifDocumentsTemplates/${fileName}`;

//     fetch(fileUrl, { method: 'HEAD' })
//       .then(response => {
//         if (response.ok) {
//           const link = document.createElement('a');
//           link.href = fileUrl;
//           link.download = fileName;
//           document.body.appendChild(link);
//           link.click();
//           document.body.removeChild(link);
//         } else {
//         }
//       })
//       .catch(error => {
//         alert('Error downloading file');
//       });
//   }
//   isDisabled: any = true;
//   showSearchForm: boolean = false; show: boolean = true; isSearchOpen: boolean = false;
//   toggleSearchForm() {
//     this.showSearchForm = !this.showSearchForm;
//     this.show = !this.show;
//   }
//     // --- Data Storage ---
//     events: EventModel[] = [];
//     categories = ['Upcoming', 'Happenings'];

//     // --- Update Mode Management ---
//     currentEventId: number | null = null;
//     currentImageUrl: string | null = null;  

//     EventFileData: string | null = null; 
//     EventFileName: string | null = null; 

//     // --- Search & Pagination ---
//     searchTerm: string = '';
//     pageSize: number = 10;
//     totalItems: number = 0;
//     totalPages: number = 0;
//     paginatedEventsData: EventModel[] = [];

//     LpuserverUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/';

//     readonly MAX_FILE_SIZE_BYTES_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

//   loadEvents(): void {
//     this.isLoading = true;
//     const startTime = Date.now();
//     // this.events = [];

//     const formData = new FormData();
//     formData.append('Action', 'View');  

//     this.CIFwebService.EventsCrudOperation(formData, 'View').pipe(
//       tap((response: any) => {
//         if (response?.item1?.length > 0) {
//           this.events = response.item1 as EventModel[];
//           console.log(JSON.stringify(this.events))
//         } else {
//           this.events = [];
//         }
//          this.chunkedEvents = this.chunkArray(this.events, 5);
//         // this.filterAndPaginate();
//       }),
//       catchError(error => {
//         console.error('Error fetching events:', error);
//         swal.fire({ title: 'Data Error', text: 'Failed to load event list.', icon: 'error' });
//         this.events = [];
//         // this.filterAndPaginate();
//         return of(null);
//       }),
//       finalize(() => {
//         const elapsed = Date.now() - startTime;
//         const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
//         setTimeout(() => this.isLoading = false, remaining);
//       })
//     ).subscribe();
//   }


//    /**
//      * Filters the main data array by searchTerm and then slices it for the current page.
//      */
//     private filterAndPaginate(): void {
//         let filteredData = this.events;
//         const term = this.searchTerm.toLowerCase().trim();

//         if (term) {
//             filteredData = filteredData.filter(event =>
//                 event.eventName.toLowerCase().includes(term) ||
//                 event.eventDetails.toLowerCase().includes(term) ||
//                 event.eventCategory.toLowerCase().includes(term)
//             );
//         }

//         this.totalItems = filteredData.length;
//         this.totalPages = Math.ceil(this.totalItems / this.pageSize);

//         if (this.currentPage > this.totalPages && this.totalPages > 0) {
//             this.currentPage = this.totalPages;
//         } else if (this.currentPage === 0 && this.totalPages > 0) {
//             this.currentPage = 1;
//         } else if (this.totalPages === 0) {
//             this.currentPage = 1;
//         }
//         const startIndex = (this.currentPage - 1) * this.pageSize;
//         this.paginatedEventsData = filteredData.slice(startIndex, startIndex + this.pageSize);
//     }
// }