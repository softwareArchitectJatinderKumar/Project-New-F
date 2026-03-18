import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  headerHtml: SafeHtml | null = null;
  loading = true;
  error = false;
  isMounted = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMounted = true;
      this.fetchHeader();
    }
  }

  fetchHeader(): void {
    this.loading = true;
    this.error = false;

    // Dynamic URL Selection
    const isLocal = window.location.hostname === 'localhost';
    const url = isLocal 
      ? '/api/header' 
      : 'https://includepages.lpu.in/newlpu/header.php';

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (html) => {
        if (html && html.includes('<nav')) {
          // Fix relative image paths to point to main domain
          const fixedHtml = html.replace(/src="\//g, 'src="https://www.lpu.in/');
          this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(fixedHtml);
          
          // Re-init hover effects after brief delay for DOM render
          setTimeout(() => this.initScripts(), 200);
        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  private initScripts(): void {
    const navItems = document.querySelectorAll('#remote-header-wrapper .nav-item');
    navItems.forEach((item: any) => {
      item.addEventListener('mouseenter', () => item.classList.add('show'));
      item.addEventListener('mouseleave', () => item.classList.remove('show'));
    });
  }
}
// import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import { isPlatformBrowser } from '@angular/common';

// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrls: ['./header.component.css']
// })
// export class HeaderComponent implements OnInit, OnDestroy {
//   headerHtml: SafeHtml | null = null;
//   loading: boolean = true;
//   error: boolean = false;
//   isMounted: boolean = false;

//   // Use the proxy path for local, or the full URL for live if CORS is enabled
//   private readonly HEADER_URL = '/api/header'; 

//   constructor(
//     private http: HttpClient, 
//     private sanitizer: DomSanitizer,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       this.isMounted = true;
//       this.fetchHeader();
//     }
//   }

//   fetchHeader(): void {
//     this.loading = true;
//     this.error = false;

//     this.http.get(this.HEADER_URL, { responseType: 'text' })
//       .subscribe({
//         next: (html) => {
//           if (html && html.includes('<nav')) {
//             // Fix relative paths to ensure images load from the main domain
//             const fixedHtml = html.replace(/src="\//g, 'src="https://www.lpu.in/');
//             this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(fixedHtml);
            
//             // Re-bind JS events after the HTML is injected
//             setTimeout(() => this.initHeaderScripts(), 200);
//           } else {
//             this.error = true;
//           }
//           this.loading = false;
//         },
//         error: (err) => {
//           console.error('Header Load Error:', err);
//           this.error = true;
//           this.loading = false;
//         }
//       });
//   }

//   private initHeaderScripts(): void {
//     // Dropdown hover logic for the university menu
//     const navItems = document.querySelectorAll('#remote-header-wrapper .nav-item');
//     navItems.forEach((item: any) => {
//       item.addEventListener('mouseenter', () => item.classList.add('show'));
//       item.addEventListener('mouseleave', () => item.classList.remove('show'));
//     });
//   }

//   ngOnDestroy(): void {}
// }
 