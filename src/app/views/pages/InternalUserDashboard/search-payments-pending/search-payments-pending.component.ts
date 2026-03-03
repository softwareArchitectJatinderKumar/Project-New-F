import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import Swal from 'sweetalert2';
import { LoginSessionService } from 'src/app/_services/login-session.service';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Component Constants
const FILE_SIZE_LIMIT = 1048576; // 1MB in bytes
interface UploadProofRecord {
  bookingId: string;
  instrumentName: string;
  noOfSamples: number;
  totalCharges: number;
  requestDate: string;
  proofRemarks: string;
  isProofApproved: string;
  proofApprovedOn: string | null;
  receiptProofFile: string | null;
  [key: string]: unknown;
}

interface ApiResponse {
  item1: UploadProofRecord[];
}


@Component({
  selector: 'app-search-payments-pending',
  templateUrl: './search-payments-pending.component.html',
  styleUrls: ['./search-payments-pending.component.scss']
})
export class SearchPaymentsPendingComponent implements OnInit {
  // ============================================
  // Template References (matching original template names)
  // ============================================
  @ViewChild('viewDescModal2') viewDescModal2!: TemplateRef<any>;
  @ViewChild('viewDescModal5') viewDescModal5!: TemplateRef<any>;
  @ViewChild('PaymentReceiptUploadModal') PaymentReceiptUploadModal!: TemplateRef<any>;
  @ViewChild('table') table!: ElementRef;

  // ============================================
  // Properties - Data
  // ============================================
  BookingCase: any;
  BookingStatusData: any[] = [];
  tmpsBookingStatusData: any[] = [];
  PaymentReceipt: any;
  paymentData: any;

  // ============================================
  // Properties - Pagination
  // ============================================
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions: number[] = [10, 20, 30, 40, 50];

  // ============================================
  // Properties - Search & Filter
  // ============================================
  searchQuery = '';

  // ============================================
  // Properties - File Upload
  // ============================================
  ReceiptRemarks = '';
  FileDataX: string | null = null;
  fileDataX: any;
  fileStatus: any;
  fileName: any;
  fileChosen: { [key: number]: boolean } = {};
  validationForm1!: FormGroup;
  isForm1Submitted = false;

  // ============================================
  // Properties - User Session
  // ============================================
  userId: string = '';
  userEmail: string = '';
  mobileNo: string = '';
  supervisorName: string = '';
  departmentName: string = '';
  candidateName: string = '';
  userRole: string = '';

  // ============================================
  // Properties - UI State
  // ============================================
  loadingIndicator = false;
  serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';
  responseUrl = '';
  TypeId = 'CIF';

  // ============================================
  // Properties - Payment Proof Status
  // ============================================
  uploadProofStatusData: any[] = [];
  filteredData: any[] = [];
  paymentProofStatus: { [bookingId: string]: { hasProof: boolean; proofFile?: string; isApproved?: string } } = {};

  // ============================================
  // Properties - Route Parameters
  // ============================================
  id: string | null = null;
  status: string | null = null;
  type: string | null = null;
  transactionNo: string | null = null;
  hashedValue: string | null = null;
  course: string | null = null;
  keyNote: string | null = null;

  // ============================================
  // Constructor
  // ============================================
  constructor(
    private CIFwebService: LpuCIFWebService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private authSession: LoginSessionService,
    private route: ActivatedRoute,
    private cookieService: CookieService
  ) {}

  // ============================================
  // Lifecycle Hooks
  // ============================================
  ngOnInit(): void {
    this.initializeForm();
    this.initializeUserSession();
    this.initializeRouteParams();
    this.getBookingDetails();
  }

  // ============================================
  // Initialization Methods
  // ============================================
  private initializeForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  private initializeUserSession(): void {
    const cookieData = this.cookieService.get('InternalUserAuthData');
    const retrievedCookies = JSON.parse(cookieData);

    // Use proper property names from cookie - match original code's property access
    this.userRole = retrievedCookies.UserRole || 'Internal User';
    this.userId = retrievedCookies.Id || retrievedCookies.EmailId;
    this.userEmail = retrievedCookies.EmailId;
    this.mobileNo = retrievedCookies.MobileNo;
    this.supervisorName = retrievedCookies.SupervisorName;
    this.departmentName = retrievedCookies.DepartmentName;
    this.candidateName = retrievedCookies.CandidateName;

    // Set response URL
    const baseUrl = `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}`;
    this.responseUrl = `${baseUrl}/SearchPendingPayments`;

    this.fetchPaymentProofDetailsForUser();
  }

