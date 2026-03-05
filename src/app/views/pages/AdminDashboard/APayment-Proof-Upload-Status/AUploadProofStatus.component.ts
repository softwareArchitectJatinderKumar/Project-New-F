import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { AuthService } from 'src/app/_services/auth.service';
import { StorageService } from 'src/app/_services/storage.service';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';

import { ColumnMode } from '@swimlane/ngx-datatable';

import swal from 'sweetalert2';
import Swal from 'sweetalert2';

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
  selector: 'app-upload-proof-status',
  templateUrl: './AUploadProofStatus.component.html',
  styleUrls: ['./AUploadProofStatus.component.scss']
})
export class AUploadProofStatusComponent implements OnInit {
  // Template references
  @ViewChild('dataTable') dataTable!: ElementRef<HTMLTableElement>;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Search
  searchQuery = '';

  // Data
  uploadProofStatusData: UploadProofRecord[] = [];
  filteredData: UploadProofRecord[] = [];

  // UI State
  loadingIndicator = false;

  // User info
  userId = 'null';
  userRole = '';
  userEmail = '';

  // Modal data
  samplesCase: UploadProofRecord | null = null;

  // Server config
  private readonly serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/';

  // Column definitions
  readonly displayedColumns = [
    'instrumentName',
    'analysisType',
    'analysisCharges',
    'noOfSamples',
    'totalCharges',
    'remarks',
    'SamplesRequestDate',
    'Uploaded Proof'
  ];

  ColumnMode = ColumnMode;
  columns: string[] = [];
  Math = Math;

   downloadFile(fileName: string): void {
    const url = this.serverUrl + fileName;
    this.onDownloadFile(url);
    // window.open(url, '_blank');
  }


  
     onDownloadFile(remoteUrl: string): void {
       Swal.fire({ title: 'Downloading...', didOpen: () => { swal.showLoading(null); }});
    
        this.cifWebService.downloadFile(remoteUrl).subscribe({
          next: (blob: Blob) => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
    
            const fileName = remoteUrl.split('/').pop() || 'Document.pdf';
            link.download = fileName;
    
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
    
            swal.close();
          },
          error: async (err) => {
            swal.close();
            if (err.error instanceof Blob) {
              const errorMsg = JSON.parse(await err.error.text());
              swal.fire('Error', errorMsg.message || 'Download failed', 'error');
            } else {
              swal.fire('Error', 'Could not connect to the server', 'error');
            }
          }
        });
      }
    
  constructor(
    private cifWebService: LpuCIFWebService,
    private storageService: StorageService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private authSession: LoginSessionService,
    private router: Router,
    private route: ActivatedRoute,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.loadUserSession();
    this.loadUserFromCookie();
    this.fetchPaymentProofDetails();
  }

  private loadUserSession(): void {
    const sessionData = this.authSession.getSession();
    if (sessionData.length > 0) {
      this.userEmail = sessionData[0][0]?.['userEmail'] || '';
    }
  }
user_Email: any; UserRole:any; candidateName:any;
  private loadUserFromCookie(): void {

     const GetCookieData = this.cookieService.get('authData');
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserRole = retrievedCookies.UserRole;
    this.user_Email = retrievedCookies.EmailId;
    this.candidateName = retrievedCookies.CandidateName;


    
  }

  private fetchPaymentProofDetails(): void {
    this.loadingIndicator = true;
    const startTime = Date.now();

    this.cifWebService.GetBookingPaymentProofDetails('0').subscribe({
      next: (response: ApiResponse) => {
        this.handleApiResponse(response);
        this.ensureMinimumLoadingTime(startTime);
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
      this.initializeTableColumns();
    } else {
      this.uploadProofStatusData = [];
      this.filteredData = [];
    }
  }

  private initializeTableColumns(): void {
    if (this.filteredData.length > 0) {
      const firstRow = this.filteredData[0];
      this.columns = Object.keys(firstRow).filter(
        (key) => !['ResultFile', 'userId', 'id', 'analysisId'].includes(key)
      );
    }
  }

  private ensureMinimumLoadingTime(startTime: number): void {
    const elapsed = Date.now() - startTime;
    const minimumDelay = 500;
    const remainingDelay = Math.max(minimumDelay - elapsed, 0);

    setTimeout(() => {
      this.loadingIndicator = false;
    }, remainingDelay);
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredData = [...this.uploadProofStatusData];
    } else {
      this.filteredData = this.uploadProofStatusData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(query)
        )
      );
    }

    this.currentPage = 1;
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  getCurrentPageData(): UploadProofRecord[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get hasPrevPage(): boolean {
    return this.currentPage > 1;
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.hasPrevPage) {
      this.currentPage--;
    }
  }

  // Export to Excel
  exportToExcel(): void {
    const fileName = 'Payment_Proof_Details.xlsx';
    const exportedData = this.uploadProofStatusData.map((item) => ({
      BookingId: item.bookingId,
      InstrumentName: item.instrumentName,
      NumberOfSamples: item.noOfSamples,
      TotalCharges: item.totalCharges,
      RequestDate: item.requestDate,
      ProofRemarks: item.proofRemarks,
      Status: this.getStatusLabel(item.isProofApproved)
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    const wscols = [
      { wpx: 120 },
      { wpx: 150 },
      { wpx: 120 },
      { wpx: 100 },
      { wpx: 120 },
      { wpx: 150 },
      { wpx: 100 }
    ];
    ws['!cols'] = wscols;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PaymentProof');

    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
  }

  // Status helper
  getStatusLabel(isApproved: string | undefined): string {
    if (isApproved === '1') return 'Accepted';
    if (isApproved === '0') return 'Rejected';
    return 'Pending';
  }

  getStatusClass(isApproved: string | undefined): string {
    if (isApproved === '1') return 'status-accepted';
    if (isApproved === '0') return 'status-rejected';
    return 'status-pending';
  }

  // Check if data exists
  get hasData(): boolean {
    return this.uploadProofStatusData.length > 0;
  }

  get hasFilteredData(): boolean {
    return this.filteredData.length > 0;
  }
}
