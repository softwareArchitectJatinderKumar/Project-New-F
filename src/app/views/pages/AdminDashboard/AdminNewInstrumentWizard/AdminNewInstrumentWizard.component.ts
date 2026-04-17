import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { StorageService } from 'src/app/_services/storage.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface AnalysisItem {
  id?: number;
  name: string;
}

interface PriceItem {
  analysisId?: number;
  analysisName: string;
  userTypeId: string;
  price: string;
}

@Component({
  selector: 'app-AdminNewInstrumentWizard',
  templateUrl: './AdminNewInstrumentWizard.component.html',
  styleUrls: ['./AdminNewInstrumentWizard.component.scss']
})
export class AdminNewInstrumentWizardComponent implements OnInit {
  
  currentStep = 1;
  totalSteps = 5;
  
  categoryForm: FormGroup;
  instrumentForm: FormGroup;
  analysisForm: FormGroup;
  
  analyses: AnalysisItem[] = [];
  prices: PriceItem[] = [];
  
  instrumentImageFile: File | null = null;
  instrumentImageFileName: string = '';
  instrumentImageBase64: string = '';
  
  sampleExcelFile: File | null = null;
  sampleExcelFileName: string = '';
  sampleExcelData: any[] = [];
  sampleExcelBase64: string = '';
  
  userTypes = [
    { id: 'INTERNAL', name: 'Internal User' },
    { id: 'EXTERNAL_ACADEMIA', name: 'External Academia' },
    { id: 'INDUSTRY', name: 'Industry User' }
  ];
  
  categorySubmitted = false;
  instrumentSubmitted = false;
  analysisSubmitted = false;
  isSubmitting = false;
  instrumentImageUploaded = false;
  excelFileUploaded = false;

