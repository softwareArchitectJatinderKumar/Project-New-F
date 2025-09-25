import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-CifRegisterPage',
  templateUrl: './CifRegisterPage.component.html',
  styleUrls: ['./CifRegisterPage.component.scss'],
})
export class CifRegisterPageComponent implements OnInit {
  cifUserForm!: FormGroup;
  isForm1Submitted: boolean = false;
  userRoles: string[] = ['Student', 'Researcher', 'Faculty', 'Industry'];
  loadingIndicator = false;
  constructor(
    private CIFwebService: LpuCIFWebService,
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.LoadForm();

    const elapsed = new Date().getTime() - startTime;
    const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

    setTimeout(() => {
      this.loadingIndicator = false;
    }, remainingDelay);



      this.getAllInstruments();
      this.chunkedEvents = this.chunkArray(this.events, 3);
  }

  LoadForm(): void {
    this.cifUserForm = this.fb.group({
      EmailId: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      CandidateName: ['', [Validators.required, Validators.maxLength(30)]],
      Supervisorname: ['', [Validators.required, Validators.maxLength(30)]],
      MobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      InstituteName: ['', [Validators.required, Validators.maxLength(30)]],
      DepartmentName: ['', [Validators.required, Validators.maxLength(30)]],
      IdProofType: ['', Validators.required],
      IdProofNumber: ['', [Validators.required, Validators.maxLength(15)]],
      Address: ['', [Validators.required, Validators.maxLength(150)]],
      Password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
      ConfirmPassword: ['', [Validators.required, Validators.maxLength(15)]],
      UserRole: ['', Validators.required],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('Password')?.value;
    const confirmPassword = formGroup.get('ConfirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      formGroup.get('ConfirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  get form1() {
    return this.cifUserForm.controls;
  }
OnReset(): void {
  this.cifUserForm.reset({
    EmailId: '',
    CandidateName: '',
    Supervisorname: '',
    MobileNumber: '',
    InstituteName: '',
    DepartmentName: '',
    IdProofType: '',
    IdProofNumber: '',
    UserRole: '',    
    Address: '',
    Password: '',
    ConfirmPassword: ''
  });
  this.isForm1Submitted = false;
}

  Onsubmit(): void {

    this.isForm1Submitted = true;

    if (this.cifUserForm.invalid) {
      this.cifUserForm.markAllAsTouched();
      return;  // stop submit if invalid
    }
    if (this.cifUserForm.valid) {
       this.loadingIndicator = true;
    const startTime = new Date().getTime();
      const formValues = this.cifUserForm.value;
      const formData = new FormData();
      formData.append("UserEmail", formValues.EmailId);
      formData.append("CandidateName", formValues.CandidateName);
      formData.append("SupervisorName", formValues.Supervisorname);
      formData.append("MobileNumber", formValues.MobileNumber);
      formData.append("SchoolName", formValues.InstituteName);
      formData.append("DepartmentName", formValues.DepartmentName);
      formData.append("IdProofType", formValues.IdProofType);
      formData.append("IdProofNumber", formValues.IdProofNumber);
      formData.append("UserType", formValues.UserRole);
      formData.append("Address", formValues.Address);
      formData.append("PasswordText", formValues.Password);

      this.CIFwebService.NewUserRecord(formData).subscribe({
        next: (data) => {
          let result = data.item1[0]['msg'];
          let errorCode = data.item1[0]['returnId'];

          if (result === 'Success') {
            swal.fire({
              title: 'User Login Created Successfully',
              text: result,
              icon: 'success',
            }).then(() => this.router.navigate(['/Login']));
          } else if (errorCode === -1) {
            swal.fire({ title: 'User Already Exists', icon: 'error' })
              .then(() => window.location.reload());
          } else {
            swal.fire({ title: 'Some Technical Issue', text: result, icon: 'error' })
              .then(() => window.location.reload());
          }
        },
        error: () => {
          swal.fire({
            title: 'Error Occurred',
            text: 'Unable to complete the request. Please try again later.',
            icon: 'error',
          });
        }
      });
          
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
    } else {
      this.cifUserForm.markAllAsTouched();
    }
  }

 

    
   @ViewChild('table') table: ElementRef;
  
    @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;
      // Method to scroll to the Facilities section
   
     
       
      gotoFacilities() {
        this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    
      ResultData: any[] = []; currentPage = 1; itemsPerPage = 10; InstrumentsDataData: any[] = [];
      tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
      InstrumentId: any; instrumentName: any = ''; UserRole: any; UserId: any; uploadEnabled: boolean; Remarks: any; dataSource: any;
      Description: any; ImageUrl: any;
     columns: any;  headHtmlData: any[] = []; p: any = 1; perPage: any = 5;
      loadingStates: boolean[] = [];  ServerUrl: any;   isLoading: boolean = true;  loadedCount: number = 0;
   
     
   
      openSampleInstructions() {
        swal.fire({
          title: 'Send Samples at Following Address :',
          html: `
               <address>
                <div class="contact-text">
               Central Instrumentation Facility (CIF) <br/>
              Lovely Professional University <br/>
              Block-38, Room No.106 <br/>
              Jalandhar - Delhi G.T. Road, <br/>
              Phagwara, Punjab (India) - 144411 <br/>
              Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
              Email : cif@lpu.co.in<br>
              </div>
               </address>`,
          icon: 'info'
        });
     
       
     }
      goto(val: any): void {
        this.router.navigateByUrl(val);
      }
      VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
        this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
      }
      onImageLoad(index: number): void {
        this.loadingStates[index] = false;  
      }
    
      
    
      onImageError(event: any, index: number): void {
        event.target.src = '/image.jpg'; 
        this.loadingStates[index] = false;
      }
    
      getAllInstruments(): void {
        this.loadingIndicator=true;
        const startTime = new Date().getTime();
        this.CIFwebService.GetAllInstrumentsData().subscribe({
          next: response => {
            if (response.item1 && response.item1.length > 0) {
              this.InstrumentsDataData = response.item1;
              this.tmpsInstrumentsDataData = response.item1.slice(0, 8);
              this.loadingStates = Array(this.tmpsInstrumentsDataData.length).fill(true); // Initialize loading states
            } else {
              this.InstrumentsDataData = [];
            }
            const elapsed = new Date().getTime() - startTime;
            const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 5s
    
            setTimeout(() => {
              this.loadingIndicator = false;
            }, remainingDelay);
          },
          error: err => {
            this.loadingIndicator = false;
            console.error(err);
          }
        });
      }
     
      gotoHome(): void {
        this.router.navigateByUrl('Home');
      }
    
    
    
      // added on 21-aug-25
      chunkedEvents: any[][] = [];
    
      chunkArray(arr: any[], size: number): any[][] {
        return arr.reduce((acc, _, i) =>
          (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
      }
      events = [
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp',
          title: 'ANRF Sponsored Summer Training Programme',
          date: '(2 June - 11 July 2025)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-10.jpg',
          title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop',
          date: '(24 – 26 April 2025)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-9.jpg',
          title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging',
          date: '(27 - 29 March 2025)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-7.jpg',
          title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications',
          date: '(19 - 21 September, 2024)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-8.jpg',
          title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation',
          date: '(09 – 13 December, 2024)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-1.jpg',
          title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer',
          date: '(26 - 27 April 2024)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-2.jpg',
          title: 'Summer Training Programme',
          date: '(3 June - 13 July 2024)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/event-3.jpg',
          title: 'Workshop on Field Emission Scanning Electron Microscope',
          date: '(29 - 30 March 2024)'
        },
        {
          img: 'https://www.lpu.in/lpu-assets/images/cif/summer-training-programme-2025.webp',
          title: 'ANRF Sponsored Summer Training Programme',
          date: '(2 June - 11 July 2025)'
        },
      ];
    
      get eventGroups() {
        const groups = [];
        for (let i = 0; i < this.events.length; i += 3) {
          groups.push(this.events.slice(i, i + 3));
        }
        return groups;
      }
    
}

// import { FormBuilder, FormGroup } from '@angular/forms';
// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';


// import { Validators } from '@angular/forms';
// import swal from 'sweetalert2';

// @Component({
//   selector: 'app-CifRegisterPage',
//   templateUrl: './CifRegisterPage.component.html',
//   styleUrls: ['./CifRegisterPage.component.scss'],
// })
// export class CifRegisterPageComponent implements OnInit {
//   emailId: any = '';  candidateName: any; supervisorName: any;mobileNumber: any;     instituteName: any;
//   departmentName: any;     idProofType: any ='' ;idProofNumber: any; address: any;   password: any;  confirmPassword: any; 
//   userRole: any ='';
//   cifUserForm!: FormGroup;
//   isForm1Submitted: boolean = false;
//   IdProofFileName: string | null = null;
//   IdProofFile: string | null = null;
//   sessionData: any[] = [];

//   constructor(
//     private CIFwebService: LpuCIFWebService,
//     private fb: FormBuilder,
//     private router: Router,

//   ) {}

//   ngOnInit(): void {
//     this.LoadForm();
//   }

//   LoadForm(): void {
//     this.cifUserForm = this.fb.group({
//       EmailId: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
//       CandidateName: ['', [Validators.required, Validators.maxLength(30)]],
//       Supervisorname: ['', [Validators.required, Validators.maxLength(30)]],
//       MobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
//       InstituteName: ['', [Validators.required, Validators.maxLength(30)]],
//       DepartmentName: ['', [Validators.required, Validators.maxLength(30)]],
//       IdProofType: ['', Validators.required],
//       IdProofNumber: ['', [Validators.required, Validators.maxLength(15)]],
//       Address: ['', [Validators.required, Validators.maxLength(150)]],
//       Password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
//       ConfirmPassword: ['', [Validators.required, Validators.maxLength(15)]],
//       UserRole: ['', Validators.required]
//     }, {
//       validators: this.passwordMatchValidator // Attach custom validator here
//     });
//   }
//   passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
//     const password = formGroup.get('Password')?.value;
//     const confirmPassword = formGroup.get('ConfirmPassword')?.value;

//     if (password !== confirmPassword) {
//       formGroup.get('ConfirmPassword')?.setErrors({ mismatch: true });
//       return { mismatch: true };
//     }
    
//     formGroup.get('ConfirmPassword')?.setErrors(null);
//     return null;
//   }

//   get form1() {
//     return this.cifUserForm.controls;
//   }

//   Onsubmit(): void {
//     this.isForm1Submitted = true;
//     if (this.cifUserForm.valid) {
//       const formData = new FormData();
//       formData.append("UserEmail", this.emailId);
//       formData.append("CandidateName", this.candidateName);
//       formData.append("SupervisorName", this.supervisorName);
//       formData.append("MobileNumber", this.mobileNumber);
//       formData.append("SchoolName", this.instituteName);
//       formData.append("DepartmentName", this.departmentName);
//       formData.append("IdProofType", this.idProofType);
//       formData.append("IdProofNumber", this.idProofNumber);
//       formData.append("UserType", this.userRole);
//       formData.append("Address", this.address);
//       formData.append("PasswordText", this.password);
    

  
//     this.CIFwebService.NewUserRecord(formData).subscribe({
//       next: (data) => {
//         let result = data.item1[0]['msg'];
//         let errorCode = data.item1[0]['returnId'];

//         if (result === 'Success') {
//           swal.fire({
//             title: 'User Login Created Successfully',
//             text: data.item1[0]['msg'],
//             icon: 'success',
//           }).then(() => {
//             this.router.navigate(['/Login']);
//           });
//         } else if (errorCode === -1) {
//           swal.fire({
//             title: 'User Already Exists',
//             icon: 'error',
//           }).then(() => {
//             window.location.reload();
//           });
//         } else {
//           swal.fire({
//             title: 'Some Technical Issue',
//             text: result,
//             icon: 'error',
//           }).then(() => {
//             window.location.reload();
//           });
//         }
//       },
//       error: () => {
//         swal.fire({
//           title: 'Error Occurred',
//           text: 'Unable to complete the request. Please try again later.',
//           icon: 'error',
//         });
//       }
//     });

//     } else {
//       this.cifUserForm.markAllAsTouched();
//     }
//   }

//   OnReset(): void {
//     this.cifUserForm.reset();
//     this.isForm1Submitted = false;
//   }
// }
