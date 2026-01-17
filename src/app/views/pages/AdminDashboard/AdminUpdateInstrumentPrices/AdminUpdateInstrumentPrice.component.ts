import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { DOCUMENT } from '@angular/common';
import swal from 'sweetalert2';

import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';

@Component({
    selector: 'app-AdminUpdateInstrumentPrice',
    templateUrl: './AdminUpdateInstrumentPrice.html',
    styleUrls: ['./AdminUpdateInstrumentPrice.scss']
})
export class AdminUpdateInstrumentPrice implements OnInit {
    formdata!: FormGroup;
    loadingIndicator = false;
    
    // Data Arrays
    InstrumentData: any[] = [];
    AnalysisData: any[] = [];
    InstrumentsDuration: any[] = [];
    Datagrid: any[] = [];
    
    // Selection Trackers
    selectedInstrumentId: number | null = null;
    selectedInstrumentName: string = '';
    selectedUserRole: string = '';
    user_Email: string = '';

    constructor(
        private fb: FormBuilder,
        private CIFwebService: LpuCIFWebService,
        private AuthSession: LoginSessionService,
        private cookieService: CookieService,
        private router: Router,
        @Inject(DOCUMENT) private document: Document
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadUserEmail();
        this.GetAllInstruments();
    }

    initForm(): void {
        this.formdata = this.fb.group({
            UserRoleS: ['Select', Validators.required],
            InstrumentName: ['Select', Validators.required],
            AnalysisId: ['Select', Validators.required],
            Duration: ['Select', Validators.required],
            Charges: [{ value: 0, disabled: false }],
            TotalAmount: [null, [Validators.required, Validators.min(1)]]
        });
    }

    loadUserEmail(): void {
        const GetCookieData = this.cookieService.get('authData');
        if (GetCookieData) {
            const retrievedCookies = JSON.parse(GetCookieData);
            this.user_Email = retrievedCookies.EmailId;
        }
    }

    GetAllInstruments(): void {
        this.loadingIndicator = true;
        this.CIFwebService.GetAllInstruments().subscribe({
            next: response => {
                this.InstrumentData = response.item1 || [];
                this.loadingIndicator = false;
            },
            error: () => this.loadingIndicator = false
        });
    }

    // --- Change Handlers with Chain Clearing ---

    onUserTypeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedUserRole = value;

        // Reset all dependent fields
        this.resetFromAnalysis();
        this.formdata.patchValue({ InstrumentName: 'Select' });
        this.AnalysisData = [];
    }

    onInstrumentChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        
        // Step 1: Clear everything downstream
        this.resetFromAnalysis();

        if (value !== 'Select') {
            const parts = value.split('-');
            this.selectedInstrumentId = parseInt(parts[0], 10);
            this.selectedInstrumentName = parts[1];
            this.loadAnalysisTypes(this.selectedInstrumentId);
        } else {
            this.AnalysisData = [];
        }
    }

    onAnalysisTypeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        
        // Step 2: Clear duration and price
        this.resetFromDuration();

        if (value !== 'Select' && this.selectedUserRole && this.selectedUserRole !== 'Select') {
            this.loadDurationData(parseInt(value, 10));
        } else if (value !== 'Select') {
            swal.fire('Info', 'Please select User Type first', 'info');
            this.formdata.patchValue({ AnalysisId: 'Select' });
        }
    }
    selectedType :any;
    onDurationChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const analysisId = select.value;
        const typeName = select.options[select.selectedIndex].text;
        this.selectedType= typeName;
        // Step 3: Clear price only
        this.formdata.patchValue({ Charges: 0, TotalAmount: null });

        if (analysisId !== 'Select') {
            this.loadPrice(analysisId, typeName);
        }
    }

    // --- Private Reset Helpers ---

    private resetFromAnalysis(): void {
        this.formdata.patchValue({ AnalysisId: 'Select', Duration: 'Select', Charges: 0, TotalAmount: null });
        this.InstrumentsDuration = [];
    }

    private resetFromDuration(): void {
        this.formdata.patchValue({ Duration: 'Select', Charges: 0, TotalAmount: null });
        this.InstrumentsDuration = [];
    }

    // --- API Calls ---

    private loadAnalysisTypes(instrumentId: number): void {
        this.loadingIndicator = true;
        this.CIFwebService.GetAnalysisDetails(instrumentId).subscribe({
            next: res => {
                this.AnalysisData = res.item1 || [];
                this.loadingIndicator = false;
            },
            error: () => this.loadingIndicator = false
        });
    }

    private loadDurationData(analysisId: number): void {
        this.loadingIndicator = true;
        this.CIFwebService.GetAnalysisData(analysisId, this.selectedUserRole).subscribe({
            next: res => {
                this.InstrumentsDuration = res.item1 || [];
                this.loadingIndicator = false;
            },
            error: () => this.loadingIndicator = false
        });
    }

    private loadPrice(analysisId: string, typeName: string): void {
        this.loadingIndicator = true;
        this.CIFwebService.GetDuationAndPrice(analysisId, this.selectedUserRole, typeName).subscribe({
            next: res => {
                if (res.item1?.length > 0) {
                    const match = res.item1.find((i: any) => i.typeName === typeName);
                    const price = match ? match.price : 0;
                    
                    if (price === 'N/A' || price === 'NA') {
                        swal.fire('Warning', 'This analysis is not available for the selected User Type.', 'warning');
                        this.formdata.patchValue({ Charges: 0 });
                    } else {
                        this.formdata.patchValue({ Charges: price });
                    }
                }
                this.loadingIndicator = false;
            },
            error: () => this.loadingIndicator = false
        });
    }

    Addtogrid(): void {
        if (this.formdata.valid) {
            const vals = this.formdata.getRawValue();
            this.Datagrid.push({
                instrumentName: this.selectedInstrumentName,
                instrumentId: this.selectedInstrumentId,
                analysisId: vals.AnalysisId,
                duration: this.selectedType,
                oldPrice: vals.Charges,
                newPrice: vals.TotalAmount,
                userRole: vals.UserRoleS,
                email: this.user_Email
            });
            // alert(JSON.stringify(this.Datagrid))
            // console.log(JSON.stringify(this.Datagrid))
            swal.fire('Success', 'Price update added to list.', 'success');
        }
    }
}

