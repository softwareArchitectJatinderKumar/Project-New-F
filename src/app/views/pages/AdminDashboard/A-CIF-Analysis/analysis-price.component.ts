import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import {
  AnalysisPriceService,
  CifInstrumentModel,
  CIFAnalysisModel,
  CIFAnalysisPriceModel,
} from 'src/app/_services/analysis-price.service';

@Component({
  selector: 'app-analysis-price',
  templateUrl: './analysis-price.component.html',
  styleUrls: ['./analysis-price.component.scss'],
})
export class AnalysisPriceComponent implements OnInit, OnDestroy {

  @ViewChild('analysisModal')      analysisModal!:      TemplateRef<any>;
  @ViewChild('analysisPriceModal') analysisPriceModal!: TemplateRef<any>;

  private readonly destroy$ = new Subject<void>();

  // ── Session ───────────────────────────────────────────────────────────────
  userId    = '';
  loginName = '';

  // ── Session ───────────────────────────────────────────────────────────────
  adminEmail    = '';
  adminName     = '';
  userRole      = '';
  userEmail     = '';
  candidateName = '';
  serverUrl = '';
  ServerUrl ='';

  // ── Tab state ─────────────────────────────────────────────────────────────
  activeTab: 'analysis' | 'prices' = 'analysis';

  // ── Instruments dropdown ──────────────────────────────────────────────────
  instruments:          CifInstrumentModel[] = [];
  selectedInstrumentId  = '';               // Tab 1 filter
  selectedInstrumentIdP = '';               // Tab 2 filter

  // ── Analysis (Tab 1) ──────────────────────────────────────────────────────
  analysisList:     CIFAnalysisModel[] = [];
  analysisLoading   = false;

  analysisForm = {
    analysisType: '',
    instrumentId: '',
    analysisId:   '',              
  };

  // ── Analysis Price (Tab 2) ────────────────────────────────────────────────
  priceList:        CIFAnalysisPriceModel[] = [];
  priceLoading      = false;

  // Analysis dropdown inside price form (filtered by selected instrument)
  analysisForPrice: CIFAnalysisModel[] = [];

  priceForm = {
    analysisId: '',
    userTypeId: '',
    typeName:   '',
    price:      '',
  };

  // User type options (extend as needed)
  readonly userTypeOptions = [
    { id: '400000', label: 'Internal User'  },
    { id: '400001', label: 'External User'  },
    { id: '400002', label: 'Industrial'     },
  ];

  // ── Submit state ──────────────────────────────────────────────────────────
  submitting = false;

  // ── Search ────────────────────────────────────────────────────────────────
  analysisSearch = '';
  priceSearch    = '';

  // ── Computed: filtered lists ───────────────────────────────────────────────
  get filteredAnalysisList(): CIFAnalysisModel[] {
    const q = this.analysisSearch.toLowerCase().trim();
    if (!q) return this.analysisList;
    return this.analysisList.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }

  get filteredPriceList(): CIFAnalysisPriceModel[] {
    const q = this.priceSearch.toLowerCase().trim();
    if (!q) return this.priceList;
    return this.priceList.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }

  constructor(
    private readonly service:        AnalysisPriceService,
    private readonly cookieService:  CookieService, private fb: FormBuilder,
    private readonly modalService:   NgbModal,
    private readonly router:         Router,
    private readonly cdRef:          ChangeDetectorRef,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────


    CIFAnalysisForm!: FormGroup; isForm1Submitted: boolean = false; isSubmitted = false;
    isLoading: boolean = false;
  
    get form1() {
      return this.CIFAnalysisForm.controls;
    }
  
    LoadNewForm() {
      this.CIFAnalysisForm = this.fb.group({
        analysisType: ['', Validators.required],
        
      });
    }

    
  ngOnInit(): void {
    this.loadSession();
    this.loadInstruments();
    this.LoadNewForm();
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
      const c = JSON.parse(raw);
      this.adminEmail = c.EmailId ?? '';
      this.adminName = c.CandidateName ?? '';
      this.userRole = c.UserRole ?? '';
      this.userEmail = c.EmailId ?? '';
      this.candidateName = c.CandidateName ?? '';
    } catch {
      Swal.fire({ title: 'Session Error', text: 'Invalid session. Please login again.', icon: 'error' });
      this.cookieService.delete('authData');
      this.router.navigate(['/Home']);
    }
  }

