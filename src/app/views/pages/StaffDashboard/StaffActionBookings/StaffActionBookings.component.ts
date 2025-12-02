import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { StorageService } from 'src/app/_services/storage.service';
import * as XLSX from 'xlsx';
import swal from 'sweetalert2';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import Swal from 'sweetalert2';
import { LoginSessionService } from 'src/app/_services/login-session.service';

import { ColumnMode } from '@swimlane/ngx-datatable';

import { MatTableDataSource } from '@angular/material/table';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DOCUMENT } from '@angular/common';


@Component({
  selector: 'app-StaffActionBookings',
  templateUrl: './StaffActionBookings.component.html',
  styleUrls: ['./StaffActionBookings.component.scss']
})
export class StaffActionBookingsComponent implements OnInit {
  @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
  @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
  @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
  @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
  @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
  dataSource: MatTableDataSource<any>;

  FileData: any; array: any[] = []; fileData: File; fileStatus: boolean = false;
  fileName: string;
  selectedId: number;
  ColumnMode = ColumnMode;
  columns: any;
  loadingIndicator = false;
  headHtmlData: any[] = [];
  p: any = 1;
  perPage: any = 5;
  @ViewChild('table') table: ElementRef;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
    'totalCharges', 'remarks', 'allocatedOn', //'allocatedOn'
  ];
  BookingCase: any;
  BookingData: any;
  currentPage = 1;
  itemsPerPage = 10; 
  tmpsBookingData: any;
  InstrumentId: any;
  UserRole: any;
  UserId: any;
  uploadEnabled: boolean;
  Remarks: any;
  serverUrl: string;
  NoResults: any; 

  // New/Updated Filter Properties
  originalData: any[] = []; // Base data loaded from API
  searchQuery: string = '';
  selectedStatus: string = '';
  IsAssigned: string = ''; // Filter for Assigned/Not Assigned tests

  // === NEW PROPERTIES FOR RESULT UPLOAD STATUS ===
  BookingResultsData: any[] = [];
  tmpsBookingResultsData: any[] = [];
  originalResultsData: any[] = [];
  selectedResultStatus: string = ''; // New filter property
  // ===============================================

  constructor(
    private CIFwebService: LpuCIFWebService,
    
    private modalService: NgbModal,
    private AuthSession: LoginSessionService,
    
    private cookieService: CookieService) { }
  user_Email: any;
  sessionData: any[] = [];
  getSessionDetails() {
    this.sessionData = this.AuthSession.getSession();
    for (const session of this.sessionData) {
      this.user_Email = session[0]['userEmail']
    }
  }
  ngOnInit(): void {
    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';//'http://172.19.2.52/umsweb/webftp/MOUDocuments/';
    const GetCookieData = this.cookieService.get('StaffUserAuthData');
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserRole = retrievedCookies.UserRole;
    this.UserId = retrievedCookies.EmailId;
    this.getBookingDetails(); 
    
    // === CALL THE NEW API HERE ===
    this.GetUploadedResultDetails(this.UserId);
  }

  /**
   * Consolidated Filtering Logic: Applies Payment Status, Assignment Status, Result Status, and Text Search.
   */
  applyFilters(): void {
    let filteredData = [...this.originalData];
    if (this.selectedStatus) {
        filteredData = filteredData.filter(item => {
            if (this.selectedStatus === 'null') {
                return !item.paymentStatus || item.paymentStatus === 'null' || item.paymentStatus === '';
            } else {
                return item.paymentStatus === this.selectedStatus;
            }
        });
    }

    if (this.selectedResultStatus) {
        filteredData = filteredData.filter(item => {
            // Check if the current bookingId exists in the array of uploaded results AND has a file path
            const isUploaded = this.BookingResultsData.some(resultItem =>
                resultItem.bookingId === item.bookingId && 
                (resultItem.uploadedResult && resultItem.uploadedResult.trim().length > 0 && resultItem.uploadedResult.trim() !== 'null' && resultItem.uploadedResult.trim() !== '-NA-')
            );

            if (this.selectedResultStatus === 'Uploaded') {
                return isUploaded;
            } else if (this.selectedResultStatus === 'Pending') {
                return !isUploaded;
            }
            return true;
        });
    }
    // ==============================================================================

    // 4. Apply Text Search (this.searchQuery) on the filtered result
    this.tmpsBookingData = this.applyTextSearch(filteredData);
    
    this.currentPage = 1; // Reset to first page after filtering or searching
  }

  private applyTextSearch(data: any[]): any[] {
    const query = this.searchQuery.toLowerCase();
    if (!query) {
        return data;
    }
    return data.filter((item: { [s: string]: unknown; } | ArrayLike<unknown>) => {
      // Search across all properties for a match
      return Object.values(item).some((val: any) =>
        String(val).toLowerCase().includes(query)
      );
    });
  }

  search() {
    this.applyFilters();
  }

  filterData(): void {
    this.applyFilters();
  }
  
  // Filter Options for the UI
  statusOptions = [
    { label: 'All Payments', value: '' }, 
    { label: 'Paid Payments (Success)', value: 'success' },
    { label: 'Failed Payments (Failure)', value: 'failure' },
    { label: 'Pending Payments', value: 'null' } 
  ];

  assignedOptions = [
    { label: 'All Tests', value: '' },
    { label: 'Assigned Tests', value: 'Assigned' },
    { label: 'Not Assigned Tests', value: 'Not Assigned' }
  ];

  // === NEW: Result Status Options ===
  resultStatusOptions = [
    { label: 'All Results', value: '' },
    { label: 'Uploaded Results', value: 'Uploaded' },
    { label: 'Pending Results', value: 'Pending' }
  ];
  // ===================================


  getBookingDetails() {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllBooking().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.BookingData = response.item1;
          const firstRecord = response.item1[0];
          this.NoResults = firstRecord.returnMessage;
          
          this.dataSource = response.item1;
          this.tmpsBookingData = response.item1;
          this.originalData = [...this.BookingData]; 
          this.headHtmlData = this.tmpsBookingData[0];
          this.columns = Object.keys(this.tmpsBookingData[0]);
          this.columns = this.columns.filter((item: any) => item !== 'candidateName' && item !== 'userEmail' && item !== 'id' && item !== 'analysisId');
          this.columns.push()
        }
        else {
          this.BookingData = [];
          this.tmpsBookingData = [];
          this.originalData = []; 
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0);

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        console.log(err)
      }
    });
    
  }

  /**
   * NEW API INTEGRATION: Fetches the results uploaded by staff (or user if API is shared)
   */
  GetUploadedResultDetails(userId: any) {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetUploadedResultDetails(userId).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          // Store the full array of uploaded results for filtering later
          this.BookingResultsData = response.item1; 
          this.originalResultsData = [...response.item1];
        } else {
          this.BookingResultsData = [];
          this.originalResultsData = [];
        }
        
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0); 

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        console.log(err)
      }
    });
  }

  /**
   * Helper function to determine if a result has been uploaded for a specific booking ID.
   * Used in the HTML for displaying the status in the table rows.
   */
  isResultUploaded(bookingId: string): boolean {
    // Check against the fetched BookingResultsData array
    return this.BookingResultsData.some(resultItem => 
        resultItem.bookingId === bookingId && 
        (resultItem.uploadedResult && resultItem.uploadedResult.trim().length > 0 && resultItem.uploadedResult.trim() !== 'null' && resultItem.uploadedResult.trim() !== '-NA-')
    );
  }

  // Helper for Pagination/Display
  getTotalPages() {
    return Math.ceil(this.tmpsBookingData.length / this.itemsPerPage);
  }

  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.tmpsBookingData) {
        return this.tmpsBookingData.slice(startIndex, endIndex);
    }
    return [];
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  exportToExcel(): void {
    const fileName = 'AssignedResults_report.xlsx';
    // Export from the currently filtered data (tmpsBookingData)
    const exportedData = this.tmpsBookingData.map((item: { paymentStatus:any;mobileNumber:any;organisationName: any; userRole: any; userId: any;candidateName:any; bookingId: any; instrumentName: any; noOfSamples: any; totalCharges: any; userEmailId: any; allocatedOn: any; departmentName:any; idProofNumber:any; paymentDate:any;}) => ({
      BookingId: item.bookingId,
      InstrumentName: item.instrumentName,
      Sample_Count: item.noOfSamples,
      Charges: item.totalCharges,
      User_Email_Id: item.userId,
      User_Mobile_No: item.mobileNumber,
      Candidate_Name: item.candidateName,
      Organisation_Name: item.organisationName,
      Department_Name: item.departmentName,
      Registration_Number: item.idProofNumber,
      User_Role: item.userRole,
      Payment_Date: item?.paymentDate,
      Payment_Status: item?.paymentStatus === 'success' ? 'Paid' : item?.paymentStatus === 'failure' ? 'Failed' : 'Pending',
      Result_Status: this.isResultUploaded(item.bookingId) ? 'Uploaded' : 'Pending'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

    const wscols = [
      { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }
    ];
    ws['!cols'] = wscols;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }


  applyFilter(event: Event) {
    // This method is for MatTableDataSource filter, which seems unused 
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  downloadFile(fileName: string): void {
    const url = this.serverUrl + fileName;
    window.open(url, '_blank');
  }
  openPaymentModal(a: any) {
    this.BookingCase = a;
    this.modalService.open(this.viewDescModal2, { size: 'lg' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch(() => { });

  }

  VerifyData(BookingData: any) {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    if (this.FileData) {
      const formData = new FormData();
      formData.append('BookingId', BookingData.bookingId);
      formData.append('UserEmailId', BookingData.userId);
      formData.append('CreatedBy', this.user_Email);
      formData.append('FilePath', this.fileName);
      formData.append('File', this.FileData);

      this.CIFwebService.CIFResultsUploads(formData).subscribe({
        next: (data: any) => {
          const result = data.item1[0]['msg']; 
          const returnId = data.item1[0]['ReturnId'];

          if (result === 'Success' && returnId !== '0') {
            Swal.fire({
              title: 'Uploaded Successfully!',
              icon: 'success'
            }).then(() => {
              window.location.reload();
            });
          } else {
            Swal.fire({
              title: 'Already Uploaded Results for this Test',
              icon: 'error'
            }).then(() => {
              window.location.reload();
            });
          }
          const elapsed = new Date().getTime() - startTime;
          const remainingDelay = Math.max(1500 - elapsed, 0); 

          setTimeout(() => {
            this.loadingIndicator = false;
          }, remainingDelay);
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'Failed to Upload.',
            icon: 'error'
          });
        }
      });
    }
    else {
      Swal.fire({
        title: 'Error',
        text: 'Kindly Upload File.',
        icon: 'error'
      });
    }
  }


  onFileSelected(event: any): void {
    this.fileStatus = false;
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;
    if (file && file.size > 5148576) {
      swal.fire({
        title: 'File size exceeds 5MB. Please upload a smaller file.',
        text: 'Invalid File size',
        icon: 'warning'
      });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (file && !fileNameRegex.test(file.name)) {
      const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      const modifiedFile = new File([file], validFileName, { type: file.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(modifiedFile);
      target.files = dataTransfer.files;

      this.fileData = modifiedFile;
      this.fileStatus = true;

      reader.readAsDataURL(modifiedFile);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileData = ssssArray[1];
        this.fileName = validFileName;
      };
      this.uploadEnabled = true;
      return;
    }

    this.fileData = file;
    this.fileStatus = true;
    if (file) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileData = ssssArray[1];
        this.fileName = file.name;
      };
    }
  }

  UploadDocument() {
  }
}

// import { FormBuilder } from '@angular/forms';
// import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Router, ActivatedRoute } from '@angular/router';
// import { AuthService } from 'src/app/_services/auth.service';
// import { StorageService } from 'src/app/_services/storage.service';
// import * as XLSX from 'xlsx';
// import swal from 'sweetalert2';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import Swal from 'sweetalert2';
// import { LoginSessionService } from 'src/app/_services/login-session.service';

// import { ColumnMode } from '@swimlane/ngx-datatable';

// import { MatTableDataSource } from '@angular/material/table';
// import { NgSelectComponent } from '@ng-select/ng-select';
// import { DOCUMENT } from '@angular/common';


// @Component({
//   selector: 'app-StaffActionBookings',
//   templateUrl: './StaffActionBookings.component.html',
//   styleUrls: ['./StaffActionBookings.component.scss']
// })
// export class StaffActionBookingsComponent implements OnInit {
//   @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
//   @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
//   @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
//   @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
//   @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
//   dataSource: MatTableDataSource<any>;

//   FileData: any; array: any[] = []; fileData: File; fileStatus: boolean = false;
//   fileName: string;
//   selectedId: number;
//   ColumnMode = ColumnMode;
//   columns: any;
//   loadingIndicator = false;
//   headHtmlData: any[] = [];
//   p: any = 1;
//   perPage: any = 5;
//   @ViewChild('table') table: ElementRef;
//   displayedColumns: string[] = [
//     'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
//     'totalCharges', 'remarks', 'allocatedOn', //'allocatedOn'
//   ];
//   BookingCase: any;
//   BookingData: any;
//   currentPage = 1;
//   itemsPerPage = 10; //
//   tmpsBookingData: any;
//   InstrumentId: any;
//   UserRole: any;
//   UserId: any;
//   uploadEnabled: boolean;
//   Remarks: any;
//   serverUrl: string;
//   NoResults: any; // Explicitly declared the property used in the template

//   // New/Updated Filter Properties
//   originalData: any[] = []; // Base data loaded from API
//   searchQuery: string = '';
//   selectedStatus: string = '';
//   IsAssigned: string = ''; // Filter for Assigned/Not Assigned tests

//   constructor(
//     private CIFwebService: LpuCIFWebService,
    
//     private modalService: NgbModal,
//     private AuthSession: LoginSessionService,
    
//     private cookieService: CookieService) { }
//   user_Email: any;
//   sessionData: any[] = [];
//   getSessionDetails() {
//     this.sessionData = this.AuthSession.getSession();
//     for (const session of this.sessionData) {
//       this.user_Email = session[0]['userEmail']
//     }
//   }
//   UserUid:any;
//   ngOnInit(): void {
//     this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';//'http://172.19.2.52/umsweb/webftp/MOUDocuments/';
//     const GetCookieData = this.cookieService.get('StaffUserAuthData');
//     const retrievedCookies = JSON.parse(GetCookieData);
//     this.UserRole = retrievedCookies.UserRole;
//     this.UserId = retrievedCookies.EmailId;
//     this.UserUid = retrievedCookies.UserId;
//     this.getBookingDetails(); // Added semicolon for good measure
//     this.GetUploadedResultDetails(this.UserUid);
//   }

//   /**
//    * Consolidated Filtering Logic: Applies Payment Status, Assignment Status, and Text Search.
//    * This is the function the compiler was reporting as missing.
//    */
//   applyFilters(): void {
//     let filteredData = [...this.originalData];
    
//     // 1. Filter by Payment Status (this.selectedStatus)
//     if (this.selectedStatus) {
//         filteredData = filteredData.filter(item => {
//             // Handles 'null', undefined, or empty string payment status for Pending
//             if (this.selectedStatus === 'null') {
//                 return !item.paymentStatus || item.paymentStatus === 'null' || item.paymentStatus === '';
//             } else {
//                 return item.paymentStatus === this.selectedStatus;
//             }
//         });
//     }

//     // 2. Filter by Assignment Status (this.IsAssigned)
//     if (this.IsAssigned) {

//       // BookingResultsData
//         filteredData = this.BookingResultsData.filter(item => {
            
//             const isAssigned =  item.allocatedOn !== 'null' && item.allocatedOn !== '-NA-';
           
//             if (this.IsAssigned === 'Pending') {
//                 return isAssigned;
//             } else if (this.IsAssigned === 'Uploaded') {
//                 return !isAssigned;
//             }
//             return true;  
//         });
//     }

//     // 3. Apply Text Search (this.searchQuery) on the filtered result
//     this.tmpsBookingData = this.applyTextSearch(filteredData);
    
//     this.currentPage = 1; // Reset to first page after filtering or searching
//   }

//   private applyTextSearch(data: any[]): any[] {
//     const query = this.searchQuery.toLowerCase();
//     if (!query) {
//         return data;
//     }
//     return data.filter((item: { [s: string]: unknown; } | ArrayLike<unknown>) => {
//       // Search across all properties for a match
//       return Object.values(item).some((val: any) =>
//         String(val).toLowerCase().includes(query)
//       );
//     });
//   }

//   // 'search' now just triggers the combined filtering logic
//   search() {
//     this.applyFilters();
//   }

//   // filterData is kept for legacy/compatibility but now just calls applyFilters
//   filterData(): void {
//     this.applyFilters();
//   }
  
//   // Filter Options for the UI
//   statusOptions = [
//     { label: 'All Payments', value: '' }, 
//     { label: 'Paid Payments (Success)', value: 'success' },
//     { label: 'Failed Payments (Failure)', value: 'failure' },
//     { label: 'Pending Payments', value: 'null' } // Using 'null' to filter for null/empty status
//   ];

//   assignedOptions = [
//     { label: 'All Tests', value: '' },
//     { label: 'Uploaded Results', value: 'Uploaded' },
//     { label: 'Pending Results', value: 'Pending' }
//   ];


//   getBookingDetails() {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetAllBooking().subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.BookingData = response.item1;
//           const firstRecord = response.item1[0];
//           this.NoResults = firstRecord.returnMessage; // Assignment to declared property
//           // console.log(JSON.stringify(this.BookingData))
//           // console.log(JSON.stringify(this.cookieService.get('StaffUserAuthData')))

//           this.dataSource = response.item1;
//           this.tmpsBookingData = response.item1;
//           this.originalData = [...this.BookingData]; 
//           this.headHtmlData = this.tmpsBookingData[0];
//           this.columns = Object.keys(this.tmpsBookingData[0]);
//           this.columns = this.columns.filter((item: any) => item !== 'candidateName' && item !== 'userEmail' && item !== 'id' && item !== 'analysisId');
//           this.columns.push()
//         }
//         else {
//           this.BookingData = [];
//           this.tmpsBookingData = [];
//           this.originalData = []; 
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 1.5s

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: err => {
//         console.log(err)
//       }
//     });
    
//   }

//   // Helper for Pagination/Display
//   getTotalPages() {
//     return Math.ceil(this.tmpsBookingData.length / this.itemsPerPage);
//   }

//   getCurrentPageData() {
//     const startIndex = (this.currentPage - 1) * this.itemsPerPage;
//     const endIndex = startIndex + this.itemsPerPage;
//     // Check if tmpsBookingData is defined before slicing
//     if (this.tmpsBookingData) {
//         return this.tmpsBookingData.slice(startIndex, endIndex);
//     }
//     return [];
//   }

//   nextPage() {
//     if (this.currentPage < this.getTotalPages()) {
//       this.currentPage++;
//     }
//   }

//   prevPage() {
//     if (this.currentPage > 1) {
//       this.currentPage--;
//     }
//   }

//   exportToExcel(): void {
//     const fileName = 'AssignedResults_report.xlsx';
//     // Export from the currently filtered data (tmpsBookingData)
//     const exportedData = this.tmpsBookingData.map((item: { paymentStatus:any;mobileNumber:any;organisationName: any; userRole: any; userId: any;candidateName:any; bookingId: any; instrumentName: any; noOfSamples: any; totalCharges: any; userEmailId: any; allocatedOn: any; departmentName:any; idProofNumber:any; paymentDate:any;}) => ({
//       BookingId: item.bookingId,
//       InstrumentName: item.instrumentName,
//       SampleCount: item.noOfSamples,
//       Charges: item.totalCharges,
//       UserEmailId: item.userId,
//       User_Mobile_No: item.mobileNumber,
//       Candidate_Name: item.candidateName,
//       Organisation_Name: item.organisationName,
//       Department_Name: item.departmentName,
//       Registration_Number: item.idProofNumber,
//       User_Role: item.userRole,
//       Payment_Date: item?.paymentDate,
//       Payment_Status: item?.paymentStatus === 'success' ? 'Paid' : item?.paymentStatus === 'failure' ? 'Failed' : 'Pending'
//     }));

//     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

//     const wscols = [
//       { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }
//     ];
//     ws['!cols'] = wscols;

//     const wb: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
//     const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
//     link.download = fileName;
//     link.click();
//   }


//   applyFilter(event: Event) {
//     // This method is for MatTableDataSource filter, which seems unused 
//     const filterValue = (event.target as HTMLInputElement).value;
//     this.dataSource.filter = filterValue.trim().toLowerCase();
//   }

//   downloadFile(fileName: string): void {
//     const url = this.serverUrl + fileName;
//     window.open(url, '_blank');
//   }
//   openPaymentModal(a: any) {
//     this.BookingCase = a;
//     this.modalService.open(this.viewDescModal2, { size: 'lg' }).result.then( // Changed size to lg for better visibility of the modal table
//       (result: string) => {
//         console.log("Modal closed" + result);
//       }
//     ).catch(() => { });

//   }

//   VerifyData(BookingData: any) {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     if (this.FileData) {
//       const formData = new FormData();
//       formData.append('BookingId', BookingData.bookingId);
//       formData.append('UserEmailId', BookingData.userId);
//       formData.append('CreatedBy', this.user_Email);
//       formData.append('FilePath', this.fileName);
//       formData.append('File', this.FileData);

//       this.CIFwebService.CIFResultsUploads(formData).subscribe({
//         next: (data: any) => {
//           const result = data.item1[0]['msg']; 
//           const returnId = data.item1[0]['ReturnId'];

//           if (result === 'Success' && returnId !== '0') {
//             Swal.fire({
//               title: 'Uploaded Successfully!',
//               icon: 'success'
//             }).then(() => {
//               window.location.reload();
//             });
//           } else {
//             Swal.fire({
//               title: 'Already Uploaded Results for this Test',
//               icon: 'error'
//             }).then(() => {
//               window.location.reload();
//             });
//           }
//           const elapsed = new Date().getTime() - startTime;
//           const remainingDelay = Math.max(1500 - elapsed, 0); 

//           setTimeout(() => {
//             this.loadingIndicator = false;
//           }, remainingDelay);
//         },
//         error: () => {
//           Swal.fire({
//             title: 'Error',
//             text: 'Failed to Upload.',
//             icon: 'error'
//           });
//         }
//       });
//     }
//     else {
//       Swal.fire({
//         title: 'Error',
//         text: 'Kindly Upload File.',
//         icon: 'error'
//       });
//     }
//   }


//   onFileSelected(event: any): void {
//     this.fileStatus = false;
//     const reader = new FileReader();
//     const target = event.target as HTMLInputElement;
//     const file: File | null = (target.files as FileList)[0] || null;
//     if (file && file.size > 5148576) {
//       swal.fire({
//         title: 'File size exceeds 5MB. Please upload a smaller file.',
//         text: 'Invalid File size',
//         icon: 'warning'
//       });
//       target.value = '';
//       return;
//     }

//     const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
//     if (file && !fileNameRegex.test(file.name)) {
//       const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

//       const modifiedFile = new File([file], validFileName, { type: file.type });
//       const dataTransfer = new DataTransfer();
//       dataTransfer.items.add(modifiedFile);
//       target.files = dataTransfer.files;

//       this.fileData = modifiedFile;
//       this.fileStatus = true;

//       reader.readAsDataURL(modifiedFile);
//       reader.onload = () => {
//         const ssss = reader.result as string;
//         const ssssArray = ssss.split(',');
//         this.FileData = ssssArray[1];
//         this.fileName = validFileName;
//       };
//       this.uploadEnabled = true;
//       return;
//     }

//     this.fileData = file;
//     this.fileStatus = true;
//     // alert(10);
//     if (file) {
//       reader.readAsDataURL(file);
//       reader.onload = () => {
//         const ssss = reader.result as string;
//         const ssssArray = ssss.split(',');
//         this.FileData = ssssArray[1];
//         this.fileName = file.name;
//       };
//     }
//   }

//   UploadDocument() {
//   }




//   BookingResultsData:any[] = [];
//   tmpsBookingResultsData:any[] = [];
//   originalResultsData:any[] = [];

//    GetUploadedResultDetails(userId:any) {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetUploadedResultDetails(userId).subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.BookingResultsData = response.item1;

//           this.dataSource = response.item1;
//           this.tmpsBookingResultsData = response.item1;
//           this.originalResultsData = [...this.BookingData]; 
          
//         }
//         else {
//           this.BookingData = [];
//           this.tmpsBookingData = [];
//           this.originalData = []; 
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 1.5s

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: err => {
//         console.log(err)
//       }
//     });
    
//   }

// }




// import { FormBuilder } from '@angular/forms';
// import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Router, ActivatedRoute } from '@angular/router';
// import { AuthService } from 'src/app/_services/auth.service';
// import { StorageService } from 'src/app/_services/storage.service';
// import * as XLSX from 'xlsx';
// import swal from 'sweetalert2';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import Swal from 'sweetalert2';
// import { LoginSessionService } from 'src/app/_services/login-session.service';

// import { ColumnMode } from '@swimlane/ngx-datatable';

// import { MatTableDataSource } from '@angular/material/table';
// import { NgSelectComponent } from '@ng-select/ng-select';
// import { DOCUMENT } from '@angular/common';


// @Component({
//   selector: 'app-StaffActionBookings',
//   templateUrl: './StaffActionBookings.component.html',
//   styleUrls: ['./StaffActionBookings.component.scss']
// })
// export class StaffActionBookingsComponent implements OnInit {
//   @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
//   @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
//   @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
//   @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
//   @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
//   dataSource: MatTableDataSource<any>;

//   FileData: any; array: any[] = []; fileData: File; fileStatus: boolean = false;
//   fileName: string;
//   selectedId: number;
//   ColumnMode = ColumnMode;
//   columns: any;
//   loadingIndicator = false;
//   headHtmlData: any[] = [];
//   p: any = 1;
//   perPage: any = 5;
//   @ViewChild('table') table: ElementRef;
//   displayedColumns: string[] = [
//     'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
//     'totalCharges', 'remarks', 'allocatedOn', //'allocatedOn'
//   ];
//   BookingCase: any;
//   BookingData: any;
//   currentPage = 1;
//   itemsPerPage = 10; //
//   tmpsBookingData: any;
//   InstrumentId: any;
//   UserRole: any;
//   UserId: any;
//   uploadEnabled: boolean;
//   Remarks: any;
//   serverUrl: string;

//   constructor(
//     private CIFwebService: LpuCIFWebService,
    
//     private modalService: NgbModal,
//     private AuthSession: LoginSessionService,
    
//     private cookieService: CookieService) { }
//   user_Email: any;
//   sessionData: any[] = [];
//   getSessionDetails() {
//     this.sessionData = this.AuthSession.getSession();
//     for (const session of this.sessionData) {
//       this.user_Email = session[0]['userEmail']
//     }
//   }
//   ngOnInit(): void {
//     this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';//'http://172.19.2.52/umsweb/webftp/MOUDocuments/';
//     const GetCookieData = this.cookieService.get('StaffUserAuthData');
//     const retrievedCookies = JSON.parse(GetCookieData);
//     this.UserRole = retrievedCookies.UserRole;
//     this.UserId = retrievedCookies.EmailId;
//     this.getBookingDetails()

//   }

//   searchQuery: string = '';

//   search() {
//     const query = this.searchQuery.toLowerCase();
//     this.tmpsBookingData = this.BookingData.filter((item: { [s: string]: unknown; } | ArrayLike<unknown>) => {
//       return Object.values(item).some(val =>
//         String(val).toLowerCase().includes(query)
//       );
//     });
//   }


//   get filteredBookingData(): any[] {
//     if (!this.searchQuery.trim()) {
//       return this.BookingData;
//     }
//     const searchTerm = this.searchQuery.toLowerCase();
//     return this.BookingData.filter((booking: { instrumentName: string; analysisType: string; }) =>
//       booking.instrumentName.toLowerCase().includes(searchTerm) || booking.analysisType.toLowerCase().includes(searchTerm)
//     );
//   }
//   NoResults: any = '';
//   getBookingDetails() {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     this.CIFwebService.GetAllBooking().subscribe({
//       next: response => {
//         if (response.item1 && response.item1.length > 0) {
//           this.BookingData = response.item1;
//           const firstRecord = response.item1[0];
//           this.NoResults = firstRecord.returnMessage;
//           // console.log(JSON.stringify(this.BookingData))
//             this.dataSource = response.item1;
//             this.tmpsBookingData = response.item1;
//             this.originalData = [...this.BookingData];  
//             this.headHtmlData = this.tmpsBookingData[0];
//             this.columns = Object.keys(this.tmpsBookingData[0]);
//             this.columns = this.columns.filter((item: any) => item !== 'candidateName' && item !== 'userEmail' && item !== 'id' && item !== 'analysisId');
//             this.columns.push()
          
         
//         }
//         else {
//           this.BookingData = [];
//         }
//         const elapsed = new Date().getTime() - startTime;
//         const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

//         setTimeout(() => {
//           this.loadingIndicator = false;
//         }, remainingDelay);
//       },
//       error: err => {
//         console.log(err)
//       }
//     });
    
//   }

//   originalData: any[] = []; // Loaded from API
//   filteredData: any[] = [];
//   selectedStatus: string = '';

//   filterData(): void {
//     if (this.selectedStatus === '') {
//       this.tmpsBookingData = [...this.originalData]; // Show all data
//     } else if (this.selectedStatus === 'null') {
//       this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === null);
//     } else {
//       this.tmpsBookingData = this.originalData.filter(item => item.paymentStatus === this.selectedStatus);
//     }
//     this.currentPage = 1; // Reset to first page after filtering
//   }

//   statusOptions = [
//     { label: 'All', value: '' }, 
//     { label: 'Success', value: 'success' },
//     { label: 'Failure', value: 'failure' },
//     { label: 'Pending', value: 'null' }
//   ];
  
//   getTotalPages() {
//     return Math.ceil(this.tmpsBookingData.length / this.itemsPerPage);
//   }

//   getCurrentPageData() {
//     const startIndex = (this.currentPage - 1) * this.itemsPerPage;
//     const endIndex = startIndex + this.itemsPerPage;
//     return this.tmpsBookingData.slice(startIndex, endIndex);
//   }

//   nextPage() {
//     if (this.currentPage < this.getTotalPages()) {
//       this.currentPage++;
//     }
//   }

//   prevPage() {
//     if (this.currentPage > 1) {
//       this.currentPage--;
//     }
//   }

//   exportToExcel(): void {
//     const fileName = 'AssignedResults_report.xlsx';
//     const exportedData = this.BookingData.map((item: { paymentStatus:any;mobileNumber:any;organisationName: any; userRole: any; userId: any;candidateName:any; bookingId: any; instrumentName: any; noOfSamples: any; totalCharges: any; userEmailId: any; allocatedOn: any; }) => ({
//       BookingId: item.bookingId,
//       InstrumentName: item.instrumentName,
//       SampleCount: item.noOfSamples,
//       Charnges: item.totalCharges,
//       UserEmailId: item.userId,
//       UsermobileNumber: item.mobileNumber,
//       candidateName: item.candidateName,
//       organisationName: item.organisationName,
//       userRole: item.userRole,
//       BookingDate: item.allocatedOn,
//       PaymentStatus: item?.paymentStatus === 'success' ? 'Done' : item?.paymentStatus === 'failure' ? 'Failed' : 'Pending'
//     }));

//     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

//     const wscols = [
//       { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 },{ wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }
//     ];
//     ws['!cols'] = wscols;

//     const wb: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
//     const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
//     link.download = fileName;
//     link.click();
//   }


//   applyFilter(event: Event) {
//     const filterValue = (event.target as HTMLInputElement).value;
//     this.dataSource.filter = filterValue.trim().toLowerCase();
//   }

//   downloadFile(fileName: string): void {
//     const url = this.serverUrl + fileName;
//     window.open(url, '_blank');
//   }
//   openPaymentModal(a: any) {
//     this.BookingCase = a;
//     this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
//       (result: string) => {
//         console.log("Modal closed" + result);
//       }
//     ).catch(() => { });

//   }

//   VerifyData(BookingData: any) {
//     this.loadingIndicator = true;
//     const startTime = new Date().getTime();
//     if (this.FileData) {
//       const formData = new FormData();
//       formData.append('BookingId', BookingData.bookingId);
//       formData.append('UserEmailId', BookingData.userId);
//       formData.append('CreatedBy', this.user_Email);
//       formData.append('FilePath', this.fileName);
//       formData.append('File', this.FileData);

//     //      console.log("Upload data Results:");
//     // formData.forEach((value, key) => console.log(`${key}: ${value}`));
//       this.CIFwebService.CIFResultsUploads(formData).subscribe({
//         next: (data: any) => {
//           const result = data.item1[0]['msg']; // Adjusted to match your stored procedure
//           const returnId = data.item1[0]['ReturnId'];

//           if (result === 'Success' && returnId !== '0') {
//             Swal.fire({
//               title: 'Uploaded Successfully!',
//               icon: 'success'
//             }).then(() => {
//               window.location.reload();
//             });
//           } else {
//             Swal.fire({
//               title: 'Already Uploaded Results for this Test',
//               icon: 'error'
//             }).then(() => {
//               window.location.reload();
//             });
//           }
//           const elapsed = new Date().getTime() - startTime;
//           const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

//           setTimeout(() => {
//             this.loadingIndicator = false;
//           }, remainingDelay);
//         },
//         error: () => {
//           Swal.fire({
//             title: 'Error',
//             text: 'Failed to Upload.',
//             icon: 'error'
//           });
//         }
//       });
//     }
//     else {
//       Swal.fire({
//         title: 'Error',
//         text: 'Kindly Upload File.',
//         icon: 'error'
//       });
//     }
//   }


//   onFileSelected(event: any): void {
//     this.fileStatus = false;
//     const reader = new FileReader();
//     const target = event.target as HTMLInputElement;
//     const file: File | null = (target.files as FileList)[0] || null;
//     if (file && file.size > 5148576) {
//       swal.fire({
//         title: 'File size exceeds 5MB. Please upload a smaller file.',
//         text: 'Invalid File size',
//         icon: 'warning'
//       });
//       target.value = '';
//       return;
//     }

//     const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
//     if (file && !fileNameRegex.test(file.name)) {
//       const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

//       const modifiedFile = new File([file], validFileName, { type: file.type });
//       const dataTransfer = new DataTransfer();
//       dataTransfer.items.add(modifiedFile);
//       target.files = dataTransfer.files;

//       this.fileData = modifiedFile;
//       this.fileStatus = true;

//       reader.readAsDataURL(modifiedFile);
//       reader.onload = () => {
//         const ssss = reader.result as string;
//         const ssssArray = ssss.split(',');
//         this.FileData = ssssArray[1];
//         this.fileName = validFileName;
//       };
//       this.uploadEnabled = true;
//       return;
//     }

//     this.fileData = file;
//     this.fileStatus = true;
//     // alert(10);
//     if (file) {
//       reader.readAsDataURL(file);
//       reader.onload = () => {
//         const ssss = reader.result as string;
//         const ssssArray = ssss.split(',');
//         this.FileData = ssssArray[1];
//         this.fileName = file.name;
//       };
//     }
//   }

//   UploadDocument() {
//   }
// }