  constructor(
    private fb: FormBuilder,
    private CIFwebService: LpuCIFWebService,
    private storageService: StorageService,
    private router: Router
  ) {
    this.categoryForm = this.fb.group({
      categoryName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1500)]],
      categoryDescription: ['', [Validators.maxLength(2000)]]
    });
    
    this.instrumentForm = this.fb.group({
      instrumentName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1500)]],
      instrumentDescription: ['', [Validators.maxLength(2000)]],
      imageUrl: [''],
      responsibleUids: ['', [Validators.maxLength(50)]]
    });
    
    this.analysisForm = this.fb.group({
      analysisType: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1500)]]
    });
  }

  ngOnInit(): void {
    this.updatePricesForAnalyses();
  }
  
  updatePricesForAnalyses(): void {
    const newPrices: PriceItem[] = [];
    for (const analysis of this.analyses) {
      for (const userType of this.userTypes) {
        const existingPrice = this.prices.find(p => 
          p.analysisName === analysis.name && p.userTypeId === userType.id
        );
        if (existingPrice) {
          newPrices.push(existingPrice);
        } else {
          newPrices.push({
            analysisId: analysis.id,
            analysisName: analysis.name,
            userTypeId: userType.id,
            price: ''
          });
        }
      }
    }
    this.prices = newPrices;
  }
  
  get categoryControls() {
    return this.categoryForm.controls;
  }
  
  get instrumentControls() {
    return this.instrumentForm.controls;
  }
  
  get analysisControls() {
    return this.analysisForm.controls;
  }
  
  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.categoryForm.valid;
      case 2:
        return this.instrumentForm.valid && this.instrumentImageUploaded && this.excelFileUploaded;
      case 3:
        return this.analyses.length > 0;
      case 4:
        return this.prices.length > 0 && this.areAllPricesValid();
      case 5:
        return this.categoryForm.valid && this.instrumentForm.valid && this.instrumentImageUploaded &&
               this.excelFileUploaded && this.analyses.length > 0 && this.areAllPricesValid();
      default:
        return false;
    }
  }
  
  areAllPricesValid(): boolean {
    return this.prices.every(p => p.price && p.price.trim() !== '');
  }
  
  nextStep(): void {
    switch (this.currentStep) {
      case 1:
        this.categorySubmitted = true;
        if (this.categoryForm.invalid) { return; }
        this.currentStep = 2;
        break;
      case 2:
        this.instrumentSubmitted = true;
        if (this.instrumentForm.invalid) { return; }
        if (!this.instrumentImageUploaded) {
          Swal.fire('Error', 'Please upload instrument image', 'error');
          return;
        }
        if (!this.excelFileUploaded) {
          Swal.fire('Error', 'Please upload sample Excel sheet', 'error');
          return;
        }
        this.currentStep = 3;
        break;
      case 3:
        if (this.analyses.length === 0) {
          Swal.fire('Error', 'Please add at least one analysis type', 'error');
          return;
        }
        this.currentStep = 4;
        break;
      case 4:
        if (!this.areAllPricesValid()) {
          Swal.fire('Error', 'Please fill in all price fields', 'error');
          return;
        }
        this.currentStep = 5;
        break;
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  onInstrumentImageSelected(event: any): void {
    const file: File | null = (event.target.files as FileList)[0] || null;
    if (!file) { return; }
    
    if (file.size > 10048576) {
      Swal.fire({ title: 'File size exceeds 1MB', text: 'Please upload a smaller file', icon: 'warning' });
      event.target.value = '';
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({ title: 'Invalid file type', text: 'Please upload a valid image file', icon: 'warning' });
      event.target.value = '';
      return;
    }
    
    this.instrumentImageFile = file;
    this.instrumentImageFileName = file.name;
    this.instrumentImageUploaded = true;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result.split(',');
      this.instrumentImageBase64 = base64[1]; // Store pure Base64 for the API
    };
    reader.readAsDataURL(file);
  }
  
  onSampleExcelSelected(event: any): void {
    const file: File | null = (event.target.files as FileList)[0] || null;
    if (!file) { return; }
    
    if (file.size > 1048576) {
      Swal.fire({ title: 'File size exceeds 1MB', text: 'Please upload a smaller file', icon: 'warning' });
      event.target.value = '';
      return;
    }
    
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      Swal.fire({ title: 'Invalid file type', text: 'Please upload a valid Excel file', icon: 'warning' });
      event.target.value = '';
      return;
    }
    
    this.readExcelFile(file);
  }
  
  readExcelFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      this.sampleExcelData = this.processUploadedDataForDisplay(rawData);
      this.sampleExcelFile = file;
      this.sampleExcelFileName = file.name;
      this.excelFileUploaded = true;
    };
    reader.readAsArrayBuffer(file);
    
    const readerBase64 = new FileReader();
    readerBase64.onload = (e: any) => {
      const base64 = e.target.result.split(',');
      this.sampleExcelBase64 = base64[1]; // Store pure Base64 for the API
    };
    readerBase64.readAsDataURL(file);
  }
  
  processUploadedDataForDisplay(rawData: any[]): any[] {
    if (!rawData || rawData.length === 0) { return []; }
    const displayData: any[] = [];
    displayData.push(rawData[0]);
    for (let i = 1; i < rawData.length; i++) {
      if (rawData[i] && rawData[i].length > 0) {
        displayData.push(rawData[i]);
      }
    }
    return displayData;
  }
  
  addAnalysis(): void {
    const analysisName = this.analysisForm.get('analysisType')?.value?.trim();
    if (!analysisName) {
      Swal.fire('Error', 'Please enter an analysis type', 'error');
      return;
    }
    
    if (this.analyses.some(a => a.name.toLowerCase() === analysisName.toLowerCase())) {
      Swal.fire('Error', 'This analysis type already exists', 'error');
      return;
    }
    
    this.analyses.push({ id: this.analyses.length + 1, name: analysisName });
    this.updatePricesForAnalyses();
    this.analysisForm.reset();
    this.analysisSubmitted = false;
  }
  
  removeAnalysis(index: number): void {
    const removedAnalysis = this.analyses[index];
    this.analyses.splice(index, 1);
    this.prices = this.prices.filter(p => p.analysisName !== removedAnalysis.name);
  }
  
  updatePrice(analysisName: string, userTypeId: string, price: string): void {
    const priceItem = this.prices.find(p => p.analysisName === analysisName && p.userTypeId === userTypeId);
    if (priceItem) { priceItem.price = price; }
  }
  
  getPriceValue(analysisName: string, userTypeId: string): string {
    const priceItem = this.prices.find(p => p.analysisName === analysisName && p.userTypeId === userTypeId);
    return priceItem ? priceItem.price : '';
  }
  
  getUserTypeName(userTypeId: string): string {
    const userType = this.userTypes.find(t => t.id === userTypeId);
    return userType ? userType.name : userTypeId;
  }
  
// AdminNewInstrumentWizard.component.ts