// import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
// import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbDateStruct, NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Router, ActivatedRoute } from '@angular/router';
// import { DataTable } from "simple-datatables";
// import { AuthService } from 'src/app/_services/auth.service';
// import { StorageService } from 'src/app/_services/storage.service';
// import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
// import swal from 'sweetalert2';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import Swal from 'sweetalert2';
// import { LoginSessionService } from 'src/app/_services/login-session.service';
// import { DOCUMENT } from '@angular/common';


// @Component({
//     selector: 'app-AdminUpdateInstrumentPrice',
//     templateUrl: './AdminUpdateInstrumentPrice.html',
//     styleUrls: ['./AdminUpdateInstrumentPrice.scss']
// })
// export class AdminUpdateInstrumentPrice implements OnInit {
//     BookingCase: any;
//     InstrumentData: any[] = [];
//     currentPage = 1;
//     itemsPerPage = 10; // 
//     tmpsInstrumentData: any[] = [];
//     InstrumentId: any;
//     UserRole: any;
//     UserId: any;
//     uploadEnabled: boolean;
//     supervisorName: any;
//     departmentName: any;
//     candidateName: any;
//     user_Email: any;
//     sessionData: any[] = [];
//     serverUrl: any;
//     loadingIndicator: boolean;
//     dataSource: any;
//     headHtmlData: any;
//     columns: string[];
//     formdata!: FormGroup<any>;


//     constructor(private CIFwebService: LpuCIFWebService,
//         private storageService: StorageService,
//         private authService: AuthService,
//         private fb: FormBuilder, private cdRef: ChangeDetectorRef,
//         @Inject(DOCUMENT) document: Document,
//         private modalService: NgbModal,
//         private AuthSession: LoginSessionService,
//         private router: Router, private route: ActivatedRoute,
//         private cookieService: CookieService) { }

//     getSessionDetails() {
//         this.sessionData = this.AuthSession.getSession();
//         for (const session of this.sessionData) {
//             this.user_Email = session[0]['userEmail']
//         }
//     }
//     ngOnInit(): void {
//         this.initForm();
//         this.loadingIndicator = true;
//         const startTime = new Date().getTime();
//         this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFSampleExcelSheets/';
//         const GetCookieData = this.cookieService.get('authData');
//         this.GetAllInstruments();
//         const retrievedCookies = JSON.parse(GetCookieData);
//         this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
//         this.user_Email = retrievedCookies.EmailId;
//         this.supervisorName = retrievedCookies.SupervisorName;
//         this.departmentName = retrievedCookies.DepartmentName;
//         this.candidateName = retrievedCookies.CandidateName;
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

//         setTimeout(() => {
//             this.loadingIndicator = false;
//         }, remainingDelay);

//     }

//     searchQuery: string = '';
//     GetAllInstruments() {

