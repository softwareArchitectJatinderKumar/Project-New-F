import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CIFAnalysisService } from 'src/app/_services/cif-analysis.service';
import Swal from 'sweetalert2'; // Import SweetAlert2
import * as XLSX from 'xlsx';

interface Instrument {
  instrumentId: string;
  instrumentName: string;
}

interface Analysis {
  id: string;
  analysisType: string;
  instrumentId: string;
  createdBy: string;
  createdOn: Date;
  isActive: boolean;
}

interface AnalysisPrice {
  recordId: string;
  analysisId: string;
  analysisType: string;
  instrumentId: string;
  instrumentName: string;
  userTypeId: string;
  typeName: string;
  price: string;
  createdOn: Date;
  isActive: boolean;
}

@Component({
  selector: 'app-cif-analysis-price-management',
  templateUrl: './cif-analysis-price.component.html',
  styleUrls: ['./cif-analysis-price.component.scss']
})
export class CIFAnalysisPriceComponent implements OnInit {
  @ViewChild('addAnalysisModal') addAnalysisModal: any;
  @ViewChild('addAnalysisPriceModal') addAnalysisPriceModal: any;
  @ViewChild('editAnalysisModal') editAnalysisModal: any;
  @ViewChild('editAnalysisPriceModal') editAnalysisPriceModal: any;

  // Common properties
  instruments: Instrument[] = [];
  selectedInstrumentId: string = '';
  selectedInstrumentName: string = '';
  currentUserId: string = '8709';

  // Analysis Tab
  analyses: Analysis[] = [];
  filteredAnalyses: Analysis[] = [];
  analysisSearchText: string = '';
  analysisPageSize: number = 10;
  analysisPaginatedData: Analysis[] = [];
  analysisCurrentPage: number = 1;
  analysisForm: FormGroup;
  isEditingAnalysis: boolean = false;
  editingAnalysisId: string = '';

  // Analysis Price Tab
  analysisPrices: AnalysisPrice[] = [];
  filteredAnalysisPrices: AnalysisPrice[] = [];
  priceSearchText: string = '';
  pricePageSize: number = 10;
  pricePaginatedData: AnalysisPrice[] = [];
  priceCurrentPage: number = 1;
  analysisPriceForm: FormGroup;
  isEditingPrice: boolean = false;
  editingPriceId: string = '';

  // Dropdowns
  analysisTypes: string[] = [];
  userTypes = [
    { id: '400000', name: 'Internal' },
    { id: '400001', name: 'External' },
    { id: '400002', name: 'Industry' }
  ];