createAll(): void {
    if (this.isSubmitting) return;
    
    // Validate all forms and file uploads before submitting
    if (this.categoryForm.invalid || this.instrumentForm.invalid || 
        !this.instrumentImageUploaded || !this.excelFileUploaded ||
        this.analyses.length === 0 || !this.areAllPricesValid()) {
      Swal.fire('Error', 'Please complete all steps correctly', 'error');
      return;
    }
    
    this.isSubmitting = true;
    const loginName = this.storageService.getUser() || 'Admin';
    
    // STEP 1: CREATE CATEGORY
    const categoryPayload = {
      ActionType: 'CATEGORY',
      Name: this.categoryForm.get('categoryName')?.value,
      Description: this.categoryForm.get('categoryDescription')?.value,
      LoginName: loginName
    };
    
    this.CIFwebService.callStoredProcedure(categoryPayload).subscribe({
      next: (response: any) => {
        let categoryId = response?.[0]?.NewId || response?.NewId; // Extract the new ID from the response
        
        if (!categoryId) {
          this.isSubmitting = false;
          Swal.fire('Error', 'Failed to retrieve Category ID', 'error');
          return;
        }
        
        // STEP 2: CREATE INSTRUMENT with binary data for FTP upload
        const instrumentPayload = {
          ActionType: 'INSTRUMENT',
          CategoryId: categoryId,
          Name: this.instrumentForm.get('instrumentName')?.value,
          Description: this.instrumentForm.get('instrumentDescription')?.value,
          ImageUrl: this.instrumentImageFileName, // Filename used for extension in C#
          ImageFileData: this.instrumentImageBase64, // Base64 string for FTP processing
          ResponsibleUids: this.instrumentForm.get('responsibleUids')?.value,
          SampleExcelSheetUrl: this.sampleExcelFileName, 
          ExcelFile: this.sampleExcelBase64, // Base64 string for FTP processing
          LoginName: loginName
        };
        
        this.CIFwebService.callStoredProcedure(instrumentPayload).subscribe({
          next: (response2: any) => {
            let instrumentId = response2?.[0]?.NewId || response2?.NewId;
            
            if (!instrumentId) {
              this.isSubmitting = false;
              Swal.fire('Error', 'Failed to retrieve Instrument ID', 'error');
              return;
            }
            
            // Proceed to create analyses and prices sequentially
            this.createAnalysesSequentially(instrumentId, loginName, 0, []);
          },
          error: () => {
            this.isSubmitting = false;
            Swal.fire('Error', 'Instrument creation failed', 'error');
          }
        });
      },
      error: () => {
        this.isSubmitting = false;
        Swal.fire('Error', 'Category creation failed', 'error');
      }
    });
}
  
  createAnalysesSequentially(instrumentId: any, loginName: string, index: number, analysisIds: any[]): void {
    if (index >= this.analyses.length) {
      this.createPricesSequentially(analysisIds, loginName, 0);
      return;
    }
    
    const analysis = this.analyses[index];
    const analysisPayload = {
      ActionType: 'ANALYSIS',
      InstrumentId: instrumentId,
      Name: analysis.name,
      LoginName: loginName
    };
    
    this.CIFwebService.callStoredProcedure(analysisPayload).subscribe({
      next: (response: any) => {
        let analysisId = response?.[0]?.NewId || response?.NewId;
        if (analysisId) {
          analysisIds.push({ name: analysis.name, id: analysisId });
        }
        this.createAnalysesSequentially(instrumentId, loginName, index + 1, analysisIds);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        Swal.fire('Error', 'Analysis creation failed for: ' + analysis.name, 'error');
      }
    });
  }
  
  createPricesSequentially(analysisIds: any[], loginName: string, index: number): void {
    if (index >= this.prices.length) {
      this.isSubmitting = false;
      Swal.fire('Success', 'Wizard Completed Successfully', 'success');
      this.resetWizard();
      return;
    }
    
    const priceItem = this.prices[index];
    const analysisInfo = analysisIds.find(a => a.name === priceItem.analysisName);
    
    const pricePayload = {
      ActionType: 'PRICE',
      AnalysisId: analysisInfo?.id,
      UserTypeId: priceItem.userTypeId,
      Price: priceItem.price.toString(),
      LoginName: loginName
    };
    
    this.CIFwebService.callStoredProcedure(pricePayload).subscribe({
      next: () => {
        this.createPricesSequentially(analysisIds, loginName, index + 1);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        Swal.fire('Error', 'Price creation failed for: ' + priceItem.analysisName, 'error');
      }
    });
  }
  
  resetWizard(): void {
    this.currentStep = 1;
    this.categoryForm.reset();
    this.instrumentForm.reset();
    this.analysisForm.reset();
    this.analyses = [];
    this.prices = [];
    this.instrumentImageFile = null;
    this.instrumentImageFileName = '';
    this.instrumentImageBase64 = '';
    this.instrumentImageUploaded = false;
    this.sampleExcelFile = null;
    this.sampleExcelFileName = '';
    this.sampleExcelData = [];
    this.sampleExcelBase64 = '';
    this.excelFileUploaded = false;
    this.categorySubmitted = false;
    this.instrumentSubmitted = false;
    this.analysisSubmitted = false;
    this.updatePricesForAnalyses();
  }
  
  cancel(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will lose all entered data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/dashboard']);
      }
    });
  }
  
  getStepClass(step: number): string {
    if (step < this.currentStep) {
      return 'completed';
    } else if (step === this.currentStep) {
      return 'active';
    } else {
      return 'pending';
    }
  }
}

// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import { StorageService } from 'src/app/_services/storage.service';
// import Swal from 'sweetalert2';
// import * as XLSX from 'xlsx';

// interface AnalysisItem {
//   id?: number;
//   name: string;
// }

// interface PriceItem {
//   analysisId?: number;
//   analysisName: string;
//   userTypeId: string;
//   price: string;
// }

// @Component({
//   selector: 'app-AdminNewInstrumentWizard',
//   templateUrl: './AdminNewInstrumentWizard.component.html',
//   styleUrls: ['./AdminNewInstrumentWizard.component.scss']
// })
// export class AdminNewInstrumentWizardComponent implements OnInit {
  
//   currentStep = 1;
//   totalSteps = 5;
  
//   categoryForm: FormGroup;
//   instrumentForm: FormGroup;
//   analysisForm: FormGroup;
  
//   analyses: AnalysisItem[] = [];
//   prices: PriceItem[] = [];
  
//   instrumentImageFile: File | null = null;
//   instrumentImageFileName: string = '';
//   instrumentImageBase64: string = '';
  
//   sampleExcelFile: File | null = null;
//   sampleExcelFileName: string = '';
//   sampleExcelData: any[] = [];
//   sampleExcelBase64: string = '';
  
//   userTypes = [
//     { id: 'INTERNAL', name: 'Internal User' },
//     { id: 'EXTERNAL_ACADEMIA', name: 'External Academia' },
//     { id: 'INDUSTRY', name: 'Industry User' }
//   ];
  
//   categorySubmitted = false;
//   instrumentSubmitted = false;
//   analysisSubmitted = false;
//   isSubmitting = false;
//   instrumentImageUploaded = false;
//   excelFileUploaded = false;

//   constructor(
//     private fb: FormBuilder,
//     private CIFwebService: LpuCIFWebService,
//     private storageService: StorageService,
//     private router: Router
//   ) {
//     this.categoryForm = this.fb.group({
//       categoryName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1500)]],
//       categoryDescription: ['', [Validators.maxLength(2000)]]
//     });
    
//     this.instrumentForm = this.fb.group({
//       instrumentName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1500)]],
//       instrumentDescription: ['', [Validators.maxLength(2000)]],
//       imageUrl: [''],
//       responsibleUids: ['', [Validators.maxLength(50)]]
//     });
    
//     this.analysisForm = this.fb.group({
//       analysisType: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1500)]]
//     });
//   }

//   ngOnInit(): void {
//     this.updatePricesForAnalyses();
//   }
  
//   updatePricesForAnalyses(): void {
//     const newPrices: PriceItem[] = [];
//     for (const analysis of this.analyses) {
//       for (const userType of this.userTypes) {
//         const existingPrice = this.prices.find(p => 
//           p.analysisName === analysis.name && p.userTypeId === userType.id
//         );
//         if (existingPrice) {
//           newPrices.push(existingPrice);
//         } else {
//           newPrices.push({
//             analysisId: analysis.id,
//             analysisName: analysis.name,
//             userTypeId: userType.id,
//             price: ''
//           });
//         }
//       }
//     }
//     this.prices = newPrices;
//   }
  
//   get categoryControls() {
//     return this.categoryForm.controls;
//   }
  
//   get instrumentControls() {
//     return this.instrumentForm.controls;
//   }
  