  // ── Instruments ───────────────────────────────────────────────────────────
  loadInstruments(): void {
    this.service.getAllInstruments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.instruments = res.item1 ?? [];
          // Auto-load all on startup
          this.loadAnalysis();
          this.loadPrices();
        },
        error: () => Swal.fire('Error', 'Could not load instruments.', 'error'),
      });
  }

  instrumentName(id: string): string {
    return this.instruments.find(i => i.instrumentId === id)?.instrumentName ?? id;
  }

  // ── Tab 1: Analysis ───────────────────────────────────────────────────────
  loadAnalysis(): void {
    this.analysisLoading = true;
    this.service.viewAnalysis(this.selectedInstrumentId )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.analysisList    = res.item1 ?? [];
          console.log(JSON.stringify(this.analysisList) + ' data')
          this.analysisLoading = false;
        },
        error: () => { this.analysisLoading = false; },
      });
  }

  onAnalysisInstrumentChange(): void {
    this.analysisSearch = '';
    this.loadAnalysis();
  }

  openAnalysisModal(): void {
    this.analysisForm = { analysisType: '', instrumentId: this.selectedInstrumentId, analysisId: '' };
    this.modalService.open(this.analysisModal, { size: 'md', centered: true });
  }

  submitAnalysis(ngForm: NgForm, modal: any): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }
    this.submitting = true;

    this.service.insertAnalysis({
      action:       'InsertAnalysis',
      analysisType: this.analysisForm.analysisType,
      instrumentId: this.analysisForm.instrumentId,
      analysisId:   this.analysisForm.analysisId || undefined,
      userId:       this.userId,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.submitting = false;
        if (res.item1?.[0]?.msg === 'Success') {
          Swal.fire({ title: 'Analysis Added!', icon: 'success' })
            .then(() => { modal.close(); this.loadAnalysis(); });
        } else {
          Swal.fire('Failed', 'Could not add analysis type.', 'error');
        }
      },
      error: () => { this.submitting = false; Swal.fire('Error', 'Server error.', 'error'); },
    });
  }

  confirmDeleteAnalysis(row: CIFAnalysisModel): void {
    Swal.fire({
      title:              'Delete Analysis?',
      text:               `"${row.analysisType}" will be deactivated.`,
      icon:               'warning',
      showCancelButton:   true,
      confirmButtonColor: '#c0392b',
      confirmButtonText:  'Yes, Delete',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.service.deleteAnalysis(row.recordId!, this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => {
            if (res.item1?.[0]?.msg === 'Success') {
              Swal.fire({ title: 'Deleted!', icon: 'success' }).then(() => this.loadAnalysis());
            } else {
              Swal.fire('Failed', 'Could not delete.', 'error');
            }
          },
          error: () => Swal.fire('Error', 'Server error.', 'error'),
        });
    });
  }

  // ── Tab 2: Analysis Prices ────────────────────────────────────────────────
  loadPrices(): void {
    this.priceLoading = true;
    this.service.viewAnalysisPrice(this.selectedInstrumentIdP || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.priceList    = res.item1 ?? [];
          console.log(JSON.stringify(this.priceList) + ' data priceList')
          this.priceLoading = false;
        },
        error: () => { this.priceLoading = false; },
      });
  }

  onPriceInstrumentChange(): void {
    this.priceSearch = '';
    this.priceForm.analysisId = '';
    // Load analysis filtered by this instrument for the price form dropdown
    this.service.viewAnalysis(this.selectedInstrumentIdP || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => { this.analysisForPrice = res.item1 ?? []; } });
    this.loadPrices();
  }

  openPriceModal(): void {
    this.priceForm = { analysisId: '', userTypeId: '', typeName: '', price: '' };
    // Populate analysis dropdown for price form
    this.service.viewAnalysis(this.selectedInstrumentIdP || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => { this.analysisForPrice = res.item1 ?? []; } });
    this.modalService.open(this.analysisPriceModal, { size: 'md', centered: true });
  }

  submitPrice(ngForm: NgForm, modal: any): void {
    if (ngForm.invalid) { ngForm.form.markAllAsTouched(); return; }
    this.submitting = true;

    this.service.insertAnalysisPrice({
      action:     'InsertAnalysisPrice',
      analysisId: this.priceForm.analysisId,
      userTypeId: this.priceForm.userTypeId,
      typeName:   this.priceForm.typeName,
      price:      this.priceForm.price,
      userId:     this.userId,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.submitting = false;
        if (res.item1?.[0]?.msg === 'Success') {
          Swal.fire({ title: 'Price Added!', icon: 'success' })
            .then(() => { modal.close(); this.loadPrices(); });
        } else {
          Swal.fire('Failed', 'Could not add price.', 'error');
        }
      },
      error: () => { this.submitting = false; Swal.fire('Error', 'Server error.', 'error'); },
    });
  }

  confirmDeletePrice(row: CIFAnalysisPriceModel): void {
    Swal.fire({
      title:              'Delete Price Entry?',
      text:               `${row.typeName} — ₹${row.price} will be removed.`,
      icon:               'warning',
      showCancelButton:   true,
      confirmButtonColor: '#c0392b',
      confirmButtonText:  'Yes, Delete',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.service.deletePrice(row.recordId!, this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => {
            if (res.item1?.[0]?.msg === 'Success') {
              Swal.fire({ title: 'Deleted!', icon: 'success' }).then(() => this.loadPrices());
            } else {
              Swal.fire('Failed', 'Could not delete.', 'error');
            }
          },
          error: () => Swal.fire('Error', 'Server error.', 'error'),
        });
    });
  }

  // ── Tab switch ────────────────────────────────────────────────────────────
  switchTab(tab: 'analysis' | 'prices'): void {
    this.activeTab = tab;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  userTypeName(id: string): string {
    return this.userTypeOptions.find(u => u.id === id)?.label ?? id;
  }
}
