// import { Component, OnInit, OnDestroy, inject, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { Subject, takeUntil } from 'rxjs';
// import Swal from 'sweetalert2';
// import { MOUCrudOperation, MouRecord, MouApprovePayload, MouDeletePayload } from 'src/app/_services/mou-crud-operation.service';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import { StorageService } from 'src/app/_services/storage.service';
// import { AuthService } from 'src/app/_services/auth.service';
// import { LoginSessionService } from 'src/app/_services/login-session.service';

// @Component({
//   selector: 'admin-mou',
//   templateUrl: './admin-mou.component.html',
//   styleUrls: ['./admin-mou.component.scss']
// })
// export class AdminMouComponent implements OnInit  {
//   @ViewChild('remarksModal') remarksModal!: TemplateRef<any>;

//   // private readonly mouService = inject(MOUCrudOperation);
//   // private readonly cookieService = inject(CookieService);
//   // private readonly modalService = inject(NgbModal);
//   // private readonly router = inject(Router);
//   private readonly destroy$ = new Subject<void>();
//   userEmail='';
//   adminEmail = '';
//   adminName = '';
//   mouList: MouRecord[] = [];
//   isLoading = false;
//   processing = false;

//   searchQuery = '';
//   filterStatus = '';
//   filterApproved = '';
//   filterUserType = '';

//   currentPage = 1;
//   pageSize = 5;

//   pendingAction: 'Approve' | 'DisApprove' | 'Delete' | null = null;
//   pendingRow: MouRecord | null = null;
//   approvalRemark = '';


//     constructor(
//       private cifWebService: LpuCIFWebService,
//       private mouService: MOUCrudOperation,
//       private storageService: StorageService,
//       private authService: AuthService,
//       private cdRef: ChangeDetectorRef,
//       private modalService: NgbModal,
//       private authSession: LoginSessionService,
//       private router: Router,
//       private route: ActivatedRoute,
//       private cookieService: CookieService
//     ) {}
//   ngOnInit(): void {
//      this.loadUserSession();
//     this.loadUserFromCookie();
//     this.loadAllMous();
//   }

//   private loadUserSession(): void {
//     const sessionData = this.authSession.getSession();
//     if (sessionData.length > 0) {
//       this.userEmail = sessionData[0][0]?.['userEmail'] || '';
//     }
//   }
//   user_Email: any; UserRole: any; candidateName: any;
//   private loadUserFromCookie(): void {

//     const GetCookieData = this.cookieService.get('authData');
//     const retrievedCookies = JSON.parse(GetCookieData);
//     this.UserRole = retrievedCookies.UserRole;
//     this.user_Email = retrievedCookies.EmailId;
//     this.candidateName = retrievedCookies.CandidateName;



//   }
//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private loadSession(): void {
//     const raw = this.cookieService.get('authData');
//     if (!raw) {
//       this.router.navigate(['/Home']);
//       return;
//     }
//     try {
//       const p = JSON.parse(raw);
//       this.adminEmail = p.EmailId ?? '';
//       this.adminName = p.CandidateName ?? '';
//     } catch {
//       this.router.navigate(['/Home']);
//     }
//   }

//   loadAllMous(): void {
//     this.isLoading = true;
//     this.mouService.viewAllMous()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (res) => {
//           this.mouList = res.item1 ?? [];
//           this.currentPage = 1;
//           this.isLoading = false;
//         },
//         error: () => {
//           this.isLoading = false;
//         }
//       });
//   }

//   get filteredList(): MouRecord[] {
//     let data = this.mouList;
//     const q = this.searchQuery.toLowerCase().trim();

//     if (q) {
//       data = data.filter(m => Object.values(m).some(v => String(v).toLowerCase().includes(q)));
//     }
//     if (this.filterStatus) {
//       data = data.filter(m => String(m.mouStatus) === this.filterStatus);
//     }
//     if (this.filterApproved) {
//       data = data.filter(m => String(m.isApproved) === this.filterApproved);
//     }
//     if (this.filterUserType) {
//       data = data.filter(m => m.userType === this.filterUserType);
//     }
//     return data;
//   }

