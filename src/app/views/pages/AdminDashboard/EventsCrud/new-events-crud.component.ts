import Swal from 'sweetalert2';
import swal from 'sweetalert2';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { EventModel } from 'src/app/_model/Event.model';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginSessionService } from 'src/app/_services/login-session.service';
import { CookieService } from 'ngx-cookie-service';
import { DOCUMENT } from '@angular/common';

// --- Constants ---
const MIN_LOADING_TIME = 1500;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
    selector: 'app-events-crud',
    templateUrl: './new-events-crud.component.html',
    styleUrls: ['./new-events-crud.component.css']
})
export class newEventsCrudComponent implements OnInit {

    // --- Form & State Management ---
    isLoginFailed: boolean = false;
    dynamicForm: FormGroup;
    UserRole: any; UserId: any; uploadEnabled: boolean; fileDataX: File;
    supervisorName: any; departmentName: any; candidateName: any; user_Email: any; sessionData: any[] = [];

    eventForm!: FormGroup;
    isLoading: boolean = false;
    isFormSubmitted: boolean = false;
    isEditMode: boolean = false;

    // --- Data Storage ---
    events: EventModel[] = [];
    categories = ['Upcoming', 'Happenings'];

    // --- Update Mode Management ---
    currentEventId: number | null = null;
    currentImageUrl: string | null = null;

    // --- File Data (Using Base64 approach) ---
    EventFileData: string | null = null;
    EventFileName: string | null = null;

    // --- Search & Pagination ---
    searchTerm: string = '';
    pageSize: number = 5;
    currentPage: number = 1;
    totalItems: number = 0;
    totalPages: number = 0;
    paginatedEventsData: EventModel[] = [];

    ServerUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/';

    readonly MAX_FILE_SIZE_BYTES_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

    // ── REQ #3: Carousel shows only 'Happenings' events ──────────────────────
    chunkedEvents: any[][] = [];
    UpcomingchunkedEvents: any[][] = [];

    constructor(
        private eventsService: LpuCIFWebService,
        private CIFwebService: LpuCIFWebService,
        private LpuCIFWebInstrumentService: LpuCIFWebService,
        private fb: FormBuilder,
        private cdRef: ChangeDetectorRef,
        private formBuilder: FormBuilder,
        @Inject(DOCUMENT) document: Document,
        private modalService: NgbModal,
        private AuthSession: LoginSessionService,
        private router: Router,
        private route: ActivatedRoute,
        private cookieService: CookieService
    ) { }

