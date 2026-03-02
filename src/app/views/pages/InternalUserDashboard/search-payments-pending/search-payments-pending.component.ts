import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import Swal from 'sweetalert2';
import { LoginSessionService } from 'src/app/_services/login-session.service';

import { ColumnMode } from '@swimlane/ngx-datatable';

import { MatTableDataSource } from '@angular/material/table';
import { NgSelectComponent } from '@ng-select/ng-select';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-search-payments-pending',
  templateUrl: './search-payments-pending.component.html',
  styleUrls: ['./search-payments-pending.component.scss']
})
export class SearchPaymentsPendingComponent implements OnInit {
  ResponseUrl: any;

  @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;
  @ViewChild('ngSelectComponentStream') ngSelectComponentStream: NgSelectComponent;
  @ViewChild('verticalCenteredModal') verticalCenteredModal: TemplateRef<any>;
  @ViewChild('viewDescModal') viewDescModal: TemplateRef<any>;
  @ViewChild('viewDescModal2') viewDescModal2: TemplateRef<any>;
  @ViewChild('viewDescModal5') viewDescModal5: TemplateRef<any>;
  @ViewChild('PaymentReceiptUploadModal') PaymentReceiptUploadModal: TemplateRef<any>;
  dataSource: MatTableDataSource<any>;
  TypeId: any = 'CIF';

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
  BookingStatusData: any[] = [];
  ResultData: any[] = [];
  currentPage = 1;
  itemsPerPage = 5; //
  tmpsBookingStatusData: any[] = [];
  tmpsResultData: any[] = [];
  PaymentReceipt: any;
  InstrumentId: any;
  UserRole: any;
  UserId: any;
  uploadEnabled: boolean;
  Remarks: any;
  ServerUrl: any;
  MobileNo: any;
  supervisorName: any;
  departmentName: any;
  candidateName: any;
  paymentData: any;
  id: any; status: any; type: any; transactionNo: any; hashedValue: any; course: any; keyNote: any;

  constructor(
    private CIFwebService: LpuCIFWebService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private AuthSession: LoginSessionService,
    private route: ActivatedRoute,
    private cookieService: CookieService) { }
  user_Email: any;
  sessionData: any[] = [];
  getSessionDetails() {
    this.sessionData = this.AuthSession.getSession();
    for (const session of this.sessionData) {
      this.user_Email = session[0]['userEmail'];//'anju19kasp@gmail.com';//session[0]['userEmail']
    }
  }



// Logic for Payment Upload receipt modal added on 28-Feb-26