//   get analysisControls() {
//     return this.analysisForm.controls;
//   }
  
//   isStepValid(step: number): boolean {
//     switch (step) {
//       case 1:
//         return this.categoryForm.valid;
//       case 2:
//         return this.instrumentForm.valid && this.instrumentImageUploaded && this.excelFileUploaded;
//       case 3:
//         return this.analyses.length > 0;
//       case 4:
//         return this.prices.length > 0 && this.areAllPricesValid();
//       case 5:
//         return this.categoryForm.valid && this.instrumentForm.valid && this.instrumentImageUploaded &&
//                this.excelFileUploaded && this.analyses.length > 0 && this.areAllPricesValid();
//       default:
//         return false;
//     }
//   }
  
//   areAllPricesValid(): boolean {
//     return this.prices.every(p => p.price && p.price.trim() !== '');
//   }
  
//   nextStep(): void {
//     switch (this.currentStep) {
//       case 1:
//         this.categorySubmitted = true;
//         if (this.categoryForm.invalid) { return; }
//         this.currentStep = 2;
//         break;
//       case 2:
//         this.instrumentSubmitted = true;
//         if (this.instrumentForm.invalid) { return; }
//         if (!this.instrumentImageUploaded) {
//           Swal.fire('Error', 'Please upload instrument image', 'error');
//           return;
//         }
//         if (!this.excelFileUploaded) {
//           Swal.fire('Error', 'Please upload sample Excel sheet', 'error');
//           return;
//         }
//         this.currentStep = 3;
//         break;
//       case 3:
//         if (this.analyses.length === 0) {
//           Swal.fire('Error', 'Please add at least one analysis type', 'error');
//           return;
//         }
//         this.currentStep = 4;
//         break;
//       case 4:
//         if (!this.areAllPricesValid()) {
//           Swal.fire('Error', 'Please fill in all price fields', 'error');
//           return;
//         }
//         this.currentStep = 5;
//         break;
//     }
//   }
  
//   previousStep(): void {
//     if (this.currentStep > 1) {
//       this.currentStep--;
//     }
//   }
  
//   onInstrumentImageSelected(event: any): void {
//     const file: File | null = (event.target.files as FileList)[0] || null;
//     if (!file) { return; }
    
//     if (file.size > 1048576) {
//       Swal.fire({ title: 'File size exceeds 1MB', text: 'Please upload a smaller file', icon: 'warning' });
//       event.target.value = '';
//       return;
//     }
    
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
//     if (!validTypes.includes(file.type)) {
//       Swal.fire({ title: 'Invalid file type', text: 'Please upload a valid image file', icon: 'warning' });
//       event.target.value = '';
//       return;
//     }
    
//     this.instrumentImageFile = file;
//     this.instrumentImageFileName = file.name;
//     this.instrumentImageUploaded = true;
    
//     const reader = new FileReader();
//     reader.onload = (e: any) => {
//       const base64 = e.target.result.split(',');
//       this.instrumentImageBase64 = base64[1];
//     };
//     reader.readAsDataURL(file);
//   }
  
//   onSampleExcelSelected(event: any): void {
//     const file: File | null = (event.target.files as FileList)[0] || null;
//     if (!file) { return; }
    
//     if (file.size > 1048576) {
//       Swal.fire({ title: 'File size exceeds 1MB', text: 'Please upload a smaller file', icon: 'warning' });
//       event.target.value = '';
//       return;
//     }
    
//     const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
//     if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
//       Swal.fire({ title: 'Invalid file type', text: 'Please upload a valid Excel file', icon: 'warning' });
//       event.target.value = '';
//       return;
//     }
    
//     this.readExcelFile(file);
//   }
  
//   readExcelFile(file: File): void {
//     // Read as ArrayBuffer for parsing
//     const reader = new FileReader();
//     reader.onload = (e: any) => {
//       const data = e.target.result;
//       const workbook = XLSX.read(data, { type: 'array' });
//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];
//       const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
//       this.sampleExcelData = this.processUploadedDataForDisplay(rawData);
//       this.sampleExcelFile = file;
//       this.sampleExcelFileName = file.name;
//       this.excelFileUploaded = true;
//     };
//     reader.readAsArrayBuffer(file);
    
//     // Also read as DataURL for base64
//     const readerBase64 = new FileReader();
//     readerBase64.onload = (e: any) => {
//       const base64 = e.target.result.split(',');
//       this.sampleExcelBase64 = base64[1];
//     };
//     readerBase64.readAsDataURL(file);
//   }
  
