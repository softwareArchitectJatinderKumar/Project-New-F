import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatTableDataSource } from '@angular/material/table';
import { NgSelectComponent } from '@ng-select/ng-select';
import * as XLSX from 'xlsx';
import swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';

@Component({
  selector: 'app-AdminAssignTest',
  templateUrl: './AdminAssignTest.component.html',
  styleUrls: ['./AdminAssignTest.component.scss'],
})
export class AdminAssignTestComponent implements OnInit {

  @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
  @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
  @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
  @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
  @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
  @ViewChild('table') table: ElementRef;

  displayedColumns: string[] = ['instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples', 'totalCharges', 'remarks', 'bookingRequestDate'];
  dataSource: MatTableDataSource<any>;

  AllBookingTestsData: any[] = [];
  tmpsAllBookingTestsData: any[] = [];
  headHtmlData: any[] = [];

  currentPage = 1;
  itemsPerPage = 5;
  searchQuery: string = '';

  BookingCase: any;
  AssignedTo: any = '';
  InstrumentId: any;
  loadingIndicator = false;

  // User data from cookie
  UserRole: string = '';
  user_Email: string = '';
  candidateName: string = '';
  serverUrl: string = 'https://files.lpu.in/umsweb/CIFDocuments/'; //  this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/
  supervisorName: any;
  departmentName: any;

  // Pagination record size options
  recordSizeOptions = [5, 10, 20, 50];

  constructor(
    private CIFwebService: LpuCIFWebService,
    private modalService: NgbModal, private fb: FormBuilder,
    private router: Router,
    private cookieService: CookieService) { }

  ngOnInit(): void {
    const GetCookieData = this.cookieService.get('authData');
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
    this.user_Email = retrievedCookies.EmailId;
    this.supervisorName = retrievedCookies.SupervisorName;
    this.departmentName = retrievedCookies.DepartmentName;
    this.candidateName = retrievedCookies.CandidateName;

    this.getAllPaymentDetails();
    this.getAllAssignedTest();
    this.getAllCifUserList();
  }

