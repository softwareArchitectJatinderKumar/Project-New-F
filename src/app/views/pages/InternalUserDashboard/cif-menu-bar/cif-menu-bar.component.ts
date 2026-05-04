import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { UntypedFormBuilder } from '@angular/forms';
import swal from 'sweetalert2';
import { CookieService } from 'ngx-cookie-service';
import { LoginSessionService } from 'src/app/_services/login-session.service';

@Component({
  selector: 'app-cif-menu-bar',
  templateUrl: './cif-menu-bar.component.html',
  styleUrls: ['./cif-menu-bar.component.scss'],
})
export class CifMenuBarComponent implements OnInit {
  UserRole: any;
  user_Email: any;
  candidateName: any;
  isNavbarCollapsed: boolean = true;
  loadingIndicator: boolean = false;

  constructor(
    private router: Router,
    private cookieService: CookieService,
    private AuthSession: LoginSessionService,
  ) {
    const cookieData = this.cookieService.get('InternalUserAuthData');
    if (!cookieData || cookieData.trim().length === 0) {
      this.router.navigate(['/Home']);
    }
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData() {
    try {
      const cookieData = this.cookieService.get('InternalUserAuthData');
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        this.UserRole = parsed.UserRole;
        this.user_Email = parsed.EmailId;
        this.candidateName = parsed.CandidateName;
      }
    } catch (error) {
      console.error('Error parsing user session', error);
    }
  }

  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at the following Address :',
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
      icon: 'info',
    });
  }

  VisitUrl(url: string, name: string, id: any, categoryId: any) {
    const targetUrl = url.startsWith('/') ? url : '/' + url;
    this.router.navigate([targetUrl, name, id, categoryId]);
  }

  goto(path: string) {
    this.isNavbarCollapsed = true;
    const targetPath = path.startsWith('/') ? path : '/' + path;
    this.router.navigate([targetPath]);
  }
  // VisitUrl(url: string, name: string, id: any, categoryId: any) {
  //   this.router.navigate([url, name, id, categoryId]);
  // }

  // goto(path: string) {
  //   this.isNavbarCollapsed = true;
  //   this.router.navigate([path]);
  // }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  LogoutUser() {
    swal.fire({
      title: 'Logging out...',
      allowOutsideClick: false,
      didOpen: () => { },
    });

    this.cookieService.delete('InternalUserAuthData', '/');
    this.AuthSession.clearSession();

    setTimeout(() => {
      swal.close();
      this.router.navigate(['Home'], { replaceUrl: true })
    }); 
     
  }  
  // LogoutUser() {
  //   swal.fire({
  //     title: 'Logging out...',
  //     allowOutsideClick: false,
  //     didOpen: () => { },
  //   });

  //   this.cookieService.delete('InternalUserAuthData', '/');
  //   this.AuthSession.clearSession();

  //   setTimeout(() => {
  //     swal.close();
  //     this.router.navigate(['Home'], { replaceUrl: true }).then(() => {
  //       // window.location.reload();
  //     });
  //   }, 500);
  // }

  CheckUser(): boolean {
    return String(this.UserRole) === '400000';
  }
}

// import { Component, OnInit } from '@angular/core';

// import { Router } from '@angular/router';
// import { UntypedFormBuilder } from '@angular/forms';
// import swal from 'sweetalert2';
// import { CookieService } from 'ngx-cookie-service';
// import { LoginSessionService } from 'src/app/_services/login-session.service';

// @Component({
//   standalone: false,
//   selector: 'app-cif-menu-bar',
//   templateUrl: './cif-menu-bar.component.html',
//   styleUrls: ['./cif-menu-bar.component.scss']
// })
// export class CifMenuBarComponent implements OnInit {

//   UserSessionData: any;   UserRole: any;    user_Email: any;  supervisorName: any;  departmentName: any;  candidateName: any;
//   constructor(
//     public formBuilder: UntypedFormBuilder,
//     private AuthSession: LoginSessionService,
//     private router: Router, private cookieService: CookieService
//   ) {
//     const GetCookieData = this.cookieService.get('InternalUserAuthData');
//     if (GetCookieData.length == 0) {
//       swal.fire({
//         title: 'Login Failed ',
//         icon: 'warning',
//       });
//       this.router.navigate(['']);
//     }
//    }

// openSampleInstructions() {
//   swal.fire({
//     title: 'Send Samples at the following Address :',
//     html: `
//          <address>
//           <div class="contact-text">
//            Central Instrumentation Facility (CIF) <br/>
//           Lovely Professional University <br/>
//           Block-38, Room No.106 <br/>
//           Jalandhar - Delhi G.T. Road, <br/>
//           Phagwara, Punjab (India) - 144411 <br/>
//           Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
//           Email : cif@lpu.co.in<br>
//           </div>
//          </address>`,
//     icon: 'info'
//   });
//   }
//   showBlink = true;

//   ngOnInit(): void {

//     const GetCookieData = this.cookieService.get('InternalUserAuthData');
//     const retrievedCookies = JSON.parse(GetCookieData);

//     this.UserRole = retrievedCookies.UserRole ;//?.length > 0 ? retrievedCookies.userRole : 'Internal User';
//     this.user_Email = retrievedCookies.EmailId;
//     this.supervisorName = retrievedCookies.SupervisorName;
//     this.departmentName = retrievedCookies.DepartmentName;
//     this.candidateName = retrievedCookies.CandidateName;

//   }
//   handleChangePassword(event: Event) {
//     if (this.CheckUser()) {
//       event.preventDefault(); // Prevent link navigation
//     } else {
//       this.router.navigate(['/ChangePassword']);
//     }
//   }

//   CheckUser(): boolean {
//     return this.UserRole==400000 ? true : false;
//   }

//   goto(val: any) {
//     this.router.navigateByUrl(val);
//   }
//   isNavbarCollapsed: boolean = true;
//   toggleNavbar(): void {
//     this.isNavbarCollapsed = !this.isNavbarCollapsed;
//   }
//   loadingIndicator: any;
//   // LogoutUser() {
//   //   this.loadingIndicator = true;
//   //   const startTime = new Date().getTime();
//   //   this.cookieService.delete('InternalUserAuthData');
//   //   this.AuthSession.clearSession(); // if you have a method like this
//   //   const elapsed = new Date().getTime() - startTime;
//   //   const remainingDelay = Math.max(1000 - elapsed, 0); // wait at least 5s

//   //   setTimeout(() => {
//   //     this.loadingIndicator = false;
//   //     this.router.navigate(['/Login']);
//   //   }, remainingDelay);
//   //   // this.goto('Login'); // adjust to your login path

//   // }

//   LogoutUser () {
//     this.loadingIndicator = true;

//     // Clear cookies and session immediately
//     this.cookieService.delete('InternalUserAuthData');
//     this.AuthSession.clearSession();

//     // Wait 1 second before navigating (adjust delay as needed)
//     setTimeout(() => {
//       this.loadingIndicator = false;
//       this.router.navigate(['Home'], { replaceUrl: true }).then(() => {
//         window.location.reload();
//       });

//     }, 1000);
//   }

// }
