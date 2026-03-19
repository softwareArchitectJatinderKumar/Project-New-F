import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbDateStruct, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { DataTable } from "simple-datatables";
import { AuthService } from 'src/app/_services/auth.service';
import { StorageService } from 'src/app/_services/storage.service';
import * as XLSX from 'xlsx';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import swal from 'sweetalert2';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import Swal from 'sweetalert2';
import { toInteger } from '@ng-bootstrap/ng-bootstrap/util/util';
import { LoginSessionService } from 'src/app/_services/login-session.service';
import { FormsModule } from '@angular/forms';

import { ColumnMode } from '@swimlane/ngx-datatable';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DOCUMENT } from '@angular/common';

import { MouDocumentsService } from 'src/app/_services/mou-documents.service';

@Component({
  selector: 'app-AdminActionInstruments',
  templateUrl: './AdminActionInstruments.component.html',
  styleUrls: ['./AdminActionInstruments.component.scss']
})
export class AdminActionInstrumentsComponent implements OnInit {


// Download File approach Added on 23-feb-26


 onDownloadFile(remoteUrl: string): void {
    swal.fire({ title: 'Downloading...', didOpen: () => { swal.showLoading(null); }});

    this.CIFwebService.downloadFile(remoteUrl).subscribe({
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



  // logic ended 

  OpenReplaceModal(a: any) {
    this.BookingCase = a;
    // console.log(JSON.stringify(a))
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch((res: any) => { });

  }


  file: any; // The actual file object
  uploadedDataRaw: any[] = []; // Raw data from Excel, used for sending to backend
  uploadedDataForDisplay: any[] = []; // Formatted data for UI display
  validationErrors: string[] = [];
  errorCells: { rowIndex: number, cellIndex: number }[] = [];



  // Excel Upload Logic
  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
      if (this.file) {
        this.readExcelFile(this.file);
      }
    }
  }
  confirmUpload() {
    if (this.hasErrors()) {
      Swal.fire('Validation Error', 'Please correct the errors in the uploaded data before confirming.', 'error');
      return;
    }
    // this.VerifyData();
  }
  readExcelFile(file: any) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      // when using readAsArrayBuffer, pass type: 'array'
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Raw data for backend (dates as they are in Excel, will be formatted before sending)
      this.uploadedDataRaw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Process data for display (format dates for UI)
      this.processUploadedDataForDisplay(this.uploadedDataRaw);
    };
    reader.readAsArrayBuffer(file);
  }

  processUploadedDataForDisplay(rawData: any[]) {
    if (!rawData || rawData.length === 0) {
      this.uploadedDataForDisplay = [];
      return;
    }

    // Copy headers (first row)
    this.uploadedDataForDisplay = [rawData[0]];

    // Process rows, starting from the second row (index 1)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];   // <- was a typo ` [.rawData[i]]`
      // ensure row is an array (sheet_to_json with header:1 returns arrays)
      this.uploadedDataForDisplay.push(row);
    }

    // reset validation state
    this.validationErrors = [];
    this.errorCells = [];
  }

  hasErrors(): boolean {
    return this.validationErrors.some(error => error.length > 0);
  }
  isError(rowIndex: number, cellIndex: number): boolean {
    return this.errorCells.some(errorCell => errorCell.rowIndex === rowIndex && errorCell.cellIndex === cellIndex);
  }