//   processUploadedDataForDisplay(rawData: any[]): any[] {
//     if (!rawData || rawData.length === 0) { return []; }
//     const displayData: any[] = [];
//     displayData.push(rawData[0]);
//     for (let i = 1; i < rawData.length; i++) {
//       if (rawData[i] && rawData[i].length > 0) {
//         displayData.push(rawData[i]);
//       }
//     }
//     return displayData;
//   }
  
//   addAnalysis(): void {
//     const analysisName = this.analysisForm.get('analysisType')?.value?.trim();
//     if (!analysisName) {
//       Swal.fire('Error', 'Please enter an analysis type', 'error');
//       return;
//     }
    
//     if (this.analyses.some(a => a.name.toLowerCase() === analysisName.toLowerCase())) {
//       Swal.fire('Error', 'This analysis type already exists', 'error');
//       return;
//     }
    
//     this.analyses.push({ id: this.analyses.length + 1, name: analysisName });
//     this.updatePricesForAnalyses();
//     this.analysisForm.reset();
//     this.analysisSubmitted = false;
//   }
  
//   removeAnalysis(index: number): void {
//     const removedAnalysis = this.analyses[index];
//     this.analyses.splice(index, 1);
//     this.prices = this.prices.filter(p => p.analysisName !== removedAnalysis.name);
//   }
  
//   updatePrice(analysisName: string, userTypeId: string, price: string): void {
//     const priceItem = this.prices.find(p => p.analysisName === analysisName && p.userTypeId === userTypeId);
//     if (priceItem) { priceItem.price = price; }
//   }
  
//   getPriceValue(analysisName: string, userTypeId: string): string {
//     const priceItem = this.prices.find(p => p.analysisName === analysisName && p.userTypeId === userTypeId);
//     return priceItem ? priceItem.price : '';
//   }
  
//   getUserTypeName(userTypeId: string): string {
//     const userType = this.userTypes.find(t => t.id === userTypeId);
//     return userType ? userType.name : userTypeId;
//   }
  
//   createAll(): void {
//     if (this.isSubmitting) return;
    
//     if (this.categoryForm.invalid || this.instrumentForm.invalid || 
//         !this.instrumentImageUploaded || !this.excelFileUploaded ||
//         this.analyses.length === 0 || !this.areAllPricesValid()) {
//       Swal.fire('Error', 'Please complete all steps correctly', 'error');
//       return;
//     }
    
//     this.isSubmitting = true;
//     const loginName = this.storageService.getUser() || 'Admin';
    
//     const categoryPayload = {
//       ActionType: 'CATEGORY',
//       Name: this.categoryForm.get('categoryName')?.value,
//       Description: this.categoryForm.get('categoryDescription')?.value,
//       LoginName: loginName
//     };
    
//     this.CIFwebService.callStoredProcedure(categoryPayload).subscribe({
//       next: (response: any) => {
//         let categoryId = null;
//         if (response && response.length > 0 && response[0].NewId) {
//           categoryId = response[0].NewId;
//         } else if (response && response.NewId) {
//           categoryId = response.NewId;
//         }
        
//         if (!categoryId) {
//           this.isSubmitting = false;
//           Swal.fire('Error', 'Failed to create category', 'error');
//           return;
//         }
        
//         const instrumentPayload = {
//           ActionType: 'INSTRUMENT',
//           CategoryId: categoryId,
//           Name: this.instrumentForm.get('instrumentName')?.value,
//           Description: this.instrumentForm.get('instrumentDescription')?.value,
//           ImageUrl: this.instrumentForm.get('imageUrl')?.value,
//           ImageFileData: this.instrumentImageBase64,
//           ResponsibleUids: this.instrumentForm.get('responsibleUids')?.value,
//           SampleExcelSheetUrl: '',
//           ExcelFile: this.sampleExcelBase64,
//           LoginName: loginName
//         };
        
//         this.CIFwebService.callStoredProcedure(instrumentPayload).subscribe({
//           next: (response2: any) => {
//             let instrumentId = null;
//             if (response2 && response2.length > 0 && response2[0].NewId) {
//               instrumentId = response2[0].NewId;
//             } else if (response2 && response2.NewId) {
//               instrumentId = response2.NewId;
//             }
            
//             if (!instrumentId) {
//               this.isSubmitting = false;
//               Swal.fire('Error', 'Failed to create instrument', 'error');
//               return;
//             }
            
