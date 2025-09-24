import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service'; // For setting full cookies post-reset
 // import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// import { Router } from '@angular/router';

// import { MatSnackBar } from '@angular/material/snack-bar'; // For error/success messages (optional)
// import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { ActivatedRoute } from '@angular/router';
// import * as XLSX from 'xlsx';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import swal from 'sweetalert2';
import { LoginSessionService } from 'src/app/_services/login-session.service';

// import { ColumnMode } from '@swimlane/ngx-datatable';

// import { MatTableDataSource } from '@angular/material/table';
// import { NgSelectComponent } from '@ng-select/ng-select';
// import { forkJoin } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';

interface UserDetails {
  candidateName?: string;
  supervisorName?: string;
  mobileNumber?: string;
  organisation?: string;
  departmentName?: string;
  idProofType?: string;
  idProofNumber?: string;
  address?: string;
  emailId?: string;
  userRole?: number;
  department?: string;
  // Add other fields as needed
}

interface ApiResponse {
  item1: UserDetails[];
}

@Component({
  selector: 'app-securePasswordChange',
  templateUrl: './SecurePasswordChange.component.html',
  styleUrls: ['./SecurePasswordChange.component.scss']
})
export class SecurePasswordChangeComponent implements OnInit {
  resetForm: FormGroup;
  isSubmitting = false;
  isVerifying = false;
  isVerified = false;
  userDetails: UserDetails | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  securityMessage = 'For security reasons, you must update your password before continuing.';
  UserEmail:any;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private CIFwebService: LpuCIFWebService,
    private router: Router,
    private cookieService: CookieService,
    private authSession: LoginSessionService // For post-reset session
  ) {
    this.resetForm = this.fb.group({
      // Identity Verification Section
      mobileNumber: [{ value: '', disabled: true }, Validators.required],
      idProofType: [{ value: '', disabled: true }, Validators.required],
      idProofNumber: ['', [Validators.required]],

      // Password Section (initially disabled)
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  togglePasswordVisibility(field: 'newPassword' | 'confirmNewPassword'): void {
    const input = document.getElementById(field) as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }
  
  ngOnInit(): void {
    this.loadUserDetails();
  }

  private loadUserDetails(): void {

    const GetCookieData = this.cookieService.get('InternalUserAuthData');
    if (!GetCookieData) {
      
      return;
    }
    const retrievedCookies = JSON.parse(GetCookieData);
    this.UserEmail=retrievedCookies.EmailId;
    this.CIFwebService.CIFGetUserDetails(retrievedCookies.EmailId).subscribe({
      next: (data: ApiResponse) => {
        this.userDetails = data.item1[0]; // As per your snippet
        // console.log('User  Details:', JSON.stringify(this.userDetails));

        // Patch read-only fields
        this.resetForm.patchValue({
          mobileNumber: this.userDetails.mobileNumber || '',
          idProofType: this.userDetails.idProofType || ''
        });

        // Disable password fields until verified
        this.resetForm.get('newPassword')?.disable();
        this.resetForm.get('confirmNewPassword')?.disable();
      },
      error: (error) => {
        console.error('Failed to load user details:', error);
        this.errorMessage = 'Failed to load user details. Please log in again.';
        // Optional: alert(this.errorMessage);
        this.router.navigate(['/Login']);
      }
    });
  }

  // Verify identity
  verifyIdentity(): void {
    if (!this.userDetails) {
      this.errorMessage = 'User  details not loaded.';
      return;
    }

    const enteredIdProofNumber = this.resetForm.get('idProofNumber')?.value;
    if (!enteredIdProofNumber) {
      this.errorMessage = 'Please enter your ID Proof Number.';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = null;

    // Client-side match (insecure for prod; replace with backend API)
    if (enteredIdProofNumber === this.userDetails.idProofNumber) {
      this.isVerified = true;
      this.isVerifying = false;
      this.successMessage = 'Identity verified successfully!';
      // Clear after 3s
      setTimeout(() => { this.successMessage = null; }, 3000);

      // Enable password fields
      this.resetForm.get('newPassword')?.enable();
      this.resetForm.get('confirmNewPassword')?.enable();

      // Disable idProofNumber after verification
      this.resetForm.get('idProofNumber')?.disable();
    } else {
      this.isVerifying = false;
      this.resetForm.get('idProofNumber')?.setErrors({ mismatch: true });
      this.errorMessage = 'Invalid details. Please try again.';
    }

    // TODO: For security, use backend:
    // this.authService.verifyIdentity(this.userDetails.mobileNumber || '', enteredIdProofNumber).subscribe({
    //   next: () => { this.isVerified = true; /* ... */ },
    //   error: () => { this.errorMessage = 'Invalid details.'; }
    // });
  }

  onSubmit(): void {
    if (!this.isVerified || this.resetForm.invalid || this.isSubmitting) {
      this.errorMessage = 'Please verify identity and complete the form.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    const { newPassword } = this.resetForm.value;
    const formData = new FormData();
     formData.append('UserId', this.UserEmail);
     formData.append('Password', newPassword);
         
            this.CIFwebService.CIFUpdateUserDetails(formData).subscribe({
              next: (data: any) => {
                const result = data.item1[0]['msg'];
                if (result === 'Success') {
                  swal.fire({
                    title: 'Details Updated Successfully!',
                    text: 'You will be logeed out ',
                    icon: 'success'
                  }).then(() => {
                    this.router.navigateByUrl('cifWebPortal');
                    // this.router.navigate(['/cifWebPortal']);
                  });
                } else if (result === 'Failed') {
                  swal.fire({
                    title: 'Unable to Update Details Try Again Later ',
                    icon: 'error'
                  }).then(() => {
                    window.location.reload();
                  });
                } else {
                  swal.fire({
                    title: 'Something Went Wrong, Try again later',
                    icon: 'error'
                  }).then(() => {
                    window.location.reload();
                  });
                }
          
              },
              error: (error: any) => {
                swal.fire({
                  title: 'Error',
                  text: 'Failed to Update.',
                  icon: 'error'
                }).then(() => {
                  window.location.reload();
                });
              },
              complete: () => {
              }
            });
    // this.authService.changePassword(newPassword).subscribe({
    //   next: (response) => {
    //     this.isSubmitting = false;
    //     this.successMessage = 'Password updated successfully! Redirecting...';

    //     // Set full auth cookies (as in your login code)
    //     if (this.userDetails) {
    //       const userCookiesData = {
    //         CandidateName: this.userDetails.candidateName,
    //         UserId: this.userDetails.emailId,
    //         Department: this.userDetails.department,
    //         DepartmentName: this.userDetails.departmentName,
    //         Designation: this.userDetails.department,
    //         EmailId: this.userDetails.emailId,
    //         MobileNo: this.userDetails.mobileNumber,
    //         UserRole: this.userDetails.userRole || 1, // Default or fetch if needed
    //         SupervisorName: this.userDetails.supervisorName,
    //         ProofNumber: btoa(this.userDetails.idProofNumber || ''), // Encoded
    //         ProofName: this.userDetails.idProofType,
    //       };
    //       this.cookieService.set('InternalUser AuthData', JSON.stringify(userCookiesData));

    //       // Add to session (as in login)
    //       this.authSession.addToSession([{ /* userDetails object */ }]); // Adjust to match your UserData structure
    //     }

    //     // Redirect after success
    //     setTimeout(() => {
    //       this.router.navigate(['/NewBookings']);
    //     }, 2000);
    //   },
    //   error: (error) => {
    //     this.isSubmitting = false;
    //     this.errorMessage = 'Failed to update password. Please try again.';
    //     console.error('Password change error:', error);
    //     // Optional: alert(this.errorMessage);
    //   }
    // });
  }

  // Custom validator: Password match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.isVerified) return null;
    const newPassword = control.get('newPassword')?.value;
    const confirmNewPassword = control.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  }

  // Getters for template
  get idProofNumber() { return this.resetForm.get('idProofNumber'); }
  get newPassword() { return this.resetForm.get('newPassword'); }
  get confirmNewPassword() { return this.resetForm.get('confirmNewPassword'); }

  // Clear messages
  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}

// import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// import { Router } from '@angular/router';

// import { MatSnackBar } from '@angular/material/snack-bar'; // For error/success messages (optional)
// import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { ActivatedRoute } from '@angular/router';
// import * as XLSX from 'xlsx';
// import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
// import Swal from 'sweetalert2';
// import { LoginSessionService } from 'src/app/_services/login-session.service';

// import { ColumnMode } from '@swimlane/ngx-datatable';

// import { MatTableDataSource } from '@angular/material/table';
// import { NgSelectComponent } from '@ng-select/ng-select';
// import { forkJoin } from 'rxjs';
// import { AuthService } from 'src/app/_services/auth.service';


// interface UserDetails {
//   candidateName?: string;
//   supervisorName?: string;
//   mobileNumber?: string;
//   organisation?: string;
//   departmentName?: string;
//   idProofType?: string;
//   idProofNumber?: string;
//   address?: string;
//   // Add other fields as needed
// }



// @Component({
//   selector: 'app-securePasswordChange',
//   templateUrl: './SecurePasswordChange.component.html',
//   styleUrls: ['./SecurePasswordChange.component.scss']
// })
// export class SecurePasswordChangeComponent implements OnInit {
//   resetForm: FormGroup;
//   isSubmitting = false;
//   isVerifying = false;
//   isVerified = false;
//   userDetails: UserDetails | null = null;
//   securityMessage = 'For security reasons, you must verify your identity and update your password before continuing.';

//   cifUserForm!: FormGroup;
//   isForm1Submitted = false;
//   isEditMode = false;
//   UserDetails: any;
//   isLoading = false;
//   isSubmitted = false;
//   submissionError = false;
//   submissionSuccess = false;
//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private router: Router,
//     private cookieService: CookieService,
//     private CIFwebService: LpuCIFWebService,
//     private snackBar: MatSnackBar  ,
//   ) {
//    this.resetForm = this.fb.group({
//       // Identity Verification Section
//       mobileNumber: [{ value: '', disabled: true }, Validators.required],
//       idProofType: [{ value: '', disabled: true }, Validators.required],
//       idProofNumber: ['', [Validators.required]],
//       // Password Section (initially not validated until verified)
//       newPassword: ['', [Validators.required, Validators.minLength(8)]],
//       confirmNewPassword: ['', [Validators.required]]
//     }, { validators: this.passwordMatchValidator });
//   }

//   ngOnInit(): void {
//    this.populateUserData();
//   }

//  populateUserData() {
//     const GetCookieData = this.cookieService.get('InternalUserAuthData');
//     if (!GetCookieData) {
      
//       return;
//     }
//     const retrievedCookies = JSON.parse(GetCookieData);

//     this.CIFwebService.CIFGetUserDetails(retrievedCookies.EmailId).subscribe({
//       next: (data) => {
//         this.userDetails = data.item1[0];
//         // console.log('User  Details:', JSON.stringify( this.UserDetails));

//        // Patch read-only fields (mobile and idProofType)
//         this.resetForm.patchValue({
//           mobileNumber: this.userDetails?.mobileNumber || '',
//           idProofType: this.userDetails?.idProofType || ''
//         });
//         // Optional: Pre-disable password fields until verified
//         this.resetForm.get('newPassword')?.disable();
//         this.resetForm.get('confirmNewPassword')?.disable();
//       },
//       error: (err) => {
//         console.error('Error fetching user details:', err);
//       }
//     });
//   }

//   // Verify identity on button click or blur
//   verifyIdentity(): void {
//     if (!this.userDetails) return;

//     const enteredIdProofNumber = this.resetForm.get('idProofNumber')?.value;
//     if (!enteredIdProofNumber) {
//       this.snackBar.open('Please enter your ID Proof Number.', 'Close', { duration: 3000 });
//       return;
//     }

//     this.isVerifying = true;

//     // Client-side match (insecure for prod; see note below)
//     if (enteredIdProofNumber === this.userDetails.idProofNumber) {
//       this.isVerified = true;
//       this.isVerifying = false;
//       this.snackBar.open('Identity verified successfully!', 'Close', { duration: 3000 });

//       // Enable password fields
//       this.resetForm.get('newPassword')?.enable();
//       this.resetForm.get('confirmNewPassword')?.enable();

//       // Optional: Disable idProofNumber after verification
//       this.resetForm.get('idProofNumber')?.disable();
//     } else {
//       this.isVerifying = false;
//       this.resetForm.get('idProofNumber')?.setErrors({ mismatch: true });
//       this.snackBar.open('Invalid details. Please try again.', 'Close', { duration: 5000 });
//     }

//     // TODO: For security, replace client-side with backend call:
//     // this.authService.verifyIdentity(this.userDetails.mobileNumber || '', enteredIdProofNumber).subscribe({
//     //   next: () => { /* set isVerified = true */ },
//     //   error: () => { /* show invalid message */ }
//     // });
//   }


//  onSubmit(): void {
//     if (!this.isVerified || this.resetForm.invalid || this.isSubmitting) return;
//     this.isSubmitting = true;
//     const { newPassword } = this.resetForm.value;
//     // this.authService.changePassword(newPassword).subscribe({ // No oldPassword needed
//     //   next: (response) => {
//     //     this.isSubmitting = false;
//     //     this.snackBar.open('Password updated successfully!', 'Close', { duration: 3000 });
//     //     this.router.navigate(['/dashboard']);
//     //   },
//     //   error: (error) => {
//     //     this.isSubmitting = false;
//     //     this.snackBar.open('Failed to update password. Please try again.', 'Close', { duration: 5000 });
//     //     console.error('Password change error:', error);
//     //   }
//     // });
//   }
//   // Custom validator: Ensure new password matches confirmation
//   passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
//     if (!this.isVerified) return null; // Only validate after verification
//     const newPassword = control.get('newPassword')?.value;
//     const confirmNewPassword = control.get('confirmNewPassword')?.value;
//     return newPassword === confirmNewPassword ? null : { mismatch: true };
//   }
//   // Getters for template
//   get idProofNumber() { return this.resetForm.get('idProofNumber'); }
//   get newPassword() { return this.resetForm.get('newPassword'); }
//   get confirmNewPassword() { return this.resetForm.get('confirmNewPassword'); }
// }
