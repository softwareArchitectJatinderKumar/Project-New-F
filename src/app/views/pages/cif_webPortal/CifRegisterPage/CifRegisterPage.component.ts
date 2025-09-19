import { Component, OnInit } from '@angular/core';
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

  // OnReset(): void {
  //   this.cifUserForm.reset();
  //   this.isForm1Submitted = false;
  // }
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
