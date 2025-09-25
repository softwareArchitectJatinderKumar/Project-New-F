
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import swal from 'sweetalert2';

import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { AuthService } from 'src/app/_services/auth.service';
import { StorageService } from 'src/app/_services/storage.service';
import { LoginSessionService } from 'src/app/_services/login-session.service';

@Component({
  selector: 'app-CifLoginPage',
  templateUrl: './CifLoginPage.component.html',
  styleUrls: ['./CifLoginPage.component.scss']
})
export class CifLoginPageComponent implements OnInit {
  formdata!: FormGroup;
  submitted = false;
  showPassword = false;
  loginError: string | null = null;
  isLoginFailed = false;

  // User data after login
  UserData: any;
  Email: string = '';

  constructor(
    private fb: FormBuilder,
    private CIFwebService: LpuCIFWebService,
    private authService: AuthService,
    private storageService: StorageService,
    private AuthSession: LoginSessionService,
    private router: Router,
    private cookieService: CookieService
  ) { }

  ngOnInit(): void {
       this.cookieService.delete('InternalUserAuthData');
    this.AuthSession.clearSession();
    this.loadingIndicator = true;
    const startTime = new Date().getTime(); 
 
    this.loadForm();

    
    const elapsed = new Date().getTime() - startTime;
    const remainingDelay = Math.max(1500 - elapsed, 0); // wait at least 5s

    setTimeout(() => {
      this.loadingIndicator = false;
    }, remainingDelay);


      this.getAllInstruments();
      this.chunkedEvents = this.chunkArray(this.events, 3);
  }


  loadForm(): void {
    this.formdata = this.fb.group({
      Email: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      UserRoleS: ['', Validators.required]
    });
    this.submitted = false;
    this.loginError = null;
  }

  // Getters for form controls
  get email(): AbstractControl | null {
    return this.formdata.get('Email');
  }

  get passwordText(): AbstractControl | null {
    return this.formdata.get('password');
  }