  loadUserFromCookies(): void {
    const cookieData = this.cookieService.get('authData');

    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData);
        this.UserRole = parsed.UserRole || '';
        this.user_Email = parsed.EmailId || '';
        this.candidateName = parsed.CandidateName || '';
      } catch (err) {
        console.error('Error parsing authData cookie:', err);
        swal.fire('Session Error', 'Invalid session data. Please login again.', 'error');
        this.router.navigate(['/Home']);
      }
    } else {
      swal.fire('Session Expired', 'Please login again to continue.', 'warning');
      this.router.navigate(['/Home']);
    }
  }

  get filteredAllBookingTestsData(): any[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.AllBookingTestsData;

    return this.AllBookingTestsData.filter((booking) =>
      booking.instrumentName.toLowerCase().includes(query) ||
      booking.analysisType.toLowerCase().includes(query)
    );
  }

  getAllPaymentDetails(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllBookingTests().subscribe({
      next: (response) => {
        if (response.item1 && response.item1.length > 0) {
          this.AllBookingTestsData = response.item1;
          this.originalData = [...this.AllBookingTestsData];
          this.dataSource = new MatTableDataSource(response.item1);
          this.tmpsAllBookingTestsData = response.item1;
          this.headHtmlData = response.item1[0];
        } else {
          this.AllBookingTestsData = [];
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 1.5s

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: (err) => {
        console.error('Failed to load booking tests:', err);
      }
    });
  }

  originalData: any[] = []; // Loaded from API
  filteredData: any[] = [];
  selectedStatus: string = '';

  filterData(): void {
    if (this.selectedStatus === '') {
      this.tmpsAllBookingTestsData = [...this.originalData]; // Show all data
    } else if (this.selectedStatus === 'null') {
      this.tmpsAllBookingTestsData = this.originalData.filter(item => item.paymentStatus === null || item.paymentStatus === 'null');
    } else {
      this.tmpsAllBookingTestsData = this.originalData.filter(item => item.paymentStatus === this.selectedStatus);
    }
    this.currentPage = 1; // Reset to first page after filtering
  }

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Success', value: 'success' },
    { label: 'Failure', value: 'failure' },
    { label: 'Pending', value: 'null' }
  ];

  AllAssignedTest: any;
  getAllAssignedTest(): void {
    this.CIFwebService.GetAllUploadedResultsByStaff().subscribe({
      next: (response) => {
        if (response.item1 && response.item1.length > 0) {
          this.AllAssignedTest = response.item1;
        } else {
          this.AllAssignedTest = [];
        }
      },
      error: (err) => {
        console.error('Failed to load assigned tests:', err);
      }
    });
  }

  assignedTests: any[] = []; // This should be filled from your assigned tests API

  isAlreadyAssigned(row: any): boolean {
    return this.assignedTests.some(test =>
      test.bookingId === row.bookingId &&
      test.returnMessage !== 'No Details'
    );
  }

  getTotalPages(): number {
    return Math.ceil(this.tmpsAllBookingTestsData.length / this.itemsPerPage);
  }

  getCurrentPageData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.tmpsAllBookingTestsData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  exportToExcel(): void {
    const exportedData = this.AllBookingTestsData.map(item => ({
      BookingId: item.bookingId,
      InstrumentName: item.instrumentName,
      SampleCount: item.noOfSamples,
      TotalCharges: item.totalCharges,
      RequestDate: item.bookingRequestDate,
      EmailId: item.userEmailId,
      CandidateName: item.candidateName,
      OrganisationName: item.organisationName,
      UserType: item.userRole,
      PaymentStatus: item.paymentStatus == 'success' ? 'Paid' : item?.paymentStatus == 'failure' ? 'Failed' : 'Pending',
      PaymentDate: item.paymentDate,
      AssignedTo: item.assignedUserId
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    ws['!cols'] = Array(19).fill({ wpx: 220 });

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = 'Assigned_Details_report.xlsx';
    link.click();
  }

  openPaymentModal(item: any): void {
    this.BookingCase = item;
    this.AssignedTo = ''; // Reset assigned staff selection on modal open
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result
      .then((result: string) => console.log('Modal closed:', result))
      .catch(() => { });
  }

  onActivitySelected(event: any): void {
    this.AssignedTo = event.target.value;
  }

  VerifyData(AssignTest: any): void {
    if (!this.AssignedTo) {
      swal.fire('Select Staff', 'Please select a staff member to assign.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('BookingId', AssignTest.bookingId);
    formData.append('InstrumentId', AssignTest.instrumentId);
    formData.append('UserId', AssignTest.userEmailId);
    formData.append('AssignedTo', this.AssignedTo);
    console.log("Tests Assigned to :");
    formData.forEach((value, key) => console.log(`${key}: ${value}`));
    this.CIFwebService.CIFAssignTestToStaff(formData).subscribe({
      next: (data: any) => {
        const result = data.item1?.[0]?.msg || '';

        const alertMap: Record<'Success' | 'Failed' | 'Default', { title: string; icon: any }> = {
          Success: { title: 'Action Planned Stored Successfully!', icon: 'success' },
          Failed: { title: 'Test is already Assigned', icon: 'error' },
          Default: { title: 'Something Went Wrong, Try again later', icon: 'error' }
        };

        const alert = alertMap[result as keyof typeof alertMap] || alertMap.Default;

        swal.fire({ title: alert.title, icon: alert.icon }).then(() => {
          this.modalService.dismissAll(); // Close modal
          this.getAllPaymentDetails(); // Refresh booking tests
          this.getAllAssignedTest(); // Refresh assigned tests
        });
      },
      error: () => {
        swal.fire({
          title: 'Error',
          text: 'Failed to Upload.',
          icon: 'error'
        }).then(() => this.modalService.dismissAll());
      }
    });
  }

  search() {
    const query = this.searchQuery.toLowerCase();
    this.tmpsAllBookingTestsData = this.AllBookingTestsData.filter(item => {
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );
    });
  }

  downloadFile(fileName: string): void {
    const url = this.serverUrl + fileName;
    window.open(url, '_blank');
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.dataSource) {
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }

  AllCifUserList = [
    {
      uid: '24374',
      uiD_Name: 'Dr. Vijay Kumar'
    },
    {
      uid: '20362',
      uiD_Name: 'Dr. Nupur Prasad '
    },
    {
      uid: '16477',
      uiD_Name: 'Mr. Prashant Kumar '
    },
    {
      uid: '27727',
      uiD_Name: 'Dr. Nabaparna Chakraborty '
    },
    {
      uid: '26918',
      uiD_Name: 'Ms. Baljit Bangar'
    },
    {
      uid: '30694',
      uiD_Name: 'Ms. Amandeep Kaur'
    },
    {
      uid: '29159',
      uiD_Name: 'Ms. Kamlash Rani '
    },
    {
      uid: '31691',
      uiD_Name: 'Mr. Sameer Singh Pathania'
    },
    {
      uid: '33476',
      uiD_Name: 'Mr. Sanjeev Verma '
    },
  ];

  getAllCifUserList(): void {
    this.CIFwebService.GetAllUserLists().subscribe({
      next: (response) => {
        if (response.item1 && response.item1.length > 0) {
          this.AllCifUserList = response.item1;
        } else {
          this.AllCifUserList = [];
        }
      },
      error: (err) => {
        console.error('Failed to get UIDS:', err);
      }
    });
  }

  getTotalRecords(): number {
    return this.tmpsAllBookingTestsData ? this.tmpsAllBookingTestsData.length : 0;
  }

  // Handle record size dropdown change
  onRecordSizeChange(event: any): void {
    this.itemsPerPage = +event.target.value;
    this.currentPage = 1; // Reset to first page
  }





  IsAssigned: string = '';
  getAssignedData(): void {
    if (this.IsAssigned === '') {
      // Show all data
      this.tmpsAllBookingTestsData = [...this.originalData];
    } else if (this.IsAssigned === 'Assigned') {
      // Filter items where assignedUser Id exists and is non-empty string
      this.tmpsAllBookingTestsData = this.originalData.filter(item =>
        item.assignedUserId && item.assignedUserId.trim().length > 0
      );
    } else if (this.IsAssigned === 'Pending') {
      // Filter items where assignedUser Id is null, undefined, or empty string
      this.tmpsAllBookingTestsData = this.originalData.filter(item =>
        !item.assignedUserId || item.assignedUserId.trim().length === 0
      );
    } else {
      // Default fallback: show all data
      this.tmpsAllBookingTestsData = [...this.tmpsAllBookingTestsData];
    }
    this.currentPage = 1; // Reset to first page after filtering
  }


  assignedOptions = [
    { label: 'All', value: '' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'Pending', value: 'Pending' }
  ];

  hasAnySearchCriteria: any;

  checkSearchCriteria(): void {
    this.hasAnySearchCriteria =
      (this.selectedStatus && this.selectedStatus.trim() !== '') ||
      (this.IsAssigned && this.IsAssigned.trim() !== '');
  }

  advancedSearch = {
    paymentType: '',
    assignedTo: ''

  };

  applyAdvancedSearch(): void {
    this.tmpsAllBookingTestsData = this.originalData.filter(item => {
      let matches = true;

      // Filter by Payment Status
      if (this.selectedStatus) {
        if (this.selectedStatus === 'null') {
          matches = matches && (!item.paymentStatus || item.paymentStatus === 'null');
        } else {
          matches = matches && (item.paymentStatus === this.selectedStatus);
        }
      }

      // Filter by Assignment
      if (this.IsAssigned) {
        if (this.IsAssigned === 'Assigned') {
          matches = matches && (item.assignedUserId && item.assignedUserId.trim().length > 0);
        } else if (this.IsAssigned === 'Pending') {
          matches = matches && (!item.assignedUserId || item.assignedUserId.trim().length === 0);
        }
      }

      return matches;
    });

    // Sort results by bookingRequestDate (if present)
    this.tmpsAllBookingTestsData.sort((a, b) => {
      const dateA = a.bookingRequestDate ? new Date(a.bookingRequestDate).getTime() : 0;
      const dateB = b.bookingRequestDate ? new Date(b.bookingRequestDate).getTime() : 0;
      return dateA - dateB;
    });

    this.currentPage = 1; // Reset to first page
  }


  resetAdvancedSearch(): void {
    this.selectedStatus = '';
    this.IsAssigned = '';
    this.hasAnySearchCriteria = false;
    this.tmpsAllBookingTestsData = [...this.originalData];
    this.currentPage = 1;
  }

  showAdvancedSearch = false;
  showDateSearch = false;

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
    if (!this.showAdvancedSearch) {
      this.resetAdvancedSearch();
    }
  }


  // 18 sept-25
  @ViewChild('editEventModal') editEventModal: TemplateRef<any>;
  editEvent: any = {};
  selectedFile: File | null = null;

  // Open modal and load selected event
  // openEditModal(eventData: any) {
  //   this.editEvent = { ...eventData }; // clone object
  //   this.selectedFile = null;
  //   this.modalService.open(this.editEventModal, { centered: true, size: 'lg' });
  // }

  openEditModal(eventData: any) {
    this.editEvent = { ...eventData }; // clone object

    this.modalService.open(this.editEventModal, { centered: true, size: 'lg' });
  }



  CIFTestReassignForm!: FormGroup; isForm1Submitted: boolean = false; isSubmitted = false;
  isLoading: boolean = false;

  get form1() {
    return this.CIFTestReassignForm.controls;
  }

  LoadNewForm() {
    this.CIFTestReassignForm = this.fb.group({
      EventName: ['', Validators.required],
      EventDate: ['', Validators.required],
      EventDetails: ['', Validators.required],
      ImageUrl: ['']
    });
  }
  get isImageValid(): boolean {
    // Valid if either a new file is selected or existing image URL is present
    return !!this.selectedFile || !!this.editEvent?.imageUrl;
  }

  // get isImageValid(): boolean {
  //   // If editing and existing image present, valid
  //   if (this.editEvent?.imageUrl) {
  //     return true;
  //   }
  //   // Otherwise, require a selected file
  //   return this.selectedFile != null;
  // }



  ReAssginStaff(AssignTest: any): void {
    if (!this.AssignedTo) {
      swal.fire('Select Staff', 'Please select a staff member to assign.', 'warning');
      return;
    }
    const formData = new FormData();
    formData.append('RecordId', AssignTest.recordId);
    formData.append('UserId', AssignTest.userEmailId);
    formData.append('AssignedTo', this.AssignedTo);
    // console.log("Tests Assigned to :");
    // formData.forEach((value, key) => console.log(`${key}: ${value}`));
    this.CIFwebService.ReAssignTestToStaff(formData).subscribe({
      next: (data: any) => {
        const result = data.item1?.[0]?.msg || '';

        const alertMap: Record<'Success' | 'Failed' | 'Default', { title: string; icon: any }> = {
          Success: { title: 'Action Planned Stored Successfully!', icon: 'success' },
          Failed: { title: 'Test is already Assigned', icon: 'error' },
          Default: { title: 'Something Went Wrong, Try again later', icon: 'error' }
        };

        const alert = alertMap[result as keyof typeof alertMap] || alertMap.Default;

        swal.fire({ title: alert.title, icon: alert.icon }).then(() => {
          this.modalService.dismissAll(); // Close modal
          this.getAllPaymentDetails(); // Refresh booking tests
          this.getAllAssignedTest(); // Refresh assigned tests
        });
      },
      error: () => {
        swal.fire({
          title: 'Error',
          text: 'Failed to Upload.',
          icon: 'error'
        }).then(() => this.modalService.dismissAll());
      }
    });
  }




}
