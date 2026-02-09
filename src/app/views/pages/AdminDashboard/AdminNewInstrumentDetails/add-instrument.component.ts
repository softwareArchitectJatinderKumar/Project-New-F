import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { DOCUMENT } from '@angular/common';
import Swal from 'sweetalert2';
import { lastValueFrom } from 'rxjs';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';

interface UserType {
  id: string;
  name: string;
}

interface Analysis {
  AnalysisType: string;
}

interface PricingRow {
  analysisIndex: number;
  analysisName: string;
  userTypeId: string;
  userTypeName: string;
  price: number | null;
}

@Component({
  selector: 'app-add-instrument',
  templateUrl: './add-instrument.component.html',
  styleUrls: ['./add-instrument.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddInstrumentComponent implements OnInit {
  private cifWebService = inject(LpuCIFWebService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private document = inject(DOCUMENT);
  private cdr = inject(ChangeDetectorRef);

  currentStep = 1;
  userEmail: string | null = null;
  imagePreview: string | null = null;
  excelPreviewUrl: string | null = null;

  instrumentForm!: FormGroup;
  analysisForm!: FormGroup;
  pricingRows: PricingRow[] = [];

  readonly userTypes: UserType[] = [
    { id: '400000', name: 'Internal User' },
    { id: '400001', name: 'External Academia' },
    { id: '400002', name: 'Industry User' }
  ];

  fileStatus = false;
  fileData: File | null = null;
  fileName = '';
  uploadEnabled = false;
  instrumentFileName = '';
  instrumentExcelFileName = '';

  constructor() {}

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.instrumentForm = this.formBuilder.group({
      InstrumentName: ['', [Validators.required, Validators.maxLength(200)]],
      ResponsibleUids: ['', [Validators.required, Validators.maxLength(50)]],
      TargetAllocated: [null, [Validators.required, Validators.min(1)]],
      InstrumentImage: [null, Validators.required],
      SampleExcelSheet: [null, Validators.required],
      CategoryName: ['', [Validators.required, Validators.maxLength(100)]],
      CategoryDescription: ['', [Validators.required, Validators.maxLength(500)]]
    });

    this.analysisForm = this.formBuilder.group({
      analyses: this.formBuilder.array([this.createAnalysisGroup()])
    });

    this.generatePricingRows();
  }

  private createAnalysisGroup(): FormGroup {
    return this.formBuilder.group({
      AnalysisType: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  /**
   * Generates all combinations of Analysis × User Type
   */
  private generatePricingRows(): void {
    this.pricingRows = [];
    const analyses = this.analyses.value;

    for (let i = 0; i < analyses.length; i++) {
      for (const userType of this.userTypes) {
        this.pricingRows.push({
          analysisIndex: i,
          analysisName: analyses[i]?.AnalysisType || `Analysis ${i + 1}`,
          userTypeId: userType.id,
          userTypeName: userType.name,
          price: null
        });
      }
    }
    this.cdr.markForCheck();
  }

  /**
   * Refreshes analysis names in pricing rows (called when user types analysis name)
   */
  refreshAnalysisNames(): void {
    const analyses = this.analyses.value;
    
    for (let i = 0; i < analyses.length; i++) {
      const analysisName = analyses[i]?.AnalysisType || '';
      
      for (const row of this.pricingRows) {
        if (row.analysisIndex === i && analysisName) {
          row.analysisName = analysisName;
        }
      }
    }
    this.cdr.markForCheck();
  }

  /**
   * Updates pricing rows when analyses change (add/remove)
   */
  private updatePricingRows(): void {
    const analyses = this.analyses.value;
    const updatedRows: PricingRow[] = [];

    for (let i = 0; i < analyses.length; i++) {
      const analysisName = analyses[i]?.AnalysisType || '';
      
      for (const userType of this.userTypes) {
        const existingRow = this.pricingRows.find(
          r => r.analysisIndex === i && r.userTypeId === userType.id
        );
        
        updatedRows.push({
          analysisIndex: i,
          analysisName: analysisName || `Analysis ${i + 1}`,
          userTypeId: userType.id,
          userTypeName: userType.name,
          price: existingRow?.price ?? null
        });
      }
    }

    this.pricingRows = updatedRows;
    this.cdr.markForCheck();
  }

  get analyses(): FormArray {
    return this.analysisForm.get('analyses') as FormArray;
  }

  onFileSelected(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.instrumentForm.patchValue({ [field]: file });

      if (field === 'InstrumentImage') {
        this.instrumentFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview = e.target?.result as string;
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      } else if (field === 'SampleExcelSheet') {
        this.instrumentExcelFileName = file.name;
        this.excelPreviewUrl = URL.createObjectURL(file);
        this.cdr.markForCheck();
      }
    }
  }

  addAnalysis(): void {
    this.analyses.push(this.createAnalysisGroup());
    this.updatePricingRows();
    this.cdr.markForCheck();
  }

  removeAnalysis(index: number): void {
    if (this.analyses.length > 1) {
      this.analyses.removeAt(index);
      this.updatePricingRows();
      this.cdr.markForCheck();
    }
  }

  updatePrice(price: number | null, analysisIndex: number, userTypeId: string): void {
    const row = this.pricingRows.find(
      r => r.analysisIndex === analysisIndex && r.userTypeId === userTypeId
    );
    if (row) {
      row.price = price;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  nextStep(): void {
    if (this.currentStep < 5) {
      this.currentStep++;
      this.cdr.markForCheck();
    }
  }

  // Validation methods for Next button
  isStep1Valid(): boolean {
    const f = this.instrumentForm;
    return !!(
      f.get('InstrumentName')?.valid &&
      f.get('ResponsibleUids')?.valid &&
      f.get('TargetAllocated')?.valid &&
      f.get('InstrumentImage')?.valid &&
      f.get('SampleExcelSheet')?.valid
    );
  }

  isStep2Valid(): boolean {
    const f = this.instrumentForm;
    return !!(f.get('CategoryName')?.valid && f.get('CategoryDescription')?.valid);
  }

  isStep3Valid(): boolean {
    return this.analyses.controls.every(control => {
      return control.get('AnalysisType')?.valid ?? false;
    });
  }

  isStep4Valid(): boolean {
    return this.pricingRows.every(row => row.price !== null && row.price > 0);
  }

  canProceedToStep(step: number): boolean {
    switch (step) {
      case 2: return this.isStep1Valid();
      case 3: return this.isStep2Valid();
      case 4: return this.isStep3Valid();
      case 5: return this.isStep4Valid();
      default: return true;
    }
  }

  getTotalCombinations(): number {
    return this.analyses.length * this.userTypes.length;
  }

  getFilledCombinations(): number {
    return this.pricingRows.filter(row => row.price !== null && row.price > 0).length;
  }

  viewExcel(): void {
    if (this.excelPreviewUrl) {
      window.open(this.excelPreviewUrl, '_blank');
    }
  }

  /**
   * Saves all data using single CIFNewInstrumentDetails API
   */
  async finalSubmit(): Promise<void> {
    if (!this.isStep4Valid()) {
      Swal.fire({
        title: 'Incomplete Pricing',
        text: 'Please add prices for all combinations',
        icon: 'warning'
      });
      return;
    }

    Swal.fire({
      title: 'Saving Instrument System',
      html: 'Processing multi-stage data entry...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    try {
      const userEmail = this.userEmail || 'admin@lpu.com';

      // Create FormData for CIFNewInstrumentDetails API
      const formData = new FormData();
      
      // Instrument data with required parameters
      formData.append('ActionType', 'INSTRUMENT');
      formData.append('Name', this.instrumentForm.value.InstrumentName);
      formData.append('Description', this.instrumentForm.value.CategoryDescription);
      formData.append('ResponsibleUids', this.instrumentForm.value.ResponsibleUids);
      formData.append('SampleExcelSheetUrl', this.instrumentExcelFileName || '');
      formData.append('LoginName', userEmail);
      
      // Files (will be converted to byte arrays on server)
      formData.append('ExcelFile', this.instrumentForm.value.SampleExcelSheet);
      formData.append('ImageFileData', this.instrumentForm.value.InstrumentImage);
      
      // Analyses and Prices data as JSON
      const analysesData: any[] = this.analyses.value.map((a: Analysis, index: number) => ({
        ActionType: 'ANALYSIS',
        InstrumentId: 0,
        AnalysisId: 0,
        Name: a.AnalysisType,
        Description: '',
        ImageUrl: '',
        ResponsibleUids: this.instrumentForm.value.ResponsibleUids,
        UserTypeId: '',
        Price: 0,
        SampleExcelSheetUrl: '',
        LoginName: userEmail,
        Index: index
      }));
      formData.append('AnalysesData', JSON.stringify(analysesData));

      const pricesData: any[] = this.pricingRows.map(row => ({
        ActionType: 'PRICE',
        InstrumentId: 0,
        AnalysisId: 0,
        Name: row.analysisName,
        Description: '',
        ImageUrl: '',
        ResponsibleUids: this.instrumentForm.value.ResponsibleUids,
        UserTypeId: row.userTypeId,
        Price: row.price,
        SampleExcelSheetUrl: '',
        LoginName: userEmail,
        AnalysisIndex: row.analysisIndex
      }));
      formData.append('PricesData', JSON.stringify(pricesData));

      // Call single API
      const response = await lastValueFrom(
        this.cifWebService.CIFNewInstrumentDetails(formData)
      );

      Swal.fire({
        title: 'Success',
        text: 'Instrument System Registered Successfully!',
        icon: 'success'
      });
      this.router.navigate(['/AdminDashboard']);
    } catch (error) {
      console.error('Error during submission:', error);
      Swal.fire({
        title: 'Error',
        text: 'Save sequence failed. Check server logs.',
        icon: 'error'
      });
    }
  }






ExcelFileData:any; ExcelFileURl:any;
  
     ConsentLetterData: any = ''; ConsentLetterStatus: boolean = false;
     ConsentLetterFileName: any = '';
     onFileSelectedConsentLetter(event: any): void {
       const reader = new FileReader();
       const target = event.target as HTMLInputElement;
       const file: File | null = (target.files as FileList)[0] || null;
     
       if (file && file.size > 3148576) {
         Swal.fire({
           title: 'File size exceeds 3MB. Please upload a smaller file.',
           text: 'Invalid File size',
           icon: 'warning'
         });
         target.value = '';
         this.ExcelFileData = null;
         
         return;
       }
     
       const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
       if (file && !fileNameRegex.test(file.name)) {
         const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
         const modifiedFile = new File([file], validFileName, { type: file.type });
         const dataTransfer = new DataTransfer();
         dataTransfer.items.add(modifiedFile);
         target.files = dataTransfer.files;
     
         this.ExcelFileData = modifiedFile;
         this.ConsentLetterFileName = validFileName;
     
         reader.readAsDataURL(modifiedFile);
         reader.onload = () => {
           const ssss = reader.result as string;
           const ssssArray = ssss.split(',');
           this.ConsentLetterData = ssssArray[1];
         };
       } else {
         this.ExcelFileData = file;
         this.ConsentLetterFileName = file?.name || '';
         if (file) {
           reader.readAsDataURL(file);
           reader.onload = () => {
             const ssss = reader.result as string;
             const ssssArray = ssss.split(',');
             this.ConsentLetterData = ssssArray[1];
           };
         }
       }
     
       // Patch form control to trigger validation update
     }
     
  
}