UploadNewExcelSampleSheet:any;
  

  onFileSelected(event: any): void {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;

    if (!file) {
      return;
    }

    if (file && file.size > 1148576) {
      swal.fire({
        title: 'File size exceeds 1MB. Please upload a smaller file.',
        text: 'Invalid File size',
        icon: 'warning'
      });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (file && !fileNameRegex.test(file.name)) {
      // sanitize filename
      const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const modifiedFile = new File([file], validFileName, { type: file.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(modifiedFile);
      target.files = dataTransfer.files;
      this.fileData = modifiedFile;
      this.fileStatus = true;

      // read base64 for upload
      reader.readAsDataURL(modifiedFile);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileData =this.UploadNewExcelSampleSheet= ssssArray[1];    // base64 payload
        this.fileName = validFileName;
        this.uploadEnabled = true;
        // parse and preview Excel
        this.readExcelFile(modifiedFile);
      };
      return;
    }

    // normal case
    this.fileData = this.UploadNewExcelSampleSheet= file;
    this.fileStatus = true;

    // read base64 for upload and parse for preview
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const ssss = reader.result as string;
      const ssssArray = ssss.split(',');
      this.FileData = this.UploadNewExcelSampleSheet= ssssArray[1]; // base64 payload
      this.fileName = file.name;
      this.uploadEnabled = true;
      // parse and preview Excel (pass original File object)
      this.readExcelFile(file);
    };
  }




  VerifyData(InstrumentData: any) {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();//fileNamesX

    if (!this.fileDataX || !this.fileNamesX) {
      swal.fire({ title: 'No file selected', icon: 'warning' });
      this.loadingIndicator = false;
      return;
    }


    
    // create a unique filename to avoid overwriting existing file on server
    const extIndex = this.fileName.lastIndexOf('.');
    const ext = extIndex >= 0 ? this.fileName.substring(extIndex) : '.xlsx';
    const newFileName = `${InstrumentData.instrumentId}_${Date.now()}${ext}`;
    // alert('old filesss  ' + this.fileName + '  New File  names ' + newFileName)
    const formData = new FormData();
    formData.append('InstrumentId', InstrumentData.instrumentId);
    // formData.append('FilePath', newFileName);   // send unique filename
    // formData.append('File', this.FileDataX);     // base64 payload expected by API

    formData.append('FilePath', this.fileName);
    formData.append('File', this.FileDataX);
    this.CIFwebService.ReplaceExcelSheetSample(formData).subscribe({
      next: (data: any) => {
        const result = data.item1 && data.item1.length > 0 ? data.item1[0].msg : null;

        if (result && result.toLowerCase() === 'success') {
          swal.fire({
            title: 'Uploaded Successfully!',
            icon: 'success'
          }).then(() => {
            window.location.reload();
          });
        } else {
          swal.fire({
            title: 'Error Occurred, Try Again Later',
            text: 'API returned: ' + result,
            icon: 'error'
          });
        }

        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0);
        setTimeout(() => (this.loadingIndicator = false), remainingDelay);
      },

      error: (err: any) => {
        swal.fire({ title: 'Error', text: 'Failed to Upload.', icon: 'error' });
        this.loadingIndicator = false;
      }
    });
  }
  @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
  @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
  @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
  
  @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
  dataSource: MatTableDataSource<any>;

  FileData: any; array: any[] = []; fileData: File; fileStatus: boolean = false;
  replacing: boolean = false;
  fileName: string;
  selectedId: number;
  ColumnMode = ColumnMode;
  columns: any;
  loadingIndicator = false;
  headHtmlData: any[] = [];
  p: any = 1;
  perPage: any = 5;
  @ViewChild('table') table: ElementRef;
  displayedColumns: string[] = [
    'instrumentName', 'analysisType', 'analysisCharges', 'noOfSamples',
    'totalCharges', 'remarks', 'bookingRequestDate', //'bookingrequestDate'
  ];
  BookingCase: any;
  InstrumentData: any[] = [];
  currentPage = 1;
  itemsPerPage = 10; // 
  
  // Items per page dropdown options
  itemsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: 'All', value: 'all' }
  ];
  
  // Track if 'all' is selected
  isAllSelected = false;
  
  tmpsInstrumentData: any[] = [];
  InstrumentId: any;
  UserRole: any;
  UserId: any;
  uploadEnabled: boolean;
  supervisorName: any;
  departmentName: any;
  candidateName: any;

  serverUrl: any; // added on 22-*Nov-25
  constructor(
    private CIFwebService: LpuCIFWebService, private mouDocumentsService: MouDocumentsService,
    private storageService: StorageService,
    private authService: AuthService,
    private fb: FormBuilder, private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) document: Document,
    private modalService: NgbModal,
    private AuthSession: LoginSessionService,
    private router: Router, private route: ActivatedRoute,
    private cookieService: CookieService) { }
  user_Email: any;
  sessionData: any[] = [];
  getSessionDetails() {

    this.sessionData = this.AuthSession.getSession();
    for (const session of this.sessionData) {
      this.user_Email = session[0]['userEmail']
    }
  }
  ngOnInit(): void {
    this.getSessionDetails();
    // this.serverUrl = 'http://172.19.2.52/umsweb/CIFDocuments/CIFSampleExcelSheets/'; //172.19.2.52/umsweb/webftp/CIFDocuments/CIFSampleExcelSheets/  ftp://umsftp@172.19.2.52/umsweb/webftp/CIFDocuments/CIFSampleExcelSheets/

    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/CIFSampleExcelSheets/';
    const GetCookieData = this.cookieService.get('authData');
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
    this.user_Email = retrievedCookies.EmailId;
    this.supervisorName = retrievedCookies.SupervisorName;
    this.departmentName = retrievedCookies.DepartmentName;
    this.candidateName = retrievedCookies.CandidateName;

    this.GetAllInstruments()
  }

  searchQuery: string = ''; // Property to store the search query

  get filteredInstrumentData(): any[] {
    // If search query is empty, return all data
    if (!this.searchQuery.trim()) {
      return this.InstrumentData;
    }

    // Otherwise, filter data based on search query
    const searchTerm = this.searchQuery.toLowerCase();
    return this.InstrumentData.filter((booking: { instrumentName: string; analysisType: string; }) =>
      booking.instrumentName.toLowerCase().includes(searchTerm) || booking.analysisType.toLowerCase().includes(searchTerm)

    );
  }
  GetAllInstruments() {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllInstruments().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          const mapped = (response.item1 || []).map((it: any) => {
            const row = { ...it };
            // row.instrumentExcelUrl = row.excelSheetUrl;
            if (!row.instrumentExcelUrl || row.instrumentExcelUrl.length === 0) {
              // row.instrumentExcelUrl = this.serverUrl + '/' + row.instrumentId + '.xlsx';
              if (row.instrumentExcelName && row.instrumentExcelName.length > 0) {
                row.instrumentExcelUrl = 'assets/CifDocumentsTemplates/' + row.instrumentExcelName;
              } else if (row.instrumentId) {
                row.instrumentExcelUrl = 'assets/CifDocumentsTemplates/' + row.instrumentId + '.xlsx';
              } else {
               row.instrumentExcelUrl = row.excelSheetUrl;
              }
            }
            return row;
          });

          this.InstrumentData = mapped;
          this.dataSource = mapped;
          this.tmpsInstrumentData = mapped;

          this.headHtmlData = this.tmpsInstrumentData[0];
          this.columns = Object.keys(this.tmpsInstrumentData[0]);

        }
        else {
          this.InstrumentData = [];
        }
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        console.log(err)
      }
    });
  }

  search() {
    const query = this.searchQuery.toLowerCase();
    this.tmpsInstrumentData = this.InstrumentData.filter(item => {
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );
    });
  }

  getTotalPages() {
    if (this.isAllSelected) {
      return 1;
    }
    return Math.ceil(this.tmpsInstrumentData.length / this.itemsPerPage);
  }

  // Function to get the current page of data
  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.tmpsInstrumentData.slice(startIndex, endIndex);
  }

  // Function to go to the next page
  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Handle items per page change
  onItemsPerPageChange(event: any): void {
    const value = event.target.value;
    if (value === 'all') {
      this.isAllSelected = true;
      this.itemsPerPage = this.tmpsInstrumentData.length;
    } else {
      this.isAllSelected = false;
      this.itemsPerPage = parseInt(value, 10);
    }
    this.currentPage = 1;
  }

  getTotalRecords(): number {
    return this.tmpsInstrumentData ? this.tmpsInstrumentData.length : 0;
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'exported_data.xlsx');
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  OpenModalWindow(a: any) {
    this.BookingCase = a;
    let InstrumentID = a['instrumentId'];
    const formData = new FormData();
    formData.append('Id', InstrumentID);
    swal.fire({
      title: 'Are you sure you want to Change State of Device ?',
      // text: 'Kindly confirm if the document is valid!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, accept current changes!',
      cancelButtonText: 'No, do not change it'
    }).then((result: any) => {
      if (result.value) {
        this.handleStatusChange(formData, 'Approve');
      } else {
        this.showCancelledSwal();
      }
    });
  }
  private handleStatusChange(formData: FormData, action: string) {
    this.CIFwebService.CIFUpdateStatusInstruments(formData).subscribe((data: any) => {
      // this.mouDocumentsService.ApproveMouActionTakenDocument(formData).subscribe((data: any) => {
      if (action === 'Approve' && data.responseData === 'Cancel') {
        swal.fire(
          'No Change!',
          ' ',
          'error'
        );
      } else {
        swal.fire(
          ' Status Changed Successfully !',
          '',
          'success'
        ).then(() => {
          window.location.reload();
        });
      }
    });
  }

  private showCancelledSwal() {
    swal.fire(
      'Cancelled',
      ' ',
      'error'
    );
  }

  async replace(targetUrl: string) {
    try {
      this.replacing = true;
      const suggestedName = (targetUrl || '').split('/').pop() || 'template.xlsx';

      // Assume the source is the file already stored in asset/DocumentTemplate folder
      const sourceUrl = '/asset/CifDocumentsTemplates/' + suggestedName;
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch source file from ' + sourceUrl);
      }
      const sourceArrayBuffer = await response.arrayBuffer();

      // Select the target file to replace using file picker
      if ((window as any).showOpenFilePicker) {
        try {
          const [fileHandle] = await (window as any).showOpenFilePicker({
            multiple: false,
            types: [{
              description: 'Excel Files',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          const uint8 = new Uint8Array(sourceArrayBuffer);
          await writable.write(uint8);
          await writable.close();
          Swal.fire({ title: 'Replaced', text: `File replaced successfully`, icon: 'success' });
          // reload to reflect changes
          window.location.reload();
        } catch (err) {
          // user cancelled or error
          console.error('Replace failed', err);
          Swal.fire({ title: 'Error', text: 'Unable to replace the file', icon: 'error' });
        }
      } else {
        // Fallback: trigger browser download with the source content
        const blob = new Blob([sourceArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        Swal.fire({ title: 'Download ready', text: `Please save the file as ${suggestedName} to replace the target in your project assets folder`, icon: 'info' });
      }
    } catch (err) {
      console.error('Replace error', err);
      Swal.fire({ title: 'Error', text: 'An error occurred while replacing the file', icon: 'error' });
    } finally {
      this.replacing = false;
    }
  }


  UploadDocument() {

  }





  @ViewChild('viewDescModal') viewDescModals: TemplateRef<any>;


  validationForm1: FormGroup;
  isForm1Submitted: boolean = false;
  ITitle: string = '';
  IStatus: string = '';
  IDescription: string = '';
  fileNames: any = '';

  get form1() {
    return this.validationForm1.controls;
  }

  AllInstrumentsDetails: any[] = []; TempAllInstrumentsDetails: any[] = [];
  headHtmlDatas: never[]; isInputDisabled: boolean = true; InstrumentIds: any; InstrumentTitles: any;
  fileNamesX: string; ColumnModes = ColumnMode; FileDataX: string; searchQueryx: any; StatusInstrument: any = false;
  fileDataX: File;

  ChangeStatus(event: any) {
    this.StatusInstrument = event.target.checked;
    // alert(this.StatusInstrument);
  }

  searchx() {
    const query = this.searchQueryx.toLowerCase();
    this.TempAllInstrumentsDetails = this.AllInstrumentsDetails.filter(item => {
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );
    });
  }

  onSelectFile(a: any) {
    let aa = a;
    window.open(aa.imageUrl, '_blank');
  }


  exportToExcels(): void {
    const fileName = 'Instruments_Document_report.xlsx';
    const exportedData = this.AllInstrumentsDetails.map(item => ({
      Id: item.instrumentId,
      Title: item.instrumentName,
      Description: item.description
    }));
    const header = [
      'Id',
      'Title',
      'Description',
    ];
    const ws_data = [header, ...exportedData.map(item => Object.values(item))];
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);
    for (let i = 1; i < ws_data.length; i++) { // Start from 1 to skip the header row
      const cellAddress = XLSX.utils.encode_cell({ r: i, c: 3 }); // Column 7 is DocumentUrl
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        cell.f = `HYPERLINK("${cell.v}", "Download Attachement")`;
      }
    }
    const wscols = [
      { wpx: 200 }, { wpx: 200 }, { wpx: 200 }
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
 



  fileChosen: { [key: number]: boolean } = {};
  onFileXSelected(event: any, id: number): void {
    this.fileChosen[id] = event.target.files.length > 0;
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0] || null;

    if (file && file.size > 10148576) {
      swal.fire({
        title: 'File size exceeds 1 MB. Please upload a smaller file.',
        text: 'Invalid File size',
        icon: 'warning'
      });
      target.value = '';
      return;
    }

    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (file && !fileNameRegex.test(file.name)) {
      const validFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      const modifiedFile = new File([file], validFileName, { type: file.type });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(modifiedFile);
      target.files = dataTransfer.files;

      this.fileDataX = modifiedFile;
      this.fileStatus = true;
this.readExcelFile(this.fileDataX);
      reader.readAsDataURL(modifiedFile);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileDataX = ssssArray[1];
        this.fileName = validFileName;
      };
      return;
    }

    this.fileDataX = file;
    this.fileStatus = true;

    if (file) {
      
      reader.readAsDataURL(file);
      reader.onload = () => {
        const ssss = reader.result as string;
        const ssssArray = ssss.split(',');
        this.FileDataX = ssssArray[1];
        this.fileName = file.name;
      };

      
    }
  }

 

}
