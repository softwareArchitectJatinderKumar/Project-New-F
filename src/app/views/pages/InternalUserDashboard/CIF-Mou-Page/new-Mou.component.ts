import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import {
  MOUCrudOperation,
  MouRecord,
  MouInsertPayload,
  MouUpdatePayload,
} from 'src/app/_services/mou-crud-operation.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';

// ── FormMode type (replaces Angular 20 signal union) ─────────────────────────
export type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-new-user-mou',
  templateUrl: './new-Mou.html',
  styleUrls: ['./new-Mou.scss'],
})
export class NewUserMouComponent implements OnInit, OnDestroy {

  @ViewChild('editModal') editModal!: TemplateRef<any>;

  private readonly destroy$ = new Subject<void>();

  // ── Server URLs ───────────────────────────────────────────────────────────
  serverUrl = '';
  ServerUrl = '';

  // ── Legacy session fields (kept for compatibility) ────────────────────────
  UserRole:   any;
  UserId:     any;
  user_Email: any;

  userEmail = '';   // was: signal<string>('')
  userName  = '';   // was: signal<string>('')

  mouList:   MouRecord[] = [];   // was: signal<MouRecord[]>([])
  isLoading  = false;            // was: signal<boolean>(false)
  formMode:  FormMode = null;    // was: signal<FormMode>(null)

  searchQuery = '';   // was: signal<string>('')
  currentPage = 1;    // was: signal<number>(1)
  pageSize    = 8;    // was: signal<number>(8)