  private initializeRouteParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.keys.length > 0) {
        this.getParams();
      }
    });
  }


  private fetchPaymentProofDetailsForUser(): void {
  

    this.CIFwebService.GetBookingPaymentProofDetails(this.userId).subscribe({
      next: (response: ApiResponse) => {
        this.handleApiResponse(response);
      },
      error: (error) => {
        console.error('Error fetching payment proof details:', error);
        this.loadingIndicator = false;
      }
    });
  }

  private handleApiResponse(response: ApiResponse): void {
    if (response.item1 && response.item1.length > 0) {
      this.uploadProofStatusData = response.item1;
      this.filteredData = [...this.uploadProofStatusData];
    } else {
      this.uploadProofStatusData = [];
      this.filteredData = [];
    }
  }


  // ============================================
  // Data Loading Methods
  // ============================================
  getBookingDetails(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();

    this.CIFwebService.GetUserPaymentStatusDetails(this.userId).subscribe({
      next: (response: any) => {
        if (response.item1 && response.item1.length > 0) {
          this.BookingStatusData = response.item1;
          this.tmpsBookingStatusData = response.item1.filter((item: any) =>
            item.paymentStatus == null ||
            item.paymentStatus?.toLowerCase() === 'failure'
          );
          
          if (this.tmpsBookingStatusData.length > 0) {
            this.fetchPaymentProofDetails(this.tmpsBookingStatusData);
          }
        } else {
          this.BookingStatusData = [];
          this.tmpsBookingStatusData = [];
        }

        this.delayLoading(startTime);
      },
      error: (error: any) => {
        console.error('Error loading payment data:', error);
        this.loadingIndicator = false;
      }
    });
  }

  private delayLoading(startTime: number): void {
    const elapsed = new Date().getTime() - startTime;
    const remainingDelay = Math.max(1500 - elapsed, 0);

    setTimeout(() => {
      this.loadingIndicator = false;
    }, remainingDelay);
  }

  // ============================================
  // Payment Proof Methods
  // ============================================
  
  private fetchPaymentProofDetails(bookingIds: any[]): void {
    // Fetch proof details for each booking
    bookingIds.forEach((bookingId: string) => {
      this.CIFwebService.GetBookingPaymentProofDetails(bookingId).subscribe({
        next: (response: any) => {
          if (response && response.item1 && response.item1.length > 0) {
            const proofData = response.item1[0];
            this.paymentProofStatus[bookingId] = {
              hasProof: true,
              proofFile: proofData.receiptProofFile || proofData.proofFile || null,
              isApproved: proofData.isProofApproved || proofData.isApproved || null
            };
          } else {
            this.paymentProofStatus[bookingId] = {
              hasProof: false
            };
          }
        },
        error: (error) => {
          console.error('Error fetching payment proof for booking:', bookingId, error);
          this.paymentProofStatus[bookingId] = {
            hasProof: false
          };
        }
      });
    });
  }

  hasProofUploaded(bookingId: any): boolean {
    // Check if bookingId exists in uploadProofStatusData (populated by fetchPaymentProofDetailsForUser)
    return this.uploadProofStatusData.some(
      (proof: any) => String(proof.bookingId) === String(bookingId)
    );
  }

  // ============================================
  // Search & Filter Methods
  // ============================================
  search(): void {
    const query = this.searchQuery.toLowerCase();
    
    if (!query.trim()) {
      // If search is empty, show pending payments (filtered from all data)
      this.tmpsBookingStatusData = this.BookingStatusData.filter((item: any) =>
        item.paymentStatus == null ||
        item.paymentStatus?.toLowerCase() === 'failure'
      );
    } else {
      // Filter based on search query
      this.tmpsBookingStatusData = this.BookingStatusData.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(query)
        )
      );
    }
    this.currentPage = 1; // Reset to first page on search
  }

  // ============================================
  // Pagination Methods
  // ============================================
  getTotalPages(): number {
    return Math.ceil(this.tmpsBookingStatusData.length / this.itemsPerPage);
  }

  getCurrentPageData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.tmpsBookingStatusData.slice(startIndex, endIndex);
  }

  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1; // Reset to first page when changing page size
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

  // ============================================
  // Modal Methods
  // ============================================
  paymentReceiptScreen(data: any): void {
    this.PaymentReceipt = data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
      (result: string) => console.log('Modal closed:', result),
      () => {}
    );
  }

  openPaymentModal(booking: any): void {
    // Ensure booking data is properly set before opening modal
    if (!booking || !booking.bookingId) {
      Swal.fire({
        title: 'Error',
        text: 'Invalid booking data',
        icon: 'error'
      });
      return;
    }
    
    this.BookingCase = booking;
    this.modalService.open(this.viewDescModal5, { size: 'sm' }).result.then(
      (result: string) => console.log('Modal closed:', result),
      () => {}
    );
  }

  openReceiptUploadModal(booking: any): void {
    this.BookingCase = booking;
    this.loadForm();
    this.modalService.open(this.PaymentReceiptUploadModal, { size: 'lg', centered: true }).result.then(
      (result: string) => console.log('Modal closed:', result),
      () => {}
    );
  }

  // ============================================
  // Form Methods
  // ============================================
  get form1() {
    return this.validationForm1.controls;
  }

  loadForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  // ============================================
  // File Upload Methods
  // ============================================
  onFileXSelected(event: any, id: number): void {
    this.fileChosen[id] = event.target.files.length > 0;
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;

    if (!file) return;

    // Check file size
    if (file.size > FILE_SIZE_LIMIT) {
      Swal.fire({
        title: 'File size exceeds 5 MB',
        text: 'Please upload a smaller file.',
        icon: 'warning'
      });
      target.value = '';
      return;
    }

    // Check file name validity
    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!fileNameRegex.test(file.name)) {
      const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const modifiedFile = new File([file], validFileName, { type: file.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(modifiedFile);
      target.files = dataTransfer.files;

      this.fileDataX = modifiedFile;
      this.fileStatus = true;

      const reader = new FileReader();
      reader.readAsDataURL(modifiedFile);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        this.FileDataX = base64Data;
        this.fileName = validFileName;
      };
      return;
    }

    this.fileDataX = file;
    this.fileStatus = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      this.FileDataX = base64Data;
      this.fileName = file.name;
    };
  }

  UpdateFileDocument(Id: number): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();

    if (this.fileChosen[Id]) {
      const formData = new FormData();
      formData.append('BookingId', Id.toString());
      formData.append('ReceiptRemarks', this.ReceiptRemarks);
      formData.append('PaymentReceiptUrl', this.fileName || '');
      formData.append('PaymentReceiptData', this.FileDataX || '');
      formData.append('UserId', this.userId);

      this.CIFwebService.UploadPaymentReceipt(formData).subscribe({
        next: (data: any) => {
          // Check returnId for status: 1 = Success, 0 = Failed, -1 = Already Existed
          const returnId = data.item1[0]?.returnId;
          const message = data.item1[0]?.msg;
          
          if (returnId === 1) {
            Swal.fire({
              title: 'Upload Successful',
              text: 'Receipt saved successfully!',
              icon: 'success'
            }).then(() => {
              window.location.reload();
            });
          } else if (returnId === -1) {
            Swal.fire({
              title: 'Receipt Already Exists',
              text: message || 'A receipt has already been uploaded for this booking.',
              icon: 'warning',
              // timer: 3000,
              // showConfirmButton: true
            }).then(() => {
              window.location.reload();
            });
          } else if (returnId === 0) {
            Swal.fire({
              title: 'Upload Failed',
              text: message || 'Failed to upload receipt. Please try again.',
              icon: 'error',
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            // Fallback for unexpected response format
            Swal.fire({
              title: 'Upload Result',
              text: message || 'Unknown response from server.',
              icon: 'info',
              timer: 2000,
              showConfirmButton: false
            });
          }

          this.delayLoading(startTime);
        },
        error: (error: any) => {
          Swal.fire({
            title: 'Error',
            text: 'Internal Server error',
            icon: 'error',
            showConfirmButton: false
          });
          this.loadingIndicator = false;
        }
      });
    }
  }

  // ============================================
  // Payment Methods
  // ============================================
  VerifyData(BookingCase: any): void {
    // Validate required data before making API call
    if (!BookingCase || !BookingCase.bookingId) {
      Swal.fire({
        title: 'Error',
        text: 'Invalid booking data. Please try again.',
        icon: 'error',
      });
      return;
    }

    // Validate user session data
    if (!this.userEmail || !this.mobileNo || !this.candidateName) {
      Swal.fire({
        title: 'Session Error',
        text: 'User session data is missing. Please login again.',
        icon: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('BookingId', BookingCase.bookingId);
    formData.append('InstrumentId', BookingCase.instrumentId);
    formData.append('CandidateName', this.candidateName);
    formData.append('Amount', BookingCase.amount);
    formData.append('Type', this.TypeId);
    formData.append('UserEmailId', this.userEmail);
    formData.append('MobileNo', this.mobileNo);
    formData.append('FacultyCode', this.userEmail);
    formData.append('ResponseUrl', this.responseUrl);

    this.loadingIndicator = true;

    forkJoin({
      payment: this.CIFwebService.MakePaymentforTest(formData),
    }).subscribe({
      next: (results: any) => {
        this.paymentData = results;
        
        // Check if results exist and have the expected structure
        if (results && results.payment && results.payment.item1 && results.payment.item1.length > 0) {
          const paymentUrlData = results.payment.item1[0].url;
          
          if (paymentUrlData && paymentUrlData.length > 0) {
            // Redirect to payment URL
            window.location.href = paymentUrlData;
          } else {
            this.loadingIndicator = false;
            Swal.fire({
              title: 'Error Occurred, Try Again Later',
              text: 'Payment URL not found!',
              icon: 'error',
            });
          }
        } else {
          this.loadingIndicator = false;
          Swal.fire({
            title: 'Error',
            text: 'Invalid response from payment server. Please try again.',
            icon: 'error',
          });
        }
      },
      error: (error: any) => {
        console.error('Error during API call: ', error);
        this.loadingIndicator = false;
        Swal.fire({
          title: 'Payment Gateway Error',
          text: 'Unable to connect to payment server. Please try again later.',
          icon: 'error',
        });
      },
    });
  }

  // ============================================
  // Route Params Methods
  // ============================================
  getParams(): void {
    this.route.queryParamMap.subscribe(params => {
      this.id = params.get('id');
      this.status = params.get('status');
      this.type = params.get('type');
      this.transactionNo = params.get('transactionNo');
      this.hashedValue = params.get('hashedValue');
      this.course = params.get('Course');
      this.keyNote = params.get('KeyNote');

      const formData = new FormData();
      formData.append('Id', this.id || '');
      formData.append('Status', this.status || '');
      formData.append('Type', this.type || '');
      formData.append('TransactionNo', this.transactionNo || '');
      formData.append('Course', this.course || '');
      formData.append('KeyNote', this.keyNote || '');
      formData.append('HashedValue', this.hashedValue || '');

      this.CIFwebService.GetDecodePaymentStatusDetails(formData).subscribe({
        next: (result: any) => {
          if (result?.status === 'failure') {
            Swal.fire({
              title: 'Payment Failed',
              icon: 'error'
            });
          } else if (result?.status === 'success') {
            Swal.fire({
              title: 'Payment Made Successfully',
              icon: 'success'
            });
          }
        }
      });
    });
  }

  // ============================================
  // Export Methods
  // ============================================
  exportToExcel(): void {
    const fileName = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingStatusData.map(item => ({
      BookingId: item.bookingId,
      InstrumentName: item.instrumentName,
      Samples: item.noOfSamples,
      RequestDate: item.bookingRequestDate
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    const wscols = [
      { wpx: 120 }, { wpx: 180 }, { wpx: 100 }, { wpx: 120 }
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

  // ============================================
  // Print Methods
  // ============================================
  printReceipt(): void {
    const modalContent = document.getElementById('receiptData');
    if (!modalContent) {
      console.error('Modal content not found');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.error('Failed to open iframe document');
      return;
    }

    iframeDoc.open();
    iframeDoc.write('<html><head><title>Payment Receipt</title>');

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join(' ');
        } catch (e) {
          return '';
        }
      })
      .join(' ');

    iframeDoc.write(`<style>${styles}</style>`);
    iframeDoc.write('</head><body>');

    const clonedContent = modalContent.cloneNode(true) as HTMLElement;
    const printButton = clonedContent.querySelector('button');
    if (printButton) {
      printButton.style.display = 'none';
    }

    iframeDoc.write(clonedContent.innerHTML);
    iframeDoc.write('</body></html>');
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      iframe.onload = () => {
        document.body.removeChild(iframe);
      };
    };
  }

  // ============================================
  // Apply Filter (unused, kept for compatibility)
  // ============================================
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    // This was used with MatTableDataSource, keeping for compatibility
  }
}