  // Flags
  isLoadingAnalysis: boolean = false;
  isLoadingPrice: boolean = false;
  isSubmittingAnalysis: boolean = false;
  isSubmittingPrice: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cifService: CIFAnalysisService
  ) {
    this.analysisForm = this.createAnalysisForm();
    this.analysisPriceForm = this.createAnalysisPriceForm();
  }

  ngOnInit(): void {
    this.loadInstruments();
  }

  // Helper for SweetAlert Toasts
  private showAlert(icon: 'success' | 'error' | 'warning' | 'info', title: string, text: string = '') {
    Swal.fire({
      icon,
      title,
      text,
      timer: 3000,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timerProgressBar: true
    });
  }

  // ==================== COMMON METHODS ====================
  private loadInstruments(): void {
    this.cifService.getInstruments().subscribe({
      next: (data) => {
        this.instruments = data;
      },
      error: (err) => {
        this.showAlert('error', 'Error', 'Failed to load instruments');
        console.error(err);
      }
    });
  }

  onInstrumentChange(tabType: 'analysis' | 'price'): void {
    if (!this.selectedInstrumentId) {
      if (tabType === 'analysis') {
        this.analyses = [];
        this.filteredAnalyses = [];
      } else {
        this.analysisPrices = [];
        this.filteredAnalysisPrices = [];
      }
      return;
    }

    if (tabType === 'analysis') {
      this.loadAnalyses();
      this.loadAnalysisTypes();
    } else {
      this.loadAnalysisPrices();
    }
  }

  // ==================== ANALYSIS METHODS ====================
  private createAnalysisForm(): FormGroup {
    return this.fb.group({
      analysisType: ['', Validators.required]
    });
  }

  private loadAnalyses(): void {
    this.isLoadingAnalysis = true;
    this.cifService.getAnalyses(this.selectedInstrumentId).subscribe({
      next: (data) => {
        this.analyses = data;
        this.filterAndPaginateAnalyses();
        this.isLoadingAnalysis = false;
      },
      error: (err) => {
        this.showAlert('error', 'Error', 'Failed to load analyses');
        this.isLoadingAnalysis = false;
        console.error(err);
      }
    });
  }

  private loadAnalysisTypes(): void {
    this.cifService.getAnalysisTypes(this.selectedInstrumentId).subscribe({
      next: (data) => {
        this.analysisTypes = data;
      },
      error: (err) => {
        console.error('Failed to load analysis types', err);
      }
    });
  }

  onAnalysisSearch(searchValue: string): void {
    this.analysisSearchText = searchValue;
    this.analysisCurrentPage = 1;
    this.filterAndPaginateAnalyses();
  }

  private filterAndPaginateAnalyses(): void {
    let filtered = this.analyses;

    if (this.analysisSearchText) {
      const search = this.analysisSearchText.toLowerCase();
      filtered = filtered.filter(a =>
        a.analysisType.toLowerCase().includes(search) ||
        a.createdBy.toLowerCase().includes(search)
      );
    }

    this.filteredAnalyses = filtered;
    this.paginateData('analysis');
  }

  onAnalysisPageSizeChange(): void {
    this.analysisCurrentPage = 1;
    this.paginateData('analysis');
  }

  private paginateData(type: 'analysis' | 'price'): void {
    if (type === 'analysis') {
      const startIndex = (this.analysisCurrentPage - 1) * this.analysisPageSize;
      this.analysisPaginatedData = this.filteredAnalyses.slice(
        startIndex,
        startIndex + this.analysisPageSize
      );
    } else {
      const startIndex = (this.priceCurrentPage - 1) * this.pricePageSize;
      this.pricePaginatedData = this.filteredAnalysisPrices.slice(
        startIndex,
        startIndex + this.pricePageSize
      );
    }
  }

  getTotalAnalysisPages(): number {
    return Math.ceil(this.filteredAnalyses.length / this.analysisPageSize);
  }

  openAddAnalysisModal(): void {
    this.isEditingAnalysis = false;
    this.analysisForm.reset();
    this.addAnalysisModal.show();
  }

  openEditAnalysisModal(analysis: Analysis): void {
    this.isEditingAnalysis = true;
    this.editingAnalysisId = analysis.id;
    this.analysisForm.patchValue({
      analysisType: analysis.analysisType
    });
    this.editAnalysisModal.show();
  }

  submitAnalysis(): void {
    if (this.analysisForm.invalid) {
      this.showAlert('warning', 'Validation Error', 'Please fill all required fields');
      return;
    }

    this.isSubmittingAnalysis = true;
    const payload = {
      action: this.isEditingAnalysis ? 'UpdateAnalysis' : 'InsertAnalysis',
      recordId: this.editingAnalysisId || null,
      analysisType: this.analysisForm.value.analysisType,
      instrumentId: this.selectedInstrumentId,
      userId: this.currentUserId
    };

    this.cifService.crudAnalysis(payload).subscribe({
      next: (response) => {
        if (response.msg === 'Success') {
          this.showAlert('success', 'Success', this.isEditingAnalysis ? 'Analysis updated successfully' : 'Analysis added successfully');
          this.loadAnalyses();
          this.isEditingAnalysis ? this.editAnalysisModal.hide() : this.addAnalysisModal.hide();
        } else {
          this.showAlert('error', 'Error', response.msg || 'Operation failed');
        }
        this.isSubmittingAnalysis = false;
      },
      error: (err) => {
        this.showAlert('error', 'Error', 'Failed to save analysis');
        this.isSubmittingAnalysis = false;
        console.error(err);
      }
    });
  }

  deleteAnalysis(analysis: Analysis): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete "${analysis.analysisType}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cifService.deleteAnalysis(analysis.id, this.currentUserId).subscribe({
          next: (response) => {
            if (response.msg === 'Success') {
              this.showAlert('success', 'Deleted!', 'Analysis deleted successfully');
              this.loadAnalyses();
            } else {
              this.showAlert('error', 'Error', response.msg || 'Delete failed');
            }
          },
          error: (err) => {
            this.showAlert('error', 'Error', 'Failed to delete analysis');
            console.error(err);
          }
        });
      }
    });
  }

  exportAnalysisToExcel(): void {
    const dataToExport = this.filteredAnalyses.map(a => ({
      'Analysis Type': a.analysisType,
      'Instrument ID': a.instrumentId,
      'Created By': a.createdBy,
      'Created On': new Date(a.createdOn).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyses');
    XLSX.writeFile(workbook, `Analysis_Export_${new Date().getTime()}.xlsx`);
    this.showAlert('success', 'Exported', 'Analysis data exported to Excel');
  }

  // ==================== ANALYSIS PRICE METHODS ====================
  private createAnalysisPriceForm(): FormGroup {
    return this.fb.group({
      analysisType: ['', Validators.required],
      userTypeId: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  private loadAnalysisPrices(): void {
    this.isLoadingPrice = true;
    this.cifService.getAnalysisPrices(this.selectedInstrumentId).subscribe({
      next: (data) => {
        this.analysisPrices = data;
        this.filterAndPaginateAnalysisPrices();
        this.isLoadingPrice = false;
      },
      error: (err) => {
        this.showAlert('error', 'Error', 'Failed to load analysis prices');
        this.isLoadingPrice = false;
        console.error(err);
      }
    });
  }

  onPriceSearch(searchValue: string): void {
    this.priceSearchText = searchValue;
    this.priceCurrentPage = 1;
    this.filterAndPaginateAnalysisPrices();
  }

  private filterAndPaginateAnalysisPrices(): void {
    let filtered = this.analysisPrices;

    if (this.priceSearchText) {
      const search = this.priceSearchText.toLowerCase();
      filtered = filtered.filter(p =>
        p.analysisType.toLowerCase().includes(search) ||
        p.typeName.toLowerCase().includes(search) ||
        p.price.includes(search)
      );
    }

    this.filteredAnalysisPrices = filtered;
    this.paginateData('price');
  }

  onPricePageSizeChange(): void {
    this.priceCurrentPage = 1;
    this.paginateData('price');
  }

  getTotalPricePages(): number {
    return Math.ceil(this.filteredAnalysisPrices.length / this.pricePageSize);
  }

  openAddAnalysisPriceModal(): void {
    if (!this.selectedInstrumentId) {
      this.showAlert('warning', 'Validation', 'Please select an instrument first');
      return;
    }
    this.isEditingPrice = false;
    this.analysisPriceForm.reset();
    this.loadAnalysisTypes();
    this.addAnalysisPriceModal.show();
  }

  openEditAnalysisPriceModal(price: AnalysisPrice): void {
    this.isEditingPrice = true;
    this.editingPriceId = price.recordId;
    this.analysisPriceForm.patchValue({
      analysisType: price.analysisId,
      userTypeId: price.userTypeId,
      price: price.price
    });
    this.editAnalysisPriceModal.show();
  }

  submitAnalysisPrice(): void {
    if (this.analysisPriceForm.invalid) {
      this.showAlert('warning', 'Validation Error', 'Please fill all required fields');
      return;
    }

    this.isSubmittingPrice = true;
    const selectedUserType = this.userTypes.find(u => u.id === this.analysisPriceForm.value.userTypeId);

    const payload = {
      action: this.isEditingPrice ? 'UpdateAnalysisPrice' : 'InsertAnalysisPrice',
      recordId: this.editingPriceId || null,
      analysisId: this.analysisPriceForm.value.analysisType,
      userTypeId: this.analysisPriceForm.value.userTypeId,
      typeName: selectedUserType?.name || 'Per sample based',
      price: this.analysisPriceForm.value.price,
      userId: this.currentUserId
    };

    this.cifService.crudAnalysisPrice(payload).subscribe({
      next: (response) => {
        if (response.msg === 'Success') {
          this.showAlert('success', 'Success', this.isEditingPrice ? 'Price updated successfully' : 'Price added successfully');
          this.loadAnalysisPrices();
          this.isEditingPrice ? this.editAnalysisPriceModal.hide() : this.addAnalysisPriceModal.hide();
        } else {
          this.showAlert('error', 'Error', response.msg || 'Operation failed');
        }
        this.isSubmittingPrice = false;
      },
      error: (err) => {
        this.showAlert('error', 'Error', 'Failed to save analysis price');
        this.isSubmittingPrice = false;
        console.error(err);
      }
    });
  }

  deleteAnalysisPrice(price: AnalysisPrice): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this price record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cifService.deleteAnalysisPrice(price.recordId, this.currentUserId).subscribe({
          next: (response) => {
            if (response.msg === 'Success') {
              this.showAlert('success', 'Deleted!', 'Price deleted successfully');
              this.loadAnalysisPrices();
            } else {
              this.showAlert('error', 'Error', response.msg || 'Delete failed');
            }
          },
          error: (err) => {
            this.showAlert('error', 'Error', 'Failed to delete price');
            console.error(err);
          }
        });
      }
    });
  }

  exportAnalysisPriceToExcel(): void {
    const dataToExport = this.filteredAnalysisPrices.map(p => ({
      'Analysis Type': p.analysisType,
      'Instrument': p.instrumentName,
      'User Type': p.typeName,
      'Price': p.price,
      'Created On': new Date(p.createdOn).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis Prices');
    XLSX.writeFile(workbook, `Analysis_Prices_Export_${new Date().getTime()}.xlsx`);
    this.showAlert('success', 'Exported', 'Analysis price data exported to Excel');
  }
}


// import { Component, OnInit, ViewChild } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { CIFAnalysisService } from 'src/app/_services/cif-analysis.service';
// ToastService from 'ngx-toastr';
// // import { CIFAnalysisService } from './services/cif-analysis.service';
// // import { ToastrService } from 'ngx-toastr';
// import * as XLSX from 'xlsx';

// interface Instrument {
//   instrumentId: string;
//   instrumentName: string;
// }

// interface Analysis {
//   id: string;
//   analysisType: string;
//   instrumentId: string;
//   createdBy: string;
//   createdOn: Date;
//   isActive: boolean;
// }

// interface AnalysisPrice {
//   recordId: string;
//   analysisId: string;
//   analysisType: string;
//   instrumentId: string;
//   instrumentName: string;
//   userTypeId: string;
//   typeName: string;
//   price: string;
//   createdOn: Date;
//   isActive: boolean;
// }

// @Component({
//   selector: 'app-cif-analysis-price-management',
//   templateUrl: './cif-analysis-price.component.html',
//   styleUrls: ['./cif-analysis-price.component.scss']
// })
// export class CIFAnalysisPriceComponent implements OnInit {
//   @ViewChild('addAnalysisModal') addAnalysisModal: any;
//   @ViewChild('addAnalysisPriceModal') addAnalysisPriceModal: any;
//   @ViewChild('editAnalysisModal') editAnalysisModal: any;
//   @ViewChild('editAnalysisPriceModal') editAnalysisPriceModal: any;

//   // Common properties
//   instruments: Instrument[] = [];
//   selectedInstrumentId: string = '';
//   selectedInstrumentName: string = '';
//   currentUserId: string = '8709'; // TODO: Get from auth service

//   // Analysis Tab
//   analyses: Analysis[] = [];
//   filteredAnalyses: Analysis[] = [];
//   analysisSearchText: string = '';
//   analysisPageSize: number = 10;
//   analysisPaginatedData: Analysis[] = [];
//   analysisCurrentPage: number = 1;
//   analysisForm: FormGroup;
//   isEditingAnalysis: boolean = false;
//   editingAnalysisId: string = '';

//   // Analysis Price Tab
//   analysisPrices: AnalysisPrice[] = [];
//   filteredAnalysisPrices: AnalysisPrice[] = [];
//   priceSearchText: string = '';
//   pricePageSize: number = 10;
//   pricePaginatedData: AnalysisPrice[] = [];
//   priceCurrentPage: number = 1;
//   analysisPriceForm: FormGroup;
//   isEditingPrice: boolean = false;
//   editingPriceId: string = '';

//   // Dropdowns
//   analysisTypes: string[] = [];
//   userTypes = [
//     { id: '400000', name: 'Internal' },
//     { id: '400001', name: 'External' },
//     { id: '400002', name: 'Industry' }
//   ];

//   // Flags
//   isLoadingAnalysis: boolean = false;
//   isLoadingPrice: boolean = false;
//   isSubmittingAnalysis: boolean = false;
//   isSubmittingPrice: boolean = false;

//   constructor(
//     private fb: FormBuilder,
//     private cifService: CIFAnalysisService,
//     // private toastr: ToastrService
//   ) {
//     this.analysisForm = this.createAnalysisForm();
//     this.analysisPriceForm = this.createAnalysisPriceForm();
//   }

//   ngOnInit(): void {
//     this.loadInstruments();
//   }

//   // ==================== COMMON METHODS ====================
//   private loadInstruments(): void {
//     this.cifService.getInstruments().subscribe({
//       next: (data) => {
//         this.instruments = data;
//       },
//       error: (err) => {
//         // this.toastr.error('Failed to load instruments', 'Error');
//         console.error(err);
//       }
//     });
//   }

//   onInstrumentChange(tabType: 'analysis' | 'price'): void {
//     if (!this.selectedInstrumentId) {
//       if (tabType === 'analysis') {
//         this.analyses = [];
//         this.filteredAnalyses = [];
//       } else {
//         this.analysisPrices = [];
//         this.filteredAnalysisPrices = [];
//       }
//       return;
//     }

//     if (tabType === 'analysis') {
//       this.loadAnalyses();
//       this.loadAnalysisTypes();
//     } else {
//       this.loadAnalysisPrices();
//     }
//   }

//   // ==================== ANALYSIS METHODS ====================
//   private createAnalysisForm(): FormGroup {
//     return this.fb.group({
//       analysisType: ['', Validators.required]
//     });
//   }

//   private loadAnalyses(): void {
//     this.isLoadingAnalysis = true;
//     this.cifService.getAnalyses(this.selectedInstrumentId).subscribe({
//       next: (data) => {
//         this.analyses = data;
//         this.filterAndPaginateAnalyses();
//         this.isLoadingAnalysis = false;
//       },
//       error: (err) => {
//         // this.toastr.error('Failed to load analyses', 'Error');
//         this.isLoadingAnalysis = false;
//         console.error(err);
//       }
//     });
//   }

//   private loadAnalysisTypes(): void {
//     this.cifService.getAnalysisTypes(this.selectedInstrumentId).subscribe({
//       next: (data) => {
//         this.analysisTypes = data;
//       },
//       error: (err) => {
//         console.error('Failed to load analysis types', err);
//       }
//     });
//   }

//   onAnalysisSearch(searchValue: string): void {
//     this.analysisSearchText = searchValue;
//     this.analysisCurrentPage = 1;
//     this.filterAndPaginateAnalyses();
//   }

//   private filterAndPaginateAnalyses(): void {
//     let filtered = this.analyses;

//     if (this.analysisSearchText) {
//       const search = this.analysisSearchText.toLowerCase();
//       filtered = filtered.filter(a =>
//         a.analysisType.toLowerCase().includes(search) ||
//         a.createdBy.toLowerCase().includes(search)
//       );
//     }

//     this.filteredAnalyses = filtered;
//     this.paginateData('analysis');
//   }

//   onAnalysisPageSizeChange(): void {
//     this.analysisCurrentPage = 1;
//     this.paginateData('analysis');
//   }

//   private paginateData(type: 'analysis' | 'price'): void {
//     if (type === 'analysis') {
//       const startIndex = (this.analysisCurrentPage - 1) * this.analysisPageSize;
//       this.analysisPaginatedData = this.filteredAnalyses.slice(
//         startIndex,
//         startIndex + this.analysisPageSize
//       );
//     } else {
//       const startIndex = (this.priceCurrentPage - 1) * this.pricePageSize;
//       this.pricePaginatedData = this.filteredAnalysisPrices.slice(
//         startIndex,
//         startIndex + this.pricePageSize
//       );
//     }
//   }

//   getTotalAnalysisPages(): number {
//     return Math.ceil(this.filteredAnalyses.length / this.analysisPageSize);
//   }

//   openAddAnalysisModal(): void {
//     this.isEditingAnalysis = false;
//     this.analysisForm.reset();
//     this.addAnalysisModal.show();
//   }

//   openEditAnalysisModal(analysis: Analysis): void {
//     this.isEditingAnalysis = true;
//     this.editingAnalysisId = analysis.id;
//     this.analysisForm.patchValue({
//       analysisType: analysis.analysisType
//     });
//     this.editAnalysisModal.show();
//   }

//   submitAnalysis(): void {
//     if (this.analysisForm.invalid) {
//       // this.toastr.warning('Please fill all required fields', 'Validation Error');
//       return;
//     }

//     this.isSubmittingAnalysis = true;
//     const payload = {
//       action: this.isEditingAnalysis ? 'UpdateAnalysis' : 'InsertAnalysis',
//       recordId: this.editingAnalysisId || null,
//       analysisType: this.analysisForm.value.analysisType,
//       instrumentId: this.selectedInstrumentId,
//       userId: this.currentUserId
//     };

//     this.cifService.crudAnalysis(payload).subscribe({
//       next: (response) => {
//         if (response.msg === 'Success') {
//           this.toastr.success(
//             this.isEditingAnalysis ? 'Analysis updated successfully' : 'Analysis added successfully',
//             'Success'
//           );
//           this.loadAnalyses();
//           this.isEditingAnalysis ? this.editAnalysisModal.hide() : this.addAnalysisModal.hide();
//         } else {
//           this.toastr.error(response.msg || 'Operation failed', 'Error');
//         }
//         this.isSubmittingAnalysis = false;
//       },
//       error: (err) => {
//         this.toastr.error('Failed to save analysis', 'Error');
//         this.isSubmittingAnalysis = false;
//         console.error(err);
//       }
//     });
//   }

//   deleteAnalysis(analysis: Analysis): void {
//     if (confirm(`Are you sure you want to delete "${analysis.analysisType}"?`)) {
//       this.cifService.deleteAnalysis(analysis.id, this.currentUserId).subscribe({
//         next: (response) => {
//           if (response.msg === 'Success') {
//             this.toastr.success('Analysis deleted successfully', 'Success');
//             this.loadAnalyses();
//           } else {
//             this.toastr.error(response.msg || 'Delete failed', 'Error');
//           }
//         },
//         error: (err) => {
//           this.toastr.error('Failed to delete analysis', 'Error');
//           console.error(err);
//         }
//       });
//     }
//   }

//   exportAnalysisToExcel(): void {
//     const dataToExport = this.filteredAnalyses.map(a => ({
//       'Analysis Type': a.analysisType,
//       'Instrument ID': a.instrumentId,
//       'Created By': a.createdBy,
//       'Created On': new Date(a.createdOn).toLocaleDateString()
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyses');
//     XLSX.writeFile(workbook, `Analysis_Export_${new Date().getTime()}.xlsx`);
//     this.toastr.success('Analysis data exported to Excel', 'Success');
//   }

//   // ==================== ANALYSIS PRICE METHODS ====================
//   private createAnalysisPriceForm(): FormGroup {
//     return this.fb.group({
//       analysisType: ['', Validators.required],
//       userTypeId: ['', Validators.required],
//       price: ['', [Validators.required, Validators.min(0)]]
//     });
//   }

//   private loadAnalysisPrices(): void {
//     this.isLoadingPrice = true;
//     this.cifService.getAnalysisPrices(this.selectedInstrumentId).subscribe({
//       next: (data) => {
//         this.analysisPrices = data;
//         this.filterAndPaginateAnalysisPrices();
//         this.isLoadingPrice = false;
//       },
//       error: (err) => {
//         this.toastr.error('Failed to load analysis prices', 'Error');
//         this.isLoadingPrice = false;
//         console.error(err);
//       }
//     });
//   }

//   onPriceSearch(searchValue: string): void {
//     this.priceSearchText = searchValue;
//     this.priceCurrentPage = 1;
//     this.filterAndPaginateAnalysisPrices();
//   }

//   private filterAndPaginateAnalysisPrices(): void {
//     let filtered = this.analysisPrices;

//     if (this.priceSearchText) {
//       const search = this.priceSearchText.toLowerCase();
//       filtered = filtered.filter(p =>
//         p.analysisType.toLowerCase().includes(search) ||
//         p.typeName.toLowerCase().includes(search) ||
//         p.price.includes(search)
//       );
//     }

//     this.filteredAnalysisPrices = filtered;
//     this.paginateData('price');
//   }

//   onPricePageSizeChange(): void {
//     this.priceCurrentPage = 1;
//     this.paginateData('price');
//   }

//   getTotalPricePages(): number {
//     return Math.ceil(this.filteredAnalysisPrices.length / this.pricePageSize);
//   }

//   openAddAnalysisPriceModal(): void {
//     if (!this.selectedInstrumentId) {
//       this.toastr.warning('Please select an instrument first', 'Validation');
//       return;
//     }
//     this.isEditingPrice = false;
//     this.analysisPriceForm.reset();
//     this.loadAnalysisTypes();
//     this.addAnalysisPriceModal.show();
//   }

//   openEditAnalysisPriceModal(price: AnalysisPrice): void {
//     this.isEditingPrice = true;
//     this.editingPriceId = price.recordId;
//     this.analysisPriceForm.patchValue({
//       analysisType: price.analysisId,
//       userTypeId: price.userTypeId,
//       price: price.price
//     });
//     this.editAnalysisPriceModal.show();
//   }

//   submitAnalysisPrice(): void {
//     if (this.analysisPriceForm.invalid) {
//       this.toastr.warning('Please fill all required fields', 'Validation Error');
//       return;
//     }

//     this.isSubmittingPrice = true;
//     const selectedAnalysis = this.analyses.find(a => a.id === this.analysisPriceForm.value.analysisType);
//     const selectedUserType = this.userTypes.find(u => u.id === this.analysisPriceForm.value.userTypeId);

//     const payload = {
//       action: this.isEditingPrice ? 'UpdateAnalysisPrice' : 'InsertAnalysisPrice',
//       recordId: this.editingPriceId || null,
//       analysisId: this.analysisPriceForm.value.analysisType,
//       userTypeId: this.analysisPriceForm.value.userTypeId,
//       typeName: selectedUserType?.name || 'Per sample based',
//       price: this.analysisPriceForm.value.price,
//       userId: this.currentUserId
//     };

//     this.cifService.crudAnalysisPrice(payload).subscribe({
//       next: (response) => {
//         if (response.msg === 'Success') {
//           this.toastr.success(
//             this.isEditingPrice ? 'Price updated successfully' : 'Price added successfully',
//             'Success'
//           );
//           this.loadAnalysisPrices();
//           this.isEditingPrice ? this.editAnalysisPriceModal.hide() : this.addAnalysisPriceModal.hide();
//         } else {
//           this.toastr.error(response.msg || 'Operation failed', 'Error');
//         }
//         this.isSubmittingPrice = false;
//       },
//       error: (err) => {
//         this.toastr.error('Failed to save analysis price', 'Error');
//         this.isSubmittingPrice = false;
//         console.error(err);
//       }
//     });
//   }

//   deleteAnalysisPrice(price: AnalysisPrice): void {
//     if (confirm(`Are you sure you want to delete this price record?`)) {
//       this.cifService.deleteAnalysisPrice(price.recordId, this.currentUserId).subscribe({
//         next: (response) => {
//           if (response.msg === 'Success') {
//             this.toastr.success('Price deleted successfully', 'Success');
//             this.loadAnalysisPrices();
//           } else {
//             this.toastr.error(response.msg || 'Delete failed', 'Error');
//           }
//         },
//         error: (err) => {
//           this.toastr.error('Failed to delete price', 'Error');
//           console.error(err);
//         }
//       });
//     }
//   }

//   exportAnalysisPriceToExcel(): void {
//     const dataToExport = this.filteredAnalysisPrices.map(p => ({
//       'Analysis Type': p.analysisType,
//       'Instrument': p.instrumentName,
//       'User Type': p.typeName,
//       'Price': p.price,
//       'Created On': new Date(p.createdOn).toLocaleDateString()
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis Prices');
//     XLSX.writeFile(workbook, `Analysis_Prices_Export_${new Date().getTime()}.xlsx`);
//     this.toastr.success('Analysis price data exported to Excel', 'Success');
//   }
// }