    ngOnInit(): void {
        const GetCookieData = this.cookieService.get('authData');

        if (GetCookieData) {
            const retrievedCookies = JSON.parse(GetCookieData);
            this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
            this.user_Email = retrievedCookies.EmailId;
            this.supervisorName = retrievedCookies.SupervisorName;
            this.departmentName = retrievedCookies.DepartmentName;
            this.candidateName = retrievedCookies.CandidateName;
        } else {
            swal.fire({ title: 'Login Failed', icon: 'warning' });
            this.router.navigate(['/Home']);
        }

        this.initForm();
        this.loadEvents();
    }

    
    chunkArray(arr: any[], size: number): any[][] {
        return arr.reduce((acc: any[][], _: any, i: number) =>
            (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
    }

    

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

    // --- Form Initialization ---

    private initForm(): void {
        this.eventForm = this.fb.group({
            eventId: [null],
            eventName: ['', [Validators.required, Validators.maxLength(1500)]],
            eventDate: ['', Validators.required],
            eventCategory: ['Happenings', Validators.required],
            eventDetails: ['', [Validators.required, Validators.maxLength(1500)]],
            imageUrl: [''],
        });
    }

    get f(): { [key: string]: AbstractControl } {
        return this.eventForm.controls;
    }

    
    get isImageRequired(): boolean {
        return this.f['eventCategory'].value === 'Happenings';
    }

  
    loadEvents(): void {
        this.isLoading = true;
        const startTime = Date.now();
        this.events = [];

        const formData = new FormData();
        formData.append('Action', 'View');

         
        this.eventsService.EventsCrudOperation(formData, 'View').pipe(
            tap((response: any) => {
                if (response?.item1?.length > 0) {
                    this.events = response.item1 as EventModel[];
                } else {
                    this.events = [];
                }
                this.filterAndPaginate();
            }),
            catchError(error => {
                console.error('Error fetching events:', error);
                Swal.fire({ title: 'Data Error', text: 'Failed to load event list.', icon: 'error' });
                this.events = [];
                this.filterAndPaginate();
                return of(null);
            }),
            finalize(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
                setTimeout(() => this.isLoading = false, remaining);

                this.updateChunks();
            })
        ).subscribe();
    }


    resetForm(): void {
        this.eventForm.reset();
        this.eventForm.get('eventCategory')?.setValue('Happenings');
        this.isEditMode = false;
        this.currentEventId = null;
        this.currentImageUrl = null;
        this.EventFileData = null;
        this.EventFileName = null;
        this.isFormSubmitted = false;
        this.isLoading = false;
         window.location.reload();

    }

    onEdit(event: EventModel): void {
        this.isEditMode = true;
        this.currentEventId = event.eventId;
        this.currentImageUrl = event.imageUrl;
        this.EventFileData = null;
        this.EventFileName = null;

        let formattedDate = event.eventDate;
        if (event.eventDate?.includes('T')) {
            formattedDate = event.eventDate.split('T')[0];
        }

        this.eventForm.patchValue({
            eventId: event.eventId,
            eventName: event.eventName,
            eventDate: formattedDate,
            eventCategory: event.eventCategory,
            eventDetails: event.eventDetails,
            imageUrl: event.imageUrl || '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onDelete(event: EventModel): void {
        Swal.fire({
            title: 'Are you sure?',
            text: `Delete event: ${event.eventName}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.isLoading = true;

                const deleteFormData = new FormData();
                deleteFormData.append('Action', 'Delete');
                deleteFormData.append('EventId', event.eventId.toString());
                deleteFormData.append('EventName', event.eventName.toString());

                // REQ #2: Same EventsCrudOperation API (unchanged)
                this.eventsService.EventsCrudOperation(deleteFormData, 'Delete').pipe(
                    tap(() => {
                        Swal.fire('Deleted!', 'The event has been removed.', 'success');
                    }),
                    catchError((err) => {
                        console.error('Deletion failed:', err);
                        Swal.fire('Failed!', 'Deletion failed due to an error.', 'error');
                        return of(null);
                    }),
                    finalize(() => {
                        this.loadEvents();
                    })
                ).subscribe();
            }
        });
    }

    // --- Submission Handlers (Create & Update) ---

    onSubmit(): void {
        this.isFormSubmitted = true;

        if (this.eventForm.invalid) {
            Swal.fire({ title: 'Validation Error', text: 'Please fill out all required fields correctly.', icon: 'warning' });
            return;
        }

        if (this.isImageRequired && !this.EventFileData && !this.isEditMode) {
            Swal.fire({ title: 'Validation Error', text: 'Please upload the event image file.', icon: 'warning' });
            return;
        }
        // ─────────────────────────────────────────────────────────────────────

        this.isLoading = true;

        if (this.isEditMode) {
            this.updateEvent();
        } else {
            this.addNewEvent();
        }
    }

    /**
     * REQ #2: UPDATE — uses same EventsCrudOperation API with 'Update' action (unchanged).
     */
    updateEvent(): void {
        const formData = this.prepareFormData('Update');

        this.eventsService.EventsCrudOperation(formData, 'Update').pipe(
            tap((data: any) => {
                const errorCode = data?.item1?.[0]?.['returnData'];
                if (errorCode > 0) {
                    Swal.fire({ title: 'Success', text: `Event ID ${this.currentEventId} updated successfully.`, icon: 'success' });
                }
            }),
            catchError(error => {
                console.error('Update Error:', error);
                Swal.fire({ title: 'Error', text: 'Failed to update event (HTTP Error).', icon: 'error' });
                return of(null);
            }),
            finalize(() => {
                this.resetForm();
            })
        ).subscribe();
    }

    /**
     * REQ #2: INSERT — uses same EventsCrudOperation API with 'Insert' action (unchanged).
     */
    addNewEvent(): void {
        const formData = this.prepareFormData('Insert');

        this.eventsService.EventsCrudOperation(formData, 'Insert').pipe(
            tap((data: any) => {
                const errorCode = data?.item1?.[0]?.['returnData'];
                if (errorCode > 0) {
                    Swal.fire({ title: 'Success', text: 'Event created successfully.', icon: 'success' });
                }
            }),
            catchError(error => {
                console.error('API Error:', error);
                Swal.fire({ title: 'Error Occurred', text: 'Unable to complete the request (HTTP Error). Please check the network tab.', icon: 'error' });
                return of(null);
            }),
            finalize(() => {
                this.resetForm();
            })
        ).subscribe();
    }

   
    private prepareFormData(action: 'Insert' | 'Update'): FormData {
        const formValue = this.eventForm.getRawValue();
        const formData = new FormData();

        formData.append('Action', action);
        if (this.currentEventId) {
            formData.append('EventId', this.currentEventId.toString());
        }

        formData.append('EventName', formValue.eventName);
        formData.append('EventDate', formValue.eventDate);
        formData.append('EventCategory', formValue.eventCategory);
        formData.append('EventDetails', formValue.eventDetails);

        if (this.EventFileData && this.EventFileName) {
            // New file selected
            formData.append('ImageUrl', this.EventFileName);
            formData.append('EventFileData', this.EventFileData);
        } else if (action === 'Update' && this.EventFileName && this.EventFileData) {
            formData.append('ImageUrl', this.EventFileName);
            formData.append('EventFileData', this.EventFileData);
        } else {
            // No file — Happenings with no image, or Update keeping existing image
            formData.append('ImageUrl', '');
            formData.append('EventFileData', '');
        }

        formData.append('LoginName', this.user_Email);
        formData.append('DisapprovalReason', '');

        return formData;
    }

    private readFileAsBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve((reader.result as string).split(',')[1]);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    async onFileSelectedEventFile(event: Event): Promise<void> {
        const target = event.target as HTMLInputElement;
        const file: File | null = (target.files as FileList)[0] || null;
        this.EventFileData = null;
        this.EventFileName = null;
        if (!file) return;

        if (file.size > MAX_FILE_SIZE_BYTES) {
            await Swal.fire({ title: 'Invalid File Size', text: `File size exceeds ${this.MAX_FILE_SIZE_BYTES_MB}MB.`, icon: 'warning' });
            target.value = '';
            return;
        }

        try {
            this.EventFileData = await this.readFileAsBase64(file);
            this.EventFileName = file.name;
        } catch (e) {
            await Swal.fire({ title: 'File Read Error', text: 'Could not process the selected file.', icon: 'error' });
            target.value = '';
        }
    }

    onViewFile(filePath: string | null): void {
        if (filePath) {
            window.open(`${this.ServerUrl}${filePath}`, '_blank');
        } else {
            Swal.fire({ title: 'No File', text: 'No file path available for this event.', icon: 'info' });
        }
    }

    // --- Search & Pagination ---

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

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.filterAndPaginate();
        }
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.filterAndPaginate();
    }
}