//         this.CIFwebService.GetAllInstruments().subscribe({
//             next: response => {
//                 if (response.item1 && response.item1.length > 0) {
//                     const mapped = this.InstrumentData = (response.item1 || []).map((it: any) => {
//                         const row = { ...it };
//                         if (!row.instrumentExcelUrl || row.instrumentExcelUrl.length === 0) {
//                             if (row.instrumentExcelName && row.instrumentExcelName.length > 0) {
//                                 row.instrumentExcelUrl = 'assets/CifDocumentsTemplates/' + row.instrumentExcelName;
//                             } else if (row.instrumentId) {
//                                 row.instrumentExcelUrl = this.serverUrl + '/' + row.instrumentId + '.xlsx';
//                             } else {
//                                 row.instrumentExcelUrl = '';
//                             }
//                         }
//                         return row;
//                     });
//                 }
//                 else {
//                     this.InstrumentData = [];
//                 }

//             },
//             error: err => {
//                 console.log(err)
//             }
//         });
//     }


//     @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
//     InstrumentDataInactive: any[] = []; AnalysisData: any[] = [];
//     PriceValue: any; Duration: any; NumberOfSamples: any; totalAmount: any; Remarks: any; Instrument: any;
//     AnalysisId: any; selectedId: number; selectedDuration: string; PriceData: any; disableBooking: boolean;
//     obj: any; newDynamic: any = {}; Datagrid: any[] = [];
//     InstrumentsDuration: any[] = [];
//     rows: any[] = [{ InstrumentName: '', AnalysisIdx: '', Durationx: '', Chargesx: '', NoOfSamplex: '', TotalAmountx: '', Remarksx: '' }];
//     fileData: File; fileStatus: boolean; FileData: string; fileName: string; isHourly: any;
//     isActive: any; concatenatedInstrumentNames: string; InActiveInstrumentIds: string; Message: string = '';

//     InstrumentName: any;
//     getAllAnalysis(event: Event) {
//         this.Duration = this.AnalysisId = this.PriceValue = '';
//         const selectElement = event.target as HTMLSelectElement;
//         const selectedValue = selectElement.value;

//         const [selectedInstrumentIdStr, ...instrumentNameParts] = selectedValue.split(' ');
//         const selectedInstrumentId = parseInt(selectedInstrumentIdStr, 10);
//         const selectedInstrumentName = instrumentNameParts.join(' ');
//         this.InstrumentName = selectedInstrumentName;
//         if (selectedInstrumentId) {
//             const selectedInstrument = this.InstrumentData?.find(instrument => instrument.instrumentId === selectedInstrumentId);
//             const inactiveInstrument = this.InstrumentDataInactive?.find(instrument => instrument.instrumentId === selectedInstrumentId);

//             if (inactiveInstrument && this.InActiveInstrumentIds?.includes(selectedInstrumentId.toString())) {
//                 swal.fire({
//                     title: 'This instrument is under Maintenance. You cannot proceed with this selection.',
//                     icon: 'error',
//                 }).then(() => {
//                     window.location.reload();
//                 });
//                 return;
//             }
//             this.selectedId = selectedInstrumentId;
//             this.InstrumentId = this.selectedId;


//             if (selectedInstrument) {
//                 this.isActive = selectedInstrument.isActive;
//                 this.Duration = "Other Cases";
//                 this.GetInstrumentIDWiseAnalysisDetails(this.selectedId);
//             }
//         }
//     }

//     setAnalysisId(event: Event) {
//         this.loadingIndicator = true;
//         const startTime = new Date().getTime();
//         const selectElement = event.target as HTMLSelectElement; const selectedValue = selectElement.value;
//         const AnalysisIndex = Array.from(selectElement.options).findIndex(option => option.value === selectedValue);
//         this.Duration = this.PriceValue = '';
//         if (AnalysisIndex !== -1) {
//             selectElement.selectedIndex = AnalysisIndex;
//             this.selectedId = parseInt(selectedValue, 10);
//             this.AnalysisId = this.selectedId;
//             this.getDurationData(this.AnalysisId)
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(500 - elapsed, 0);
//         setTimeout(() => {
//             this.loadingIndicator = false;
//         }, remainingDelay);
//     }

//     getDurationData(AnalysisId: any) {
//         this.loadingIndicator = true;
//         const startTime = new Date().getTime();
//         this.CIFwebService.GetAnalysisData(AnalysisId, this.selectedUser).subscribe({
//             next: response => {
//                 if (response.item1 && response.item1.length > 0) {
//                     this.InstrumentsDuration = response.item1;
//                 }
//                 else {
//                     this.InstrumentsDuration = [];
//                 }
//                 const elapsed = new Date().getTime() - startTime;
//                 const remainingDelay = Math.max(500 - elapsed, 0);
//                 setTimeout(() => {
//                     this.loadingIndicator = false;
//                 }, remainingDelay);
//             },
//             error: err => {
//                 console.log(err)
//             }
//         });
//     }