  openReceiptUploadModal(a: any) {
    this.BookingCase = a;
    this.LoadForm();
    this.modalService.open(this.PaymentReceiptUploadModal, { size: 'lg', centered: true }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch(() => { });

  }

  validationForm1: FormGroup; isForm1Submitted: boolean = false; ITitle: string = ''; IStatus: string = ''; IDescription: string = '';
  fileNamesX:any;   ReceiptRemarks : any;


  get form1() {
    return this.validationForm1.controls;
  }
  LoadForm(): void {
    this.validationForm1 = this.formBuilder.group({
      ReceiptRemarks: ['', Validators.required],
      file: [null, Validators.required],
    });
  }


   FileDataX: string; fileDataX: any; fileStatus: any; fileName: any;
    fileChosen: { [key: number]: boolean } = {};
    onFileXSelected(event: any, id: number): void {
      this.fileChosen[id] = event.target.files.length > 0;
      const reader = new FileReader();
      const target = event.target as HTMLInputElement;
      const file: File | null = (target.files as FileList)[0] || null;
  
      if (file && file.size > 10148576) {
        Swal.fire({
          title: 'File size exceeds 10 MB. Please upload a smaller file.',
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
  

  UpdateFileDocument(Id: any) {
    this.loadingIndicator=true;
    const startTime = new Date().getTime();


    if (this.fileChosen[Id]) {
      const formData = new FormData();
      formData.append('BookingId', Id);
      formData.append('ReceiptRemarks', this.ReceiptRemarks);
      formData.append('PaymentReceiptUrl', this.fileName);
      formData.append('PaymentReceiptData', this.FileDataX);
      formData.append('UserId', this.UserId);

      console.log("Uploading Payment Receipt with data:");
      formData.forEach((value, key) => console.log(`${key}: ${value}`));
      this.CIFwebService.UploadPaymentReceipt(formData).subscribe({
        next: (data: any) => {
          const result = data.item1[0]['msg'];
          if (result === 'success') {
            Swal.fire({
              title: 'Upload Receipt',
              text: 'Receipt Saved successfully!',
              icon: 'success',
              showConfirmButton: true,
            })
              .then(() => {
                window.location.reload();
              });
          } else if (result === 'Failed') {
            Swal.fire({
              title: 'Error to Upload',
              text: result,
              icon: 'error',
              timer: 2000,
              showConfirmButton: false,
            });
          }
          const elapsed = new Date().getTime() - startTime;
          const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s
  
          setTimeout(() => {
            this.loadingIndicator = false;
          }, remainingDelay);
        },
        error: (error: any) => {
          Swal.fire({
            title: 'Error',
            text: 'Internal Server error',
            icon: 'error',
            showConfirmButton: false,
          });
        },
        complete: () => {

        },
      });

        // this.loadingIndicator = false;
    }
  }
















  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const queryParamLength = params.keys.length;
      if (queryParamLength > 0) {
        this.getParams();
      }
    });
    this.ServerUrl ='https://files.lpu.in/umsweb/CIFDocuments/';// 'http://172.19.2.52/umsweb/webftp/MOUDocuments/';
    this.ResponseUrl = window.location.href;// + this.location.path() ;//"https://devums.lpu.in/app/cif/";
    if (this.ResponseUrl.startsWith('https://devums.lpu.in/app/cif/')) {
      this.ResponseUrl = "https://www.lpu.in/cif/";
    } 

    const baseUrl = `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}`;
    
     // Add your desired endpoint
    this.ResponseUrl = `${baseUrl}/SearchPendingPayments`;

    const GetCookieData = this.cookieService.get('InternalUserAuthData');
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserRole = retrievedCookies.userRole?.length > 0 ? retrievedCookies.userRole : 'Internal User';
    this.UserId = retrievedCookies.Id;
    this.user_Email = retrievedCookies.EmailId;
    this.MobileNo = retrievedCookies.MobileNo;
    this.supervisorName = retrievedCookies.SupervisorName;
    this.departmentName = retrievedCookies.DepartmentName;
    this.candidateName = retrievedCookies.CandidateName;


    this.UserRole = retrievedCookies.UserRole;
    this.user_Email= this.UserId = retrievedCookies.EmailId;// this.UserId = 'anju19kasp@gmail.com';// this.UserId = retrievedCookies.EmailId;
    this.getBookingDetails()
  }

  searchQuery: string = ''; // Property to store the search query

  search() {
    const query = this.searchQuery.toLowerCase();
    this.tmpsBookingStatusData = this.BookingStatusData.filter(item => {
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      );
    });
  }


  get filteredBookingStatusData(): any[] {
    // If search query is empty, return all data
    if (!this.searchQuery.trim()) {
      return this.BookingStatusData;
    }
    const searchTerm = this.searchQuery.toLowerCase();
    return this.BookingStatusData.filter((booking: { instrumentName: string; analysisType: string; }) =>
      booking.instrumentName.toLowerCase().includes(searchTerm) || booking.analysisType.toLowerCase().includes(searchTerm)
    );
  }
  getBookingDetails() {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetUserPaymentStatusDetails(this.UserId).subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.BookingStatusData = response.item1;
          this.dataSource = response.item1;
          this.tmpsBookingStatusData = response.item1.filter((item: { paymentStatus: any }) =>
            item.paymentStatus == null ||
            item.paymentStatus?.toLowerCase().includes('failure')
          );
          // this.BookingStatusData = this.tmpsBookingStatusData = response.item1;//.filter((item: { paymentStatus: any }) => item.paymentStatus == null);
          if (this.tmpsBookingStatusData.length > 0) {
            this.headHtmlData = this.tmpsBookingStatusData[0];
            this.columns = Object.keys(this.tmpsBookingStatusData[0]);
            this.columns = this.columns.filter((item: any) => item !== 'ResultFile' && item !== 'userId' && item !== 'id' && item !== 'analysisId');
            this.columns.push()            
          }
        }
        else {
          this.BookingStatusData = [];
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

  getTotalPages() {
    return Math.ceil(this.tmpsBookingStatusData.length / this.itemsPerPage);
  }

  getCurrentPageData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.tmpsBookingStatusData.slice(startIndex, endIndex);
  }

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
  exportToExcel(): void {
    const fileName = 'Booking_Details_report.xlsx';
    const exportedData = this.BookingStatusData.map(item => ({
      BookingId: item.bookingId,
      InstrumentName: item.instrumentName,     
      Samples: item.noOfSamples,
      RequestDate: item.bookingRequestDate ,

    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);

    const wscols = [
      { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 200 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }, { wpx: 180 }
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


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  paymentReceiptScreen(data:any)
  {
    this.PaymentReceipt=data;
    this.modalService.open(this.viewDescModal2, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch(() => { });
  }
   printReceipt(): void {
    const modalContent = document.getElementById("ReceiptData");  // Get the modal content by its ID
  
    if (modalContent) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
  
      const iframeDoc = iframe.contentWindow?.document;
  
      if (iframeDoc) {
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
        iframeDoc.write('</head><body >');
        
        const clonedContent = modalContent.cloneNode(true) as HTMLElement;
        const printButton = clonedContent.querySelector("button"); 
        if (printButton) {
          printButton.style.display = "none"; 
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
      } else {
        console.error('Failed to open iframe document');
      }
    } else {
      console.error('Modal content not found');
    }
  }
  
  getParams(): void {
    // const params = this.route.snapshot.params;
    this.route.queryParamMap.subscribe(params => {
      this.id = params.get('id');
      this.status = params.get('status');
      this.type = params.get('type');
      this.transactionNo = params.get('transactionNo');
      this.hashedValue = params.get('hashedValue');
      this.course = params.get('Course');
      this.keyNote = params.get('KeyNote');
      const formData = new FormData();
      formData.append('Id', this.id);
      formData.append('Status', this.status);
      formData.append('Type', this.type);
      formData.append('TransactionNo', this.transactionNo);
      formData.append('Course', this.course);
      formData.append('KeyNote', this.keyNote);
      formData.append('HashedValue', this.hashedValue);

      var result;
      this.CIFwebService.GetDecodePaymentStatusDetails(formData).subscribe({
        next: data => {
          result = data;
          // console.log("return encoded "+JSON.stringify(result));
          if (result?.status == 'failure') {
            Swal.fire({
              title: 'Payment Failed ',
              // text: 'Payment URL not found!',
              icon: 'error',
            });
          }
          else if (result?.status == 'success') {
            Swal.fire({
              title: 'Payment Made Successfully',
              // text: 'Payment URL not found!',
              icon: 'success',
            });
          }
        },
      });
    });
  }
//PaymentReceiptUpload
  openPaymentModal(a: any) {
    this.BookingCase = a;
    this.modalService.open(this.viewDescModal5, { size: 'sm' }).result.then(
      (result: string) => {
        console.log("Modal closed" + result);
      }
    ).catch(() => { });

  }

  VerifyData(BookingCase: any) {
    // console.log(JSON.stringify(BookingCase))
    const formData = new FormData();
    formData.append('BookingId', BookingCase.bookingId);
    formData.append('InstrumentId', BookingCase.instrumentId);
    formData.append('CandidateName', this.candidateName);
    formData.append('Amount', BookingCase.amount);
    formData.append('Type', this.TypeId);
    formData.append('UserEmailId', this.user_Email);
    formData.append('MobileNo', this.MobileNo);
    formData.append('FacultyCode', this.user_Email);
    formData.append('ResponseUrl', this.ResponseUrl);
    forkJoin({
      payment: this.CIFwebService.MakePaymentforTest(formData),
    }).subscribe({
      next: (results: any) => {
        this.paymentData = results;
        if (results) {
          const paymentUrlData = results.payment.item1[0].url;
          if (paymentUrlData && paymentUrlData.length > 0) {
            window.location.href = paymentUrlData;
          } else {
            Swal.fire({
              title: 'Error Occurred, Try Again Later',
              text: 'Payment URL not found!',
              icon: 'error',
            });
          }
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No data received from the API!',
            icon: 'error',
          });
        }
      },
      error: (error: any) => {
        console.error('Error during API call: ', error);
        Swal.fire({
          title: 'Error',
          text: 'Payment Gateway Failed!',
          icon: 'error',
        });
      },
    });
  }



  openQRCodeScreen(url: string): Promise<any> {
    return Swal.fire({
      title: 'Scan the QR Code to Proceed with Payment',
      html: `<qrcode [qrdata]="this.qrCodeUrl" [width]="256" [errorCorrectionLevel]="'M'"></qrcode>`,
      showCancelButton: true,
      confirmButtonText: 'Proceed to Payment',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      // Check if the user clicked the confirm button
      if (result.isConfirmed) {
        // Open the URL in a new tab
        window.open(url);
      }
    });}

}
