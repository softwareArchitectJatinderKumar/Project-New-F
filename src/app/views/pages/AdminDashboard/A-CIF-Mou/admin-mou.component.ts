import {
  Component,
  OnInit,
  OnDestroy,   // FIX 3: was missing from implements — ngOnDestroy was never called by Angular
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import {
  MOUCrudOperation,
  MouRecord,
  MouApprovePayload,
  MouDeletePayload,
} from 'src/app/_services/mou-crud-operation.service';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { StorageService } from 'src/app/_services/storage.service';
import { AuthService } from 'src/app/_services/auth.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';

@Component({
  selector: 'admin-mou',
  templateUrl: './admin-mou.component.html',
  styleUrls: ['./admin-mou.component.scss'],
})
export class AdminMouComponent implements OnInit, OnDestroy {

  @ViewChild('remarksModal') remarksModal!: TemplateRef<any>;

  private readonly destroy$ = new Subject<void>();

  // ── Session ───────────────────────────────────────────────────────────────
  adminEmail    = '';
  adminName     = '';
  userRole      = '';
  userEmail     = '';
  candidateName = '';
  serverUrl = '';
  ServerUrl ='';
  // ── Data ──────────────────────────────────────────────────────────────────
  mouList:   MouRecord[] = [];
  isLoading  = false;
  processing = false;

  // ── Filter & search ───────────────────────────────────────────────────────
  searchQuery    = '';
  filterStatus   = '';
  filterApproved = '';
  filterUserType = '';

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;

  // ── Modal state ───────────────────────────────────────────────────────────
  pendingAction: 'Approve' | 'DisApprove' | 'Delete' | null = null;
  pendingRow:    MouRecord | null = null;
  approvalRemark = '';

  constructor(
    private readonly cifWebService:  LpuCIFWebService,
    private readonly mouService:     MOUCrudOperation,
    private readonly storageService: StorageService,
    private readonly authService:    AuthService,
    private readonly cdRef:          ChangeDetectorRef,
    private readonly modalService:   NgbModal,
    private readonly authSession:    LoginSessionService,
    private readonly router:         Router,
    private readonly route:          ActivatedRoute,
    private readonly cookieService:  CookieService,
  ) {}

  ngOnInit(): void {
    this.loadSession();    
    this.loadAllMous();
    
    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFMouDocuments/';//'http://172.19.2.52/umsweb/webftp/CIFDocuments/CIFMouDocuments/';
    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFMouDocuments/';
  }

  ngOnDestroy(): void {    
    this.destroy$.next();
    this.destroy$.complete();
  }

 
  private loadSession(): void {
    const raw = this.cookieService.get('authData');

    if (!raw || raw.trim().length === 0) {
      Swal.fire({ title: 'Session Expired', text: 'Please login again.', icon: 'warning' });
      this.router.navigate(['/Home']);
      return;
    }

    try {
      const c            = JSON.parse(raw);
      this.adminEmail    = c.EmailId       ?? '';
      this.adminName     = c.CandidateName ?? '';
      this.userRole      = c.UserRole      ?? '';
      this.userEmail     = c.EmailId       ?? '';
      this.candidateName = c.CandidateName ?? '';
    } catch {
      Swal.fire({ title: 'Session Error', text: 'Invalid session. Please login again.', icon: 'error' });
      this.cookieService.delete('authData');
      this.router.navigate(['/Home']);
    }
  }

  // ── Load all MOUs ─────────────────────────────────────────────────────────
  loadAllMous(): void {
    this.isLoading = true;
    this.mouService.viewAllMous()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.mouList     = res.item1 ?? [];
          this.currentPage = 1;
          this.isLoading   = false;
        },
        error: () => {
          this.isLoading = false;
          Swal.fire({ title: 'Load Error', text: 'Could not fetch MOU records.', icon: 'error' });
        },
      });
  }

  // ── Filtered list getter ──────────────────────────────────────────────────
  get filteredList(): MouRecord[] {
    let data = this.mouList;
    const q  = this.searchQuery.toLowerCase().trim();

    if (q)                   data = data.filter(m => Object.values(m).some(v => String(v).toLowerCase().includes(q)));
    if (this.filterStatus)   data = data.filter(m => String(m.mouStatus)  === this.filterStatus);
    if (this.filterApproved) data = data.filter(m => String(m.isApproved) === this.filterApproved);
    if (this.filterUserType) data = data.filter(m => m.userType           === this.filterUserType);

    return data;
  }

  // ── Pagination getters ────────────────────────────────────────────────────
  get pagedList():    MouRecord[]  { const s = (this.currentPage - 1) * this.pageSize; return this.filteredList.slice(s, s + this.pageSize); }
  get totalPages():   number       { return Math.max(1, Math.ceil(this.filteredList.length / this.pageSize)); }
  get pageNumbers():  number[]     { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  // ── Stat getters ──────────────────────────────────────────────────────────
  // isApproved API values: 'True' = Approved | 'False' = Rejected | 'NA' = Pending
  // mouStatus  API values: '1'    = Active   | '0'    = Expired
  get statTotal():    number { return this.mouList.length; }
  get statApproved(): number { return this.mouList.filter(m => m.isApproved === 'True').length; }
  get statPending():  number { return this.mouList.filter(m => m.isApproved !== 'True' && m.isApproved !== 'False').length; }
  get statRejected(): number { return this.mouList.filter(m => m.isApproved === 'False').length; }
  get statExpired():  number { return this.mouList.filter(m => m.mouStatus  === '0').length; }

  // ── Modal: open ───────────────────────────────────────────────────────────
  openAction(action: 'Approve' | 'DisApprove' | 'Delete', row: MouRecord): void {
    this.pendingAction  = action;
    this.pendingRow     = row;
    this.approvalRemark = '';
    this.modalService.open(this.remarksModal, { size: 'md', centered: true });
  }

  // ── Modal: confirm ────────────────────────────────────────────────────────
  confirmAction(modal: any): void {
    if (!this.pendingAction || !this.pendingRow) return;
    this.processing = true;

    if (this.pendingAction === 'Delete') {
      const payload: MouDeletePayload = {
        action:    'Delete',
        mouId:     this.pendingRow.mouId ?? '',
        mouTitle:  this.pendingRow.mouTitle,
        userId:    this.pendingRow.userEmailId,
        loginName: this.adminEmail,          // FIX 5: now always populated from cookie
      };
      this.mouService.deleteMou(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:  res => this.handleResponse(res, modal, 'MOU deleted successfully.'),
          error: ()  => this.handleError(),
        });
      return;
    }

    const payload: MouApprovePayload = {
      action:          this.pendingAction,
      mouId:           this.pendingRow.mouId ?? '',
      userId:          this.pendingRow.userEmailId,
      approvalRemarks: this.approvalRemark,
      loginName:       this.adminEmail,      // FIX 5: now always populated from cookie
    };

    const call$ = this.pendingAction === 'Approve'
      ? this.mouService.approveMou(payload)
      : this.mouService.disapproveMou(payload);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next:  res => this.handleResponse(res, modal,
               this.pendingAction === 'Approve' ? 'MOU Approved.' : 'MOU Disapproved.'),
      error: ()  => this.handleError(),
    });
  }

  private handleResponse(res: any, modal: any, msg: string): void {
    this.processing = false;
    modal.close();
    if (res.item1?.[0]?.msg === 'Success') {
      Swal.fire('Success', msg, 'success').then(() => this.loadAllMous());
    } else {
      Swal.fire('Operation Failed', res.item1?.[0]?.msg ?? 'Unknown error.', 'error');
    }
  }

  private handleError(): void {
    this.processing = false;
    Swal.fire('Server Error', 'The request could not be completed.', 'error');
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  clearFilters(): void {
    this.searchQuery    = '';
    this.filterStatus   = '';
    this.filterApproved = '';
    this.filterUserType = '';
    this.currentPage    = 1;
  }

  // ── MOU Status badge (date-based: mouStatus '0' = Expired, '1' = Active) ──
  statusLabel(row: MouRecord): string { return row.mouStatus === '0' ? 'Expired' : 'Active'; }
  statusClass(row: MouRecord): string { return row.mouStatus === '0' ? 'badge-expired' : 'badge-active'; }

  // ── Modal label / colour helpers ──────────────────────────────────────────
  actionLabel(): string {
    if (this.pendingAction === 'Approve')    return 'Approve';
    if (this.pendingAction === 'DisApprove') return 'Disapprove';
    return 'Delete';
  }

  actionColor(): string {
    if (this.pendingAction === 'Approve') return 'confirm-green';
    if (this.pendingAction === 'Delete')  return 'confirm-red';
    return 'confirm-orange';
  }


  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }




   viewDocument(url: string ): void {
       const urls = this.serverUrl + url;
      this.onDownloadFile(urls);
    }
  
  
    
     downloadFile(fileName: any): void {
      const url = this.serverUrl + fileName;
      this.onDownloadFile(url);
    }
  
  
    
       onDownloadFile(remoteUrl: string): void {
         Swal.fire({ title: 'Downloading...', didOpen: () => { Swal.showLoading(null); }});
      
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
      
              Swal.close();
            },
            error: async (err) => {
              Swal.close();
              if (err.error instanceof Blob) {
                const errorMsg = JSON.parse(await err.error.text());
                Swal.fire('Error', errorMsg.message || 'Download failed', 'error');
              } else {
                Swal.fire('Error', 'Could not connect to the server', 'error');
              }
            }
          });
        }
}