  get userRole(): AbstractControl | null {
    return this.formdata.get('UserRoleS');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  checkUserType(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    if (!selectedValue) {
      console.warn('Please select a valid role.');
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      return;
    }

    const formValues = this.formdata.value;
    const uid = formValues.Email;
    const password = formValues.password;
    const userRoleX = parseInt(formValues.UserRoleS, 10);

    this.authoriseUser(uid, password, userRoleX);
  }


  authoriseUser(Id: string, Key: string, Role: any): void {
    const loginData = {
      Email: Id,           // Match C# property name
      PasswordText: Key,   // Can include #, @, etc.
      UserRole: Role
    };
    const formData = new FormData();
    formData.append('Email', Id);
    formData.append('PasswordText', Key);
    formData.append('UserRole', Role);

    this.CIFwebService.GetAuthoriseUserData(formData).subscribe({
      next: (response) => {
        if (response.item1 && response.item1.length > 0) {
          this.Email = response.item1[0].email;
          this.UserData = response.item1;
          this.createToken(this.Email, response);
          this.formdata.reset();
          this.submitted = false;
          this.loginError = null;
          this.isLoginFailed = false;
        } else {
          this.loginError = 'Invalid login details. Please try again.';
          this.isLoginFailed = true;
          swal.fire({
            title: 'Invalid Login Details',
            text: 'Check Details!',
            icon: 'warning'
          });
          this.formdata.reset();
          this.formdata.patchValue({ UserRoleS: '' });
          this.submitted = false;
        }
      },
      error: (err) => {
        console.error(err);
        this.loginError = 'An error occurred while processing your request.';
        this.isLoginFailed = true;

        if (err.status === 0) {
          swal.fire({
            title: 'Server Down',
            text: 'The server is currently unavailable. Please try again later.',
            icon: 'error'
          });
        } else {
          swal.fire({
            title: 'Error',
            text: this.loginError,
            icon: 'error'
          });
        }

        this.formdata.reset();
        this.formdata.patchValue({ UserRoleS: '' });
        this.submitted = false;
      }
    });
  }

  createToken(Id: string, response: any): void {
    this.authService.LoginJournalAccessTemp(Id).subscribe({
      next: (data) => {
        this.storageService.saveUser(data);
        this.setUserData(response);
      },
      error: () => {
        // Handle error if needed
      }
    });
  }

  setUserData(response: any): void {
    const user = response.item1[0];
    this.UserData = response.item1;
    const userCookiesData = {
      CandidateName: user.candidateName,
      UserId: user.emailId,
      Department: user.department,
      DepartmentName: user.departmentName,
      Designation: user.department,
      EmailId: user.emailId,
      MobileNo: user.mobileNumber,
      UserRole: user.userRole,
      SupervisorName: user.supervisorName,
      ProofNumber: btoa(user.idProofNumber),
      ProofName: user.idProofType,
      // PasswordText: user.passwordText
    };

    this.cookieService.set('InternalUserAuthData', JSON.stringify(userCookiesData));

    const passwordchanged = user['isPasswordUpdated']
    if (passwordchanged != true) {
      alert(passwordchanged + " " + this.UserData.isPasswordUpdated)
      this.AuthSession.addToSession(this.UserData);
      this.router.navigateByUrl('/SecurityIssue').then(() => {
        window.location.reload();
      });
    } else {
      // Show terms and conditions modal
      swal
        .fire({
          title: 'Terms & Conditions',
          html: `
          <div style="max-height: 400px; overflow-y: auto; text-align: left; padding: 10px;">
            <p>Welcome to Lovely Professional University. These terms and conditions outline the rules and regulations for the use of Lovely Professional University's Website, located at lpu.co.in</p>
            <p><strong>You specifically agree to all of the following undertakings:</strong></p>
            <ul style="list-style-type: disc; padding-left: 20px; font-size: 14px; line-height: 1.6;">
              <li>We agree to acknowledge CIF, LPU in our publications and thesis if the results from CIF instrumentation are incorporated/used in them.</li>
              <li>I/We undertake to abide by the safety, standard sample preparation guidelines and precautions during testing of samples.</li>
              <li>I/We understand the possibility of samples getting damaged during handling and analysis. I/We shall not claim for any loss/damage of the sample submitted to CIF and agree to resubmit the new sample requested by CIF for analysis.</li>
              <li>CIF, LPU reserves the rights to return the samples without performing analysis and will refund the analytical charges (after deduction of GST, if applicable) under special circumstances.</li>
              <li>I/we agree to maintain decorum during the visit in CIF labs for sample analysis and fully agree that CIF has full right to take action if decorum of CIF’s labs functionality is disturbed/hampered by me.</li>
              <li>CIF shall not take any responsibility about the analysis, interpretation and publication of data acquired by the end user.</li>
              <li>I/We hereby declare that the results of the analysis will not be used for the settlement of any legal issue.</li>
            </ul>
          </div>
        `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Yes, Agreed',
          cancelButtonText: 'No',
          customClass: { popup: 'swal-wide' }
        })
        .then((result) => {
          if (result.isConfirmed) {
            this.AuthSession.addToSession(this.UserData);
            this.router.navigateByUrl('/NewBookings').then(() => {
              window.location.reload();
            });
          } else {
            swal
              .fire({
                title: 'Agreement Required',
                text: 'You must agree to proceed further.',
                icon: 'warning'
              })
              .then(() => {
                this.logoutUser();
              });
          }
        });
    }
  }

  logoutUser(): void {
    this.cookieService.delete('InternalUserAuthData');
    this.AuthSession.clearSession();
    this.router.navigateByUrl('/Login');
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
   columns: any; loadingIndicator = false; headHtmlData: any[] = []; p: any = 1; perPage: any = 5;
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


 
// import { FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
// import { Component, OnInit } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { Router } from '@angular/router';
// import { AuthService } from 'src/app/_services/auth.service';
// import { StorageService } from 'src/app/_services/storage.service';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import swal from 'sweetalert2';
// import { LoginSessionService } from 'src/app/_services/login-session.service';
// import { UntypedFormBuilder, Validators } from '@angular/forms';

// @Component({
//   selector: 'app-CifLoginPage',
//   templateUrl: './CifLoginPage.component.html',
//   styleUrls: ['./CifLoginPage.component.scss'],
//   standalone: false
// })
// export class CifLoginPageComponent implements OnInit {
//   registrationNumber: any; EmployeeDetails: any[] = []; regdId: any; DriveDropDown: any; showNoDataFoundMessage: boolean; UserData: any;
//   EmployeeName: any; EmployeeCode: any; Department: any; DepartmentName: any; loadingIndicator: boolean; CandidateName: any;
//   UserId: any; Designation: any; EmailId: any; MobileNo: any; UserRole: any; SupervisorName: any; ProofNumber: any; ProofName: any; SecretKey: any;
//   Email: any;
//   formdata!: FormGroup;

//   constructor(
//     private CIFwebService: LpuCIFWebService,
//     private storageService: StorageService,
//     private authService: AuthService,
//     public formBuilder: UntypedFormBuilder,
//     private fb: FormBuilder,
//     private AuthSession: LoginSessionService,
//     private router: Router,
//     private cookieService: CookieService  ) { }

//   ngOnInit(): void {
//     this.cookieService.delete('InternalUserAuthData');
//     this.AuthSession.clearSession();
//     this.loadForm();
//   }

//   submitted = false;
//   showPassword = false;
//   loginError: string | null = null;
//   isLoginFailed = false;

//   loadForm(): void {
//     this.formdata = this.fb.group({
//       Email: ['', [Validators.required, Validators.minLength(5)]],
//       password: ['', [Validators.required, Validators.minLength(5)]],
//       UserRoleS: ['', Validators.required],
//     });
//     this.submitted = false;
//     this.loginError = null;
//   }

//   get email(): AbstractControl | null {
//     return this.formdata.get('Email');
//   }

//   get passwordText(): AbstractControl | null {
//     return this.formdata.get('password');
//   }

//   get userRole(): AbstractControl | null {
//     return this.formdata.get('UserRoleS');
//   }

//   togglePasswordVisibility(): void {
//     this.showPassword = !this.showPassword;
//   }
//   CheckUserType(event: Event): void {
//     const selectElement = event.target as HTMLSelectElement;
//     const selectedValue = selectElement.value;
//     if (selectedValue === 'select' || selectedValue == '') {
//       console.warn('Please select a valid role.');
//     } else {
//       // console.log('Valid Role Selected:', selectedValue);
//     }
//   }
//   OnSubmit() {
//     this.submitted = true;

//     if (this.formdata.invalid) {
//       this.formdata.markAllAsTouched();
//       return;
//     }
//     var DataX = this.formdata.value;
//     var uid = DataX.Email ?? '';
//     var password = DataX.password ?? '';
//     var userRoleX: number | null = null;
//     if (DataX.UserRoleS !== null && DataX.UserRoleS !== undefined) {
//       userRoleX = parseInt(DataX.UserRoleS as string);
//       this.AuthoriseUserNewWay(uid, password, userRoleX);
//     }

//     if (this.formdata.invalid) {
//       this.formdata.markAllAsTouched();
//       return;
//     }
//   }
//   LoginFailed(_NewError: any) {
//     this.isLoginFailed = true;
//     swal.fire({
//       title: 'Login Failed',
//       text: 'Login details are Invalid!',
//       icon: 'warning',
//     });

//   }

//   AuthoriseUserNewWay(Id: any, Key: any, Role: any): void {
//     this.CIFwebService.GetAuthoriseUserData(Id, Key, Role).subscribe({
//       next: (response) => {
//         if (response.item1 && response.item1.length > 0) {
//           this.Email = response.item1[0].email;
//           this.CreateToken(this.Email, response);

//           this.formdata.reset();
//           this.submitted = false;
//           this.loginError = null;
//           this.isLoginFailed = false;
//         } else {
//           this.showNoDataFoundMessage = true;
//           this.loginError = 'Invalid login details. Please try again.';
//           this.isLoginFailed = true;

//           swal.fire({
//             title: 'Invalid Login Details',
//             text: 'Check Details!',
//             icon: 'warning',
//           });
//           this.formdata.reset();
//           this.formdata.patchValue({
//             UserRoleS: '', // Reset to default "Select Role" placeholder
//           });
//           this.submitted = false;
//         }
//       },
//       error: (err) => {
//         console.error(err);

//         this.loginError = 'An error occurred while processing your request.';
//         this.isLoginFailed = true;

//         if (err.status === 0) {
//           swal.fire({
//             title: 'Server Down',
//             text: 'The server is currently unavailable. Please try again later.',
//             icon: 'error',
//           });
//         } else {
//           swal.fire({
//             title: 'Error',
//             text: this.loginError,
//             icon: 'error',
//           });
//         }

//         this.formdata.reset();
//         this.formdata.patchValue({
//           UserRoleS: '', // Reset to default "Select Role" placeholder
//         });
//         this.submitted = false;
//       }
//     });
//   }


//   AccessToken: any;

//   CreateToken(Id: any, response: any) {
//     this.authService.LoginJournalAccessTemp(Id).subscribe({
//       next: data => {
//         this.storageService.saveUser(data);
//         this.SetUserData(response);

//       },
//       error: () => {
//         this.loadingIndicator = false;
//         this.showNoDataFoundMessage = false;
//         this.isLoginFailed = false;
//       }
//     });
//   }

//   SetUserData(response: any) {
//     this.UserData = response.item1;
//     this.CandidateName = this.EmployeeName = response.item1[0].candidateName;
//     this.UserId = this.EmployeeCode = this.EmailId;
//     this.Department = response.item1[0].department;
//     this.DepartmentName = response.item1[0].departmentName;
//     this.Designation = response.item1[0].department;
//     this.EmailId = response.item1[0].emailId;
//     this.MobileNo = response.item1[0].mobileNumber;
//     this.UserRole = response.item1[0].userRole;
//     this.SupervisorName = response.item1[0].supervisorName;
//     this.ProofNumber = btoa(response.item1[0].idProofNumber);
//     this.ProofName = response.item1[0].idProofType;
//     this.SecretKey = btoa(response.item1[0].passwordText);

//     this.loadingIndicator = false;
//     this.showNoDataFoundMessage = false;
//     this.isLoginFailed = false;

//     const userCookiesData = {
//       CandidateName: this.CandidateName,
//       UserId: this.EmailId,
//       Department: this.Department,
//       DepartmentName: this.DepartmentName,
//       Designation: this.Designation,
//       EmailId: this.EmailId,
//       MobileNo: this.MobileNo,
//       UserRole: this.UserRole,
//       SupervisorName: this.SupervisorName,
//       ProofNumber: this.ProofNumber,
//       ProofName: this.ProofName,
//       PasswordText: this.SecretKey,
//     };
//     const UserCookies = JSON.stringify(userCookiesData);
//     this.cookieService.set('InternalUserAuthData', UserCookies);

//     swal.fire({
//       title: 'Terms Conditions',
//       text: 'Do you agree with terms Conditions?',
//       html: `
//   <div style="max-height: 400px; overflow-y: auto; text-align: left; padding: 10px;">
//     <p>
//       Welcome to Lovely Professional University. These terms and conditions outline the rules and regulations for the use of Lovely Professional University's Website, located at lpu.co.in
//     </p>

//     <p style="font-weight: bold;">You specifically agree to all of the following undertakings:</p>

//     <ul style="list-style-type: disc; padding-left: 20px; font-size: 14px; line-height: 1.6;">
//       <p style="margin-bottom: 8px;">•    We agree to acknowledge CIF, LPU in our publications and thesis if the results from CIF instrumentation are incorporated/used in them. </p>
//       <p style="margin-bottom: 8px;">• I/We undertake to abide by the safety, standard sample preparation guidelines and precautions during testing of samples.</p>
//       <p style="margin-bottom: 8px;">• I/We do understand the possibility of samples getting damaged during handling and analysis. I/We shall not claim for any loss/damage of the sample submitted to CIF and agreed to resubmit the new sample requested by CIF for analysis.</p>
//       <p style="margin-bottom: 8px;">• CIF, LPU reserves the rights to return the samples without performing analysis and will refund the analytical charges (after deduction of GST, if applicable) under special circumstances.</p>
//       <p style="margin-bottom: 8px;">• I/we do agree to maintain the decorum during the visit in CIF labs for sample analysis and fully agreed that CIF has full right to take action, if decorum of CIF’s labs functionality is disturbed/hampered by me.</p>
//       <p style="margin-bottom: 8px;">• CIF shall not take any responsibility about the analysis, interpretation and publication of data acquired by the end user.</p>
//       <p style="margin-bottom: 8px;">• I/We hereby declare that the results of the analysis will not be used for the settlement of any legal issue.</p>
//     </ul>
//   </div>
// `,

//       customClass: {
//         popup: 'swal-wide'
//       },
//       icon: 'success',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, Agreed',
//       cancelButtonText: 'No',
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.AuthSession.addToSession(this.UserData);

//         // this.router.navigateByUrl('/UserProfiles').then(() => {
//         //   window.location.reload();
//         // });
//         this.router.navigateByUrl('/NewBookings').then(() => {
//           window.location.reload();
//         });
//       } else {
//         swal.fire({
//           title: 'Agreement Required',
//           text: 'You must agree to proceed further.',
//           icon: 'warning',
//         }).then(() => {
//           this.LogoutUser();
//         });
//       }
//     });

//   }
//   openSampleInstructions() {
//     swal.fire({
//       title: 'Send Samples at Following Address :',
//       html: `
//            <address>
//             <div class="contact-text">
//             Central Instrumentation Facility (CIF) <br/>
//             Lovely Professional University <br/>
//             Block-38, Room No.106 <br/>
//             Jalandhar - Delhi G.T. Road, <br/>
//              Phagwara, Punjab (India) - 144411 <br/>
//             <a href="tel:+911824444021">+91 1824-444021</a><br>
//             cif@lpu.co.in<br>
//             </div>
//            </address>`,
//       icon: 'info'
//     });


//   }
//   LogoutUser() {
//     this.cookieService.delete('InternalUserAuthData');
//     this.AuthSession.clearSession(); // if you have a method like this
//     this.router.navigateByUrl('/Login'); // adjust to your login path
//   }


// }