//   get pagedList(): MouRecord[] {
//     const start = (this.currentPage - 1) * this.pageSize;
//     return this.filteredList.slice(start, start + this.pageSize);
//   }

//   get totalPages(): number {
//     return Math.max(1, Math.ceil(this.filteredList.length / this.pageSize));
//   }

//   get pageNumbers(): number[] {
//     return Array.from({ length: this.totalPages }, (_, i) => i + 1);
//   }

//   get statTotal() { return this.mouList.length; }
//   get statApproved() { return this.mouList.filter(m => m.isApproved === 'True').length; }
//   get statPending() { return this.mouList.filter(m => m.isApproved !== 'False' && m.isApproved !== 'True').length; }
//   get statRejected() { return this.mouList.filter(m => m.isApproved === 'False').length; }
//   get statExpired() { return this.mouList.filter(m => m.mouStatus === '0').length; }

//   openAction(action: 'Approve' | 'DisApprove' | 'Delete', row: MouRecord): void {
//     this.pendingAction = action;
//     this.pendingRow = row;
//     this.approvalRemark = '';
//     this.modalService.open(this.remarksModal, { size: 'md', centered: true });
//   }

//   confirmAction(modal: any): void {
//     if (!this.pendingAction || !this.pendingRow) return;
//     this.processing = true;

//     if (this.pendingAction === 'Delete') {
//       const payload: MouDeletePayload = {
//         action: 'Delete',
//         mouId: this.pendingRow.mouId ?? '',
//         mouTitle: this.pendingRow.mouTitle,
//         userId: this.pendingRow.userEmailId,
//         loginName: this.adminEmail,
//       };
//       this.mouService.deleteMou(payload)
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: res => this.handleResponse(res, modal, 'MOU deleted successfully.'),
//           error: () => this.handleError()
//         });
//     } else {
//       const payload: MouApprovePayload = {
//         action: this.pendingAction,
//         mouId: this.pendingRow.mouId ?? '',
//         userId: this.pendingRow.userEmailId,
//         approvalRemarks: this.approvalRemark,
//         loginName: this.adminEmail,
//       };
//       const call$ = this.pendingAction === 'Approve'
//         ? this.mouService.approveMou(payload)
//         : this.mouService.disapproveMou(payload);

//       call$.pipe(takeUntil(this.destroy$)).subscribe({
//         next: res => this.handleResponse(res, modal, this.pendingAction === 'Approve' ? 'MOU Approved' : 'MOU Disapproved'),
//         error: () => this.handleError()
//       });
//     }
//   }

//   private handleResponse(res: any, modal: any, msg: string): void {
//     this.processing = false;
//     modal.close();
//     if (res.item1?.[0]?.msg === 'Success') {
//       Swal.fire('Success', msg, 'success');
//       this.loadAllMous();
//     } else {
//       Swal.fire('Error', 'Operation failed', 'error');
//     }
//   }

//   private handleError(): void {
//     this.processing = false;
//     Swal.fire('Error', 'Server Error', 'error');
//   }

//   clearFilters(): void {
//     this.searchQuery = '';
//     this.filterStatus = '';
//     this.filterApproved = '';
//     this.filterUserType = '';
//     this.currentPage = 1;
//   }

//   statusLabel(row: MouRecord): string {
//     if (row.mouStatus === '0') return 'Expired';
//     if (row.mouStatus === '1') return 'Active';
//     return 'Pending';
//   }

//   statusClass(row: MouRecord): string {
//     if (row.mouStatus === '0') return 'badge-expired';
//     return 'badge-approved';
//   }

//   actionLabel(): string {
//     if (this.pendingAction === 'Approve') return 'Approve';
//     if (this.pendingAction === 'DisApprove') return 'Disapprove';
//     return 'Delete';
//   }

//   actionColor(): string {
//     if (this.pendingAction === 'Approve') return 'confirm-green';
//     if (this.pendingAction === 'Delete') return 'confirm-red';
//     return 'confirm-orange';
//   }

//   viewDocument(url: string | undefined): void {
//     if (url) window.open(url, '_blank');
//   }

//   nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
//   prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
// }