  get filteredList(): MouRecord[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.mouList;
    return this.mouList.filter(m =>
      Object.values(m).some(v => String(v).toLowerCase().includes(q))
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredList.length / this.pageSize));
  }

  get pagedList(): MouRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredList.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  form = {
    mouId:        '',
    mouTitle:     '',
    mouStartDate: '',
    mouEndDate:   '',
    mouRemarks:   '',
  };

  // ── File state ────────────────────────────────────────────────────────────
  fileData64 = '';
  fileName   = '';
  fileStatus  = false;        
  editExistingFileName = '';  
  submitting  = false;        

  // ── Edit row ──────────────────────────────────────────────────────────────
  editingRow: MouRecord | null = null;   // was: signal<MouRecord | null>(null)

  // ── Constructor injection (replaces inject()) ──────────────────────────────
  constructor(
    private readonly mouService:    MOUCrudOperation,
    private readonly cookieService: CookieService,
    private readonly cifWebService: LpuCIFWebService,
    private readonly modalService:  NgbModal,
    private readonly router:        Router,
    private readonly authSession:   LoginSessionService,
    private readonly cdRef:         ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSession();
    this.loadMyMous();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Session ───────────────────────────────────────────────────────────────
  private loadSession(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }

    this.serverUrl = 'http://172.19.2.52/umsweb/webftp/CIFDocuments/CIFMouDocuments/';
    this.ServerUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFMouDocuments/';

    const rawData = this.cookieService.get('InternalUserAuthData');
    if (!rawData || rawData.trim().length === 0) {
      Swal.fire({ title: 'Login Failed', icon: 'warning' });
      this.router.navigate(['/Home']);
      return;
    }

    try {
      const c         = JSON.parse(rawData);
      this.UserRole   = c.userRole?.length > 0 ? c.userRole : 'Internal User';
      this.user_Email = c.EmailId;
      this.userEmail  = c.EmailId        ?? '';   
      this.userName   = c.CandidateName  ?? '';   
    } catch {
      this.cookieService.delete('InternalUserAuthData');
      this.router.navigate(['/Home']);
    }
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadMyMous(): void {
    this.isLoading = true;                       
    this.mouService.viewMyMous(this.userEmail)   
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.mouList    = res.item1 ?? [];     
          this.currentPage = 1;                  
          this.isLoading  = false;               
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  // ── Create form ───────────────────────────────────────────────────────────
  openCreateForm(): void {
    this.resetForm();
    this.formMode = 'create';                      
  } 
 
  closeForm(): void { 
    this.formMode = null;                          
    this.resetForm();
  }

  // ── Edit modal ────────────────────────────────────────────────────────────
  openEditModal(row: MouRecord): void {
    this.editingRow = row;                        

    this.form = {
      mouId:        row.mouId        ?? '',
      mouTitle:     row.mouTitle,
      mouStartDate: this.toInputDate(row.mouStartDate),
      mouEndDate:   this.toInputDate(row.mouEndDate),
      mouRemarks:   row.mouRemarks   ?? '',
    };

    this.fileData64 = '';
    this.fileName   = '';
    this.fileStatus  = false;                       
 
    this.editExistingFileName =                     
      row.mouDocumentUrl
        ? row.mouDocumentUrl.split('/').pop() ?? row.mouDocumentUrl
        : '';

    this.modalService.open(this.editModal, { size: 'lg', centered: true });
  }

  // ── File handling ─────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    this.fileStatus = false;                       
    const target = event.target as HTMLInputElement;
    const file   = target.files?.[0];
    if (!file) return;

    if (file.size > 5_242_880) {
      Swal.fire({ title: 'File too large', text: 'Max allowed size is 5 MB.', icon: 'warning' });
      target.value = '';
      return;
    }

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      Swal.fire({ title: 'Invalid file type', text: 'Only PDF and Word documents are allowed.', icon: 'warning' });
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.fileData64 = (reader.result as string).split(',')[1];
      this.fileName   = file.name;
      this.fileStatus  = true;                     
    };
    reader.readAsDataURL(file);
  }

  // ── Submit: Insert ────────────────────────────────────────────────────────
  submitCreate(ngForm: NgForm): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }
    if (!this.fileStatus) {                        // was: !this.fileStatus()
      Swal.fire({ title: 'Document required', text: 'Please upload the MOU document.', icon: 'warning' });
      return;
    }

    this.submitting = true;                      

    const payload: MouInsertPayload = {
      action:          'Insert',
      mouTitle:        this.form.mouTitle,
      mouDocumentData: this.fileData64,
      mouDocumentUrl:  this.fileName,
      mouStartDate:    this.form.mouStartDate,
      mouEndDate:      this.form.mouEndDate,
      mouRemarks:      this.form.mouRemarks,
      userId:          this.userEmail,          
    };

    this.mouService.insertMou(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.submitting = false;                
          if (res.item1?.[0]?.msg === 'Success') {
            Swal.fire({ title: 'MOU Submitted!', icon: 'success' })
              .then(() => { this.closeForm(); this.loadMyMous(); });
          } else {
            Swal.fire({ title: 'Submission Failed', icon: 'error' });
          }
        },
        error: () => {
          this.submitting = false;
          Swal.fire({ title: 'Error', text: 'Could not submit MOU.', icon: 'error' });
        },
      });
  }

  // ── Submit: Update ────────────────────────────────────────────────────────
  submitUpdate(ngForm: NgForm, modal: any): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }

    if (!this.fileStatus) {                     
      Swal.fire({
        title: 'Document required',
        text:  'Please upload the MOU document to proceed with the update.',
        icon:  'warning',
      });
      return;
    }

    this.submitting = true;

    const payload: MouUpdatePayload = {
      action:          'Update',
      mouId:           this.form.mouId,
      mouTitle:        this.form.mouTitle,
      mouDocumentData: this.fileData64,
      mouDocumentUrl:  this.fileName,
      mouStartDate:    this.form.mouStartDate,
      mouEndDate:      this.form.mouEndDate,
      mouRemarks:      this.form.mouRemarks,
      loginName:       this.userEmail,           
      userId:          this.userEmail,
    };

    this.mouService.updateMou(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.submitting = false;
          if (res.item1?.[0]?.msg === 'Success') {
            Swal.fire({ title: 'MOU Updated!', icon: 'success' })
              .then(() => { modal.close(); this.loadMyMous(); });
          } else {
            Swal.fire({ title: 'Update Failed', icon: 'error' });
          }
        },
        error: () => {
          this.submitting = false;
          Swal.fire({ title: 'Error', text: 'Could not update MOU.', icon: 'error' });
        },
      });
  }

  // ── Search & pagination ───────────────────────────────────────────────────
  onSearch(value: string): void {
    this.searchQuery = value;                      
    this.currentPage = 1;                          
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

 
  statusLabel(row: MouRecord): string {
    if (row.mouStatus === '0')       return 'Expired';
    if (row.mouStatus === '1')       return 'Active';
    if (row.mouStatus === 'NA')       return 'Pending';
    if (row.isApproved === 'True')   return 'Approved';
    if (row.isApproved === 'False')  return 'Disapproved';
    if (row.isApproved === 'NA')    return 'Pending';
    return 'Pending';
  }

  statusClass(row: MouRecord): string {
    if (row.mouStatus === '0')       return 'badge-expired';
    if (row.mouStatus === '1')       return 'badge-active';
    if (row.isApproved === 'True')   return 'badge-approved';
    if (row.isApproved === 'False')  return 'badge-disapproved';
    return 'badge-pending';
  }

  viewDocument(url: string | undefined): void {
    window.open(this.serverUrl + 'CIF_Mou_Document_703472083_.pdf', '_blank');
    //  const urls = this.serverUrl + url;
    // this.onDownloadFile(urls);
  }


  
   downloadFile(fileName: string): void {
    const url = this.serverUrl + fileName;
    this.onDownloadFile(url);
    // window.open(url, '_blank');
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
  // ── Private helpers ───────────────────────────────────────────────────────
  private resetForm(): void {
    this.form = { mouId: '', mouTitle: '', mouStartDate: '', mouEndDate: '', mouRemarks: '' };
    this.fileData64          = '';
    this.fileName            = '';
    this.fileStatus          = false;
    this.editExistingFileName = '';
  }

  private toInputDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }
}