//             this.createAnalysesSequentially(instrumentId, loginName, 0, []);
//           },
//           error: (error: any) => {
//             this.isSubmitting = false;
//             Swal.fire('Error', 'Failed to create instrument: ' + (error.message || 'Unknown error'), 'error');
//           }
//         });
//       },
//       error: (error: any) => {
//         this.isSubmitting = false;
//         Swal.fire('Error', 'Failed to create category: ' + (error.message || 'Unknown error'), 'error');
//       }
//     });
//   }
  
//   createAnalysesSequentially(instrumentId: string, loginName: string, index: number, analysisIds: any[]): void {
//     if (index >= this.analyses.length) {
//       this.createPricesSequentially(analysisIds, loginName, 0);
//       return;
//     }
    
//     const analysis = this.analyses[index];
//     const analysisPayload = {
//       ActionType: 'ANALYSIS',
//       InstrumentId: instrumentId,
//       Name: analysis.name,
//       LoginName: loginName
//     };
    
//     this.CIFwebService.callStoredProcedure(analysisPayload).subscribe({
//       next: (response: any) => {
//         let analysisId = null;
//         if (response && response.length > 0 && response[0].NewId) {
//           analysisId = response[0].NewId;
//         } else if (response && response.NewId) {
//           analysisId = response.NewId;
//         }
        
//         if (analysisId) {
//           analysisIds.push({ name: analysis.name, id: analysisId });
//         }
        
//         this.createAnalysesSequentially(instrumentId, loginName, index + 1, analysisIds);
//       },
//       error: (error: any) => {
//         this.isSubmitting = false;
//         Swal.fire('Error', 'Failed to create analysis: ' + (error.message || 'Unknown error'), 'error');
//       }
//     });
//   }
  
//   createPricesSequentially(analysisIds: any[], loginName: string, index: number): void {
//     if (index >= this.prices.length) {
//       this.isSubmitting = false;
//       Swal.fire('Success', `Instrument created successfully with ${this.analyses.length} analysis type(s) and ${this.prices.length} price(s)!`, 'success');
//       this.resetWizard();
//       return;
//     }
    
//     const priceItem = this.prices[index];
//     const analysisInfo = analysisIds.find(a => a.name === priceItem.analysisName);
    
//     if (!analysisInfo) {
//       this.isSubmitting = false;
//       Swal.fire('Error', 'Analysis not found for price creation', 'error');
//       return;
//     }
    
//     const pricePayload = {
//       ActionType: 'PRICE',
//       AnalysisId: analysisInfo.id,
//       UserTypeId: priceItem.userTypeId,
//       Price: priceItem.price,
//       LoginName: loginName
//     };
    
//     this.CIFwebService.callStoredProcedure(pricePayload).subscribe({
//       next: (response: any) => {
//         this.createPricesSequentially(analysisIds, loginName, index + 1);
//       },
//       error: (error: any) => {
//         this.isSubmitting = false;
//         Swal.fire('Error', 'Failed to create price: ' + (error.message || 'Unknown error'), 'error');
//       }
//     });
//   }
  
//   resetWizard(): void {
//     this.currentStep = 1;
//     this.categoryForm.reset();
//     this.instrumentForm.reset();
//     this.analysisForm.reset();
//     this.analyses = [];
//     this.prices = [];
//     this.instrumentImageFile = null;
//     this.instrumentImageFileName = '';
//     this.instrumentImageBase64 = '';
//     this.instrumentImageUploaded = false;
//     this.sampleExcelFile = null;
//     this.sampleExcelFileName = '';
//     this.sampleExcelData = [];
//     this.sampleExcelBase64 = '';
//     this.excelFileUploaded = false;
//     this.categorySubmitted = false;
//     this.instrumentSubmitted = false;
//     this.analysisSubmitted = false;
//     this.updatePricesForAnalyses();
//   }
  
//   cancel(): void {
//     Swal.fire({
//       title: 'Are you sure?',
//       text: 'You will lose all entered data!',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, cancel!',
//       cancelButtonText: 'No, keep it'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.router.navigate(['/dashboard']);
//       }
//     });
//   }
  
//   getStepClass(step: number): string {
//     if (step < this.currentStep) {
//       return 'completed';
//     } else if (step === this.currentStep) {
//       return 'active';
//     } else {
//       return 'pending';
//     }
//   }
// }
