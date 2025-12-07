import Swal from 'sweetalert2';
import swal from 'sweetalert2';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service'; // Assuming you use this service
import { EventModel } from 'src/app/_model/Event.model'; // Assuming the EventModel is here
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
    templateUrl: './events-crud.component.html',
    styleUrls: ['./events-crud.component.css'] // Adjusted style extension
})
export class EventsCrudComponent implements OnInit {

    // --- Form & State Management ---
    isLoginFailed: boolean = false; dynamicForm: FormGroup;
    UserRole: any; UserId: any; uploadEnabled: boolean; fileDataX: File;
    supervisorName: any; departmentName: any; candidateName: any; user_Email: any; sessionData: any[] = [];

    eventForm!: FormGroup;
    isLoading: boolean = false;
    isFormSubmitted: boolean = false;
    isEditMode: boolean = false; // Controls Create/Update button text

    // --- Data Storage ---
    events: EventModel[] = [];
    categories = ['Upcoming', 'Happenings'];

    // --- Update Mode Management ---
    currentEventId: number | null = null;
    currentImageUrl: string | null = null; // Stores existing image path

    // --- File Data (Using Base64 approach) ---
    EventFileData: string | null = null; // Stores Base64 content of the file
    EventFileName: string | null = null; // Stores the name of the file

    // --- Search & Pagination ---
    searchTerm: string = '';
    pageSize: number = 10;
    currentPage: number = 1;
    totalItems: number = 0;
    totalPages: number = 0;
    paginatedEventsData: EventModel[] = [];

    // Assuming a base URL for viewing images
    ServerUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/';

    // Making the constant available in the template
    readonly MAX_FILE_SIZE_BYTES_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

    constructor(

        private eventsService: LpuCIFWebService,
        private CIFwebService: LpuCIFWebService, private LpuCIFWebInstrumentService: LpuCIFWebService,
        private fb: FormBuilder, private cdRef: ChangeDetectorRef,

        private formBuilder: FormBuilder,
        @Inject(DOCUMENT) document: Document,
        private modalService: NgbModal,
        private AuthSession: LoginSessionService,
        private router: Router, private route: ActivatedRoute,
        private cookieService: CookieService
    ) { }

    ngOnInit(): void {
        const GetCookieData = this.cookieService.get('authData');
        const retrievedCookies = JSON.parse(GetCookieData);
        this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
        this.user_Email = retrievedCookies.EmailId;
        this.supervisorName = retrievedCookies.SupervisorName;
        this.departmentName = retrievedCookies.DepartmentName;
        this.candidateName = retrievedCookies.CandidateName;

        if (GetCookieData) {
            const retrievedCookies = JSON.parse(GetCookieData);
            this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
            this.user_Email = retrievedCookies.EmailId;
            this.supervisorName = retrievedCookies.SupervisorName;
            this.departmentName = retrievedCookies.DepartmentName;
            this.candidateName = retrievedCookies.CandidateName;
        } else {
            swal.fire({
                title: 'Login Failed ',
                icon: 'warning',
            });
            this.router.navigate(['/Home']);
        }
        this.initForm();
        this.loadEvents();
    }


    // ngOnInit(): void {
    //     this.initForm();
    //     this.loadEvents();
    // }

    // --- Form Initialization and Getters ---
    private initForm(): void {
        this.eventForm = this.fb.group({
            eventId: [null],
            eventName: ['', [Validators.required, Validators.maxLength(1500)]],
            eventDate: ['', Validators.required],
            eventCategory: ['Upcoming', Validators.required],
            eventDetails: ['', [Validators.required, Validators.maxLength(1500)]],
            imageUrl: [''], // Hidden/for display of existing URL only
        });
    }

    get f(): { [key: string]: AbstractControl } {
        return this.eventForm.controls;
    }

    // --- READ Operation ---

    /**
     * Fetches all events using the 'View' action.
     */
    loadEvents(): void {
        this.isLoading = true;
        const startTime = Date.now();
        this.events = [];

        const formData = new FormData();
        formData.append('Action', 'View'); // Assuming 'View' action is needed even for GET equivalent

        this.eventsService.EventsCrudOperation(formData, 'View').pipe(
            tap((response: any) => {
                // Assuming the events list is correctly returned in response.item1
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
            })
        ).subscribe();
    }