//     GetInstrumentIDWiseAnalysisDetails(selectedId: number) {
//         this.loadingIndicator = true;
//         const startTime = new Date().getTime();
//         this.CIFwebService.GetAnalysisDetails(selectedId).subscribe({
//             next: response => {
//                 if (response.item1 && response.item1.length > 0) {
//                     this.AnalysisData = response.item1;
//                 }
//                 else {
//                     this.AnalysisData = [];
//                 }
//                 const elapsed = new Date().getTime() - startTime;
//                 const remainingDelay = Math.max(1000 - elapsed, 0); 
//                 setTimeout(() => {
//                     this.loadingIndicator = false;
//                 }, remainingDelay);
//             },
//             error: err => {
//                 console.log(err)
//             }
//         });
//     }
//     selectedUser: any;
//     getUser(event: Event) {

//         const selectElement = event.target as HTMLSelectElement;
//         const selectedUserId = selectElement.value; 
//         const selectedUserName = selectElement.options[selectElement.selectedIndex].text;

//         if (selectedUserId !== 'Select') {
//             this.selectedUser = selectedUserId;
//         }

//     }
//     getPrice(event: Event) {
//         this.loadingIndicator = true;
//         const startTime = new Date().getTime();
//         this.NumberOfSamples = '';
//         this.totalAmount = '';
//         const selectElement = event.target as HTMLSelectElement;
//         const selectedAnalysisId = selectElement.value; 
//         const selectedTypeName = selectElement.options[selectElement.selectedIndex].text; 
//         if (selectedAnalysisId !== 'Select') {
//             this.selectedDuration = selectedTypeName; 
            
//             this.CIFwebService.GetDuationAndPrice(selectedAnalysisId, this.selectedUser, this.selectedDuration).subscribe({
//                 next: response => {
//                     if (response.item1 && response.item1.length > 0) {                        
//                         const matchingPriceData = response.item1.find((item: any) => item.typeName === this.selectedDuration);

//                         if (matchingPriceData) {
//                             this.PriceValue = matchingPriceData.price;
//                             if (this.PriceValue === 'N/A' || this.PriceValue === 'NA') {
//                                 this.disableBooking = true;
//                                 swal.fire({
//                                     title: 'This Test is not Allowed',
//                                     text: 'Kindly proceed with some other test!',
//                                     icon: 'warning',
//                                 });

//                                 setTimeout(() => {
//                                     this.formdata.reset();
//                                 }, 500);
//                             }
//                         } 
//                     } else {
//                         this.AnalysisData = [];
                      
//                     }
//                     const elapsed = new Date().getTime() - startTime;
//                     const remainingDelay = Math.max(1000 - elapsed, 0);  

//                     setTimeout(() => {
//                         this.loadingIndicator = false;
//                     }, remainingDelay);
//                 },
//                 error: err => {
//                     console.log('Error:', err);
//                 }
//             });
//         } else {
//         }
//     }




//     Addtogrid() {
//         if (this.formdata.valid) {
//             this.obj = { instrumentName: this.InstrumentName, instrument: this.InstrumentId, analysisId: this.AnalysisId, Duration: this.Duration, PriceValue: this.PriceValue, NumberOfSamples: this.NumberOfSamples, totalAmount: this.totalAmount, Remarks: this.Remarks }
//             this.newDynamic = { instrumentName: this.InstrumentName, instrument: this.InstrumentId, analysisId: this.AnalysisId, Duration: this.Duration, PriceValue: this.PriceValue, NumberOfSamples: this.NumberOfSamples, totalAmount: this.totalAmount, Remarks: this.Remarks, UserEmailId: this.user_Email };
//             this.Datagrid.push(this.newDynamic);
//         }
//     }


//     initForm() {
//         this.formdata = this.fb.group({
//             InstrumentName: ['Select', Validators.required],
//             AnalysisId: ['Select', Validators.required],
//             Duration: ['Select', Validators.required],
//             UserRoleS: ['Select', Validators.required],
//             Charges: [this.PriceValue],
//             TotalAmount: [0],
//             Remarks: ['', Validators.required]
//         });

//         this.formdata.get('NoOfSample')?.valueChanges.subscribe(() => this.calculateTotal());
//         this.formdata.get('Charges')?.valueChanges.subscribe(() => this.calculateTotal());
//     }

//     calculateTotal() {
//         const qty = this.formdata.get('NoOfSample')?.value || 0;
//         const price = this.formdata.get('Charges')?.value || 0;
//         this.formdata.patchValue({
//             TotalAmount: qty * price
//         }, { emitEvent: false });
//     }
// }