    // --- CRUD Operations - Edit & Delete ---

    resetForm(): void {
        this.eventForm.reset();
        this.eventForm.get('eventCategory')?.setValue('Upcoming'); // Reset dropdown default

        this.isEditMode = false;
        this.currentEventId = null;
        this.currentImageUrl = null;
        this.EventFileData = null; // Clear file data
        this.EventFileName = null; // Clear file name
        this.isFormSubmitted = false;
    }

    /**
     * Binds selected event data to the form for editing.
     */
    onEdit(event: EventModel): void {
        this.isEditMode = true;
        this.currentEventId = event.eventId;
        this.currentImageUrl = event.imageUrl; // Stores existing URL
        this.EventFileData = null; // Clear new file data
        this.EventFileName = null; // Clear new file name

        // --- Date Formatting Fix ---
        let formattedDate = event.eventDate;
        if (event.eventDate?.includes('T')) {
            formattedDate = event.eventDate.split('T')[0];
        }
        // ---------------------------

        this.eventForm.patchValue({
            eventId: event.eventId,
            eventName: event.eventName,
            eventDate: formattedDate,
            eventCategory: event.eventCategory,
            eventDetails: event.eventDetails,
            imageUrl: event.imageUrl || '', // For displaying in the template
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * DELETE Operation: Calls EventsCrudOperation with 'Delete' action.
     */
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
                // Add other required API fields if necessary (e.g., LoginName)

                this.eventsService.EventsCrudOperation(deleteFormData, "Delete").pipe(
                    tap(() => {
                        Swal.fire('Deleted!', 'The event has been removed.', 'success');
                    }),
                    catchError((err) => {
                        console.error('Deletion failed:', err);
                        Swal.fire('Failed!', 'Deletion failed due to an error.', 'error');
                        return of(null);
                    }),
                    finalize(() => {
                        this.loadEvents(); // Reload the grid
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

        // --- FIX: Check Base64 string property instead of the removed 'selectedFile' ---
        if (!this.EventFileData && !this.isEditMode) {
            Swal.fire({ title: 'Validation Error', text: 'Please upload the event image file.', icon: 'warning' });
            return;
        }
        // --- END FIX ---

        this.isLoading = true;

        if (this.isEditMode) {
            this.updateEvent();
        } else {
            this.addNewEvent();
        }
    }

    /**
     * UPDATE Operation: Calls EventsCrudOperation with 'Update' action.
     */
    updateEvent(): void {
        const formData = this.prepareFormData('Update');

        this.eventsService.EventsCrudOperation(formData, "Update").pipe(
            // 💡 FIX: Check the API return code for success or show a generic message
            tap((data: any) => {
                const errorCode = data?.item1?.[0]?.['returnData'];

                if (errorCode > 0) {
                    Swal.fire({ title: 'Success', text: `Event ID ${this.currentEventId} updated successfully.`, icon: 'success' });
                } else {
                    // Show a generic success message if the request was handled, 
                    // assuming a successful HTTP status implies a successful transaction, 
                    // or show the technical issue if the code is 0 or less.
                    Swal.fire({ title: 'Error', text: 'Update failed or returned an unexpected failure code.', icon: 'error' });
                }
            }),
            catchError(error => {
                console.error('Update Error:', error);
                Swal.fire({ title: 'Error', text: 'Failed to update event (HTTP Error).', icon: 'error' });
                return of(null);
            }),
            finalize(() => {
                this.loadEvents();
                this.resetForm();
            })
        ).subscribe();
    }

    /**
     * CREATE Operation: Calls EventsCrudOperation with 'Insert' action.
     */
    addNewEvent(): void {
        const formData = this.prepareFormData('Insert');

        this.eventsService.EventsCrudOperation(formData, 'Insert').pipe(
            // 💡 FIX: Check the API return code for success or fall back to the generic error
            tap((data: any) => {
                const errorCode = data?.item1?.[0]?.['returnData'];

                if (errorCode > 0) {
                    Swal.fire({ title: 'Success', text: 'Event created successfully.', icon: 'success' });
                }
               
                else {
                    // If the API call succeeded (no HTTP error), but the return code is 0 or negative (unknown failure)
                    Swal.fire({ title: 'Technical Issue', text: 'The server processed the request but returned an unexpected failure code.', icon: 'error' });
                }
            }),
            catchError(error => {
                console.error('API Error:', error);
                Swal.fire({ title: 'Error Occurred', text: 'Unable to complete the request (HTTP Error). Please check the network tab.', icon: 'error' });
                return of(null);
            }),
            finalize(() => {
                this.loadEvents();
                this.resetForm();
            })
        ).subscribe();
    }
 

    // --- Utility Functions (File Handling and Form Data Preparation) ---

    /**
     * Prepares the FormData object for Insert or Update operations.
     */
    private prepareFormData(action: 'Insert' | 'Update'): FormData {
        const formValue = this.eventForm.getRawValue(); // Use getRawValue to include disabled fields (like EventId)
        const formData = new FormData();

        // The API expects PascalCase fields, mapping formValue (camelCase) to API (PascalCase)
        formData.append('Action', action);
        if (this.currentEventId) {
            formData.append('EventId', this.currentEventId.toString());
        }

        formData.append('EventName', formValue.eventName);
        formData.append('EventDate', formValue.eventDate);
        formData.append('EventCategory', formValue.eventCategory);
        formData.append('EventDetails', formValue.eventDetails);

        // --- FIXED Image Handling Logic ---
        if (this.EventFileData && this.EventFileName) {
            // New file selected (Base64 approach)
            formData.append('ImageUrl', this.EventFileName);
            formData.append('EventFileData', this.EventFileData);
        } else if (action === 'Update' && this.currentImageUrl) {
            // Update without new file: reuse existing URL
            formData.append('ImageUrl', this.currentImageUrl);
            formData.append('EventFileData', ''); // No file data sent
        } else {
            // Insert/Update with no file or existing file
            formData.append('ImageUrl', '');
            formData.append('EventFileData', '');
        }
        // --- END FIXED Image Handling Logic ---

        // Add other API required fields (LoginName, DisapprovalReason, etc.)
        formData.append('LoginName', 'AngularUser');
        formData.append('DisapprovalReason', '');

        return formData;
    }

    /**
     * Reads file content as Base64 string.
     */
    private readFileAsBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Resolve only the Base64 content (after the comma in the data URL)
                resolve((reader.result as string).split(',')[1]);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Handles file selection for event image and stores Base64 content.
     */
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
            const fileUrl = `${this.ServerUrl}${filePath}`;
            window.open(fileUrl, '_blank');
        } else {
            Swal.fire({ title: 'No File', text: 'No file path available for this event.', icon: 'info' });
        }
    }


    // --- Search & Pagination (Reused from IssuesCrudComponent) ---

    /**
     * Filters the main data array by searchTerm and then slices it for the current page.
     */
    private filterAndPaginate(): void {
        let filteredData = this.events;
        const term = this.searchTerm.toLowerCase().trim();

        // 1. Filtering Logic (Adjusted fields for Event)
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

        // 2. Pagination Logic
        const startIndex = (this.currentPage - 1) * this.pageSize;
        this.paginatedEventsData = filteredData.slice(startIndex, startIndex + this.pageSize);
    }

    /**
     * Handles page navigation buttons.
     */
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.filterAndPaginate();
        }
    }

    /**
     * Triggered when the search box content or page size changes.
     */
    onSearchChange(): void {
        this.currentPage = 1; // Always reset to the first page on a new search/size change
        this.filterAndPaginate();
    }

}


// import swal from 'sweetalert2';
// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// // import { EventsService } from '../services/events.service';
// import { EventModel } from '../../../../_model/Event.model';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';

// @Component({
//     selector: 'app-events-crud',
//     templateUrl: './events-crud.component.html',
//     styleUrls: ['./events-crud.component.css']
// })
// export class EventsCrudComponent implements OnInit {
//     events: EventModel[] = [];
//     eventForm!: FormGroup;
//     isEditMode: boolean = false;
//     categories = ['Upcoming', 'Happenings'];
//     loading = false;
//     message: string | null = null;

//     // 💡 NEW: Property to store the file object
//     selectedFile: File | null = null;
//     constructor(
//         private fb: FormBuilder,
//         private eventsService: LpuCIFWebService
//     ) { }

//     ngOnInit(): void {
//         this.initForm();
//         this.loadEvents();
//     }

//     /** Initializes the Reactive Form */
//     initForm(): void {
//         this.eventForm = this.fb.group({
//             eventId: [null], // Hidden field, null for Insert
//             eventName: ['', Validators.required],
//             eventDate: ['', Validators.required],
//             eventCategory: ['Upcoming', Validators.required],
//             eventDetails: ['', Validators.required],
//             imageUrl: [''],
//             //   imageUrl: ['', [Validators.required, Validators.pattern('(https?://.*\\.(?:png|jpg|jpeg|gif|webp))')]] // Basic URL validation
//         });
//     }

//     onFileSelected(event: any): void {
//         if (event.target.files.length > 0) {
//             this.selectedFile = event.target.files[0] as File;
//             // Optional: You might want to remove URL validation if a file is selected
//             // and vice-versa, depending on your business rules.
//         } else {
//             this.selectedFile = null;
//         }
//     }

//     fileNamesX: string; FileDataX: string; searchQueryx: any; StatusInstrument: any = false;
//     fileDataX: any; fileName: any; fileStatus: any;
//     fileChosen: { [key: number]: boolean } = {};
//     onFileXSelected(event: any, id: number): void {
//         this.fileChosen[id] = event.target.files.length > 0;
//         const reader = new FileReader();
//         const target = event.target as HTMLInputElement;
//         const file: File | null = (target.files as FileList)[0] || null;

//         if (file && file.size > 10148576) {
//             swal.fire({
//                 title: 'File size exceeds 10 MB. Please upload a smaller file.',
//                 text: 'Invalid File size',
//                 icon: 'warning'
//             });
//             target.value = '';
//             return;
//         }

//         const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
//         if (file && !fileNameRegex.test(file.name)) {
//             const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

//             const modifiedFile = new File([file], validFileName, { type: file.type });
//             const dataTransfer = new DataTransfer();
//             dataTransfer.items.add(modifiedFile);
//             target.files = dataTransfer.files;

//             this.fileDataX = modifiedFile;
//             this.fileStatus = true;

//             reader.readAsDataURL(modifiedFile);
//             reader.onload = () => {
//                 const ssss = reader.result as string;
//                 const ssssArray = ssss.split(',');
//                 this.FileDataX = ssssArray[1];
//                 this.fileName = validFileName;
//             };
//             return;
//         }

//         this.fileDataX = file;
//         this.fileStatus = true;

//         if (file) {
//             reader.readAsDataURL(file);
//             reader.onload = () => {
//                 const ssss = reader.result as string;
//                 const ssssArray = ssss.split(',');
//                 this.FileDataX = ssssArray[1];
//                 this.fileName = file.name;
//             };
//         }
//     }

//     /** Fetches all events using the 'View' action */
//     loadEvents(): void {
//         const startTime = new Date().getTime();
//         this.loading = true;
//         this.message = 'Loading events...';

//         this.eventsService.getEvents().subscribe((response) => {
//             if (response.item1 && response.item1.length > 0) {
//                 this.events = response.item1;
//                 console.log(JSON.stringify(this.events))
//                 alert(0)
//             }
//             else {
//                 this.events = [];
//             }
//             const elapsed = new Date().getTime() - startTime;
//             const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

//             setTimeout(() => {
//                 this.loading = false;
//             }, remainingDelay);
//         });

//     }

//     /** Handles form submission (Create or Update) */
//     onSubmit(): void {
//         if (this.eventForm.invalid) {
//             // Mark all fields touched to display validation errors
//             this.eventForm.markAllAsTouched();
//             return;
//         }

//         const eventData: EventModel = this.eventForm.value;
//         this.loading = true;

//         if (this.isEditMode) {

//             this.eventsService.updateEvent(eventData).subscribe({
//                 next: (res) => {
//                     this.handleSuccess('Event updated successfully!');
//                 },
//                 error: (err) => this.handleError('Failed to update event.', err)
//             });
//         } else {
//             // CREATE

//             if (this.fileChosen[Id]) {
//                 const formValue = this.eventForm.value;
//                 const formData = new FormData();
//                 const EventId = formValue.eventId;
//                 // 1. Fields required for API routing and file handling
//                 formData.append('Action', 'Update');
//                 formData.append('EventId', EventId);
//                 formData.append('EventName', formValue.eventName);
//                 formData.append('EventName', formValue.eventName);
//                 formData.append('ImageUrl', this.ImageUrl);
//                 formData.append('ImageFileData', this.ImageFileData || '');
//                 formData.append('IssueTitle', formValue.IssueTitle);
//                 formData.append('IssueDescription', formValue.IssueDescription);
//                 formData.append('AuthorName', this.authors.join(', '));
//                 formData.append('PageNo', formValue.PageNumber);
//                 // 2. Other form fields for content update

//                 // console.log("Uploading Publication with data:");
//                 // formData.forEach((value, key) => console.log(`${key}: ${value}`));

//                 this.LpuCIFWebInstrumentService.CIFInstrumentUpdateDetails(formData).subscribe({
//                     next: (data: any) => {
//                         const result = data.item1[0]['msg'];
//                         if (result === 'ok') {
//                             swal.fire({
//                                 title: 'Uploaded the Document',
//                                 text: 'Document uploaded successfully!',
//                                 icon: 'success',
//                                 showConfirmButton: true,
//                             })
//                                 .then(() => {
//                                     window.location.reload();
//                                 });
//                         } else if (result === 'Failed') {
//                             swal.fire({
//                                 title: 'Failed to Upload',
//                                 text: result,
//                                 icon: 'error',
//                                 timer: 2000,
//                                 showConfirmButton: false,
//                             });
//                         }
//                         const elapsed = new Date().getTime() - startTime;
//                         const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

//                         setTimeout(() => {
//                             this.loading = false;
//                         }, remainingDelay);
//                     },
//                     error: (error: any) => {
//                         swal.fire({
//                             title: 'Error',
//                             text: 'Internal Server error',
//                             icon: 'error',
//                             showConfirmButton: false,
//                         });
//                     },
//                     complete: () => {

//                     },
//                 });
//             }
//             this.eventsService.createEvent(eventData).subscribe({
//                 next: (res) => {
//                     this.handleSuccess('Event created successfully!');
//                 },
//                 error: (err) => this.handleError('Failed to create event.', err)
//             });
//         }
//     }

//     /** Loads an event into the form for editing */
//     editEvent(event: EventModel): void {
//         this.isEditMode = true;
//         this.eventForm.patchValue(event); // Fill the form with the event data
//     }

//     /** Deletes an event */
//     deleteEvent(eventId: number): void {
//         if (!confirm('Are you sure you want to delete this event?')) {
//             return;
//         }
//         this.loading = true;
//         this.eventsService.deleteEvent(eventId).subscribe({
//             next: (res) => {
//                 this.handleSuccess('Event deleted successfully!');
//             },
//             error: (err) => this.handleError('Failed to delete event.', err)
//         });
//     }

//     /** Resets the form and prepares for a new event */
//     onCancel(): void {
//         this.isEditMode = false;
//         this.eventForm.reset({
//             EventId: null, // Ensure ID is reset
//             EventCategory: 'Upcoming' // Keep a default selected
//         });
//     }

//     /** Common success handler */
//     private handleSuccess(msg: string): void {
//         this.message = msg;
//         this.loading = false;
//         this.onCancel(); // Reset form
//         this.loadEvents(); // Reload the event list
//     }

//     /** Common error handler */
//     private handleError(msg: string, err: any): void {
//         console.error(msg, err);
//         this.message = `${msg} Check console for details.`;
//         this.loading = false;
//     }
// }