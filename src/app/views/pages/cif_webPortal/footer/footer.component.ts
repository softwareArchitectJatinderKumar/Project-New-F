import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  footerHtml: SafeHtml | null = null;
  loading = true;
  error = false;
  showGotoTop = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showGotoTop = window.scrollY > 300;
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchFooter();
    }
  }

  fetchFooter(): void {
    this.loading = true;
    const isLocal = window.location.hostname === 'localhost';
    const url = isLocal 
      ? '/api/footer' 
      : 'https://includepages.lpu.in/newlpu/footer.php';

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (html) => {
        if (html && html.trim().length > 100) {
          const fixedHtml = html.replace(/src="\//g, 'src="https://www.lpu.in/');
          this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(fixedHtml);
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

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import { isPlatformBrowser } from '@angular/common';

// @Component({
//   selector: 'app-footer',
//   templateUrl: './footer.component.html',
//   styleUrls: ['./footer.component.css']
// })
// export class FooterComponent implements OnInit, OnDestroy {
//   footerHtml: SafeHtml | null = null;
//   loading: boolean = true;
//   error: boolean = false;
//   isMounted: boolean = false;
//   showGotoTop = false;

//   // Use the proxy path defined in proxy.conf.json
//   private readonly FOOTER_URL = '/api/footer';

//   constructor(
//     private http: HttpClient,
//     private sanitizer: DomSanitizer,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) { }

//   ngOnInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       this.isMounted = true;
//       this.fetchFooter();
//     }
//   }

//   // Listens for scroll events to show/hide "Back to Top" button
//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     if (isPlatformBrowser(this.platformId)) {
//       this.showGotoTop = window.scrollY > 300;
//     }
//   }

//   fetchFooter(): void {
//     this.loading = true;
//     this.error = false;

//     this.http.get(this.FOOTER_URL, { responseType: 'text' })
//       .subscribe({
//         next: (html) => {
//           if (html && html.trim().length > 100) {
//             // Fix relative paths (e.g., /images/logo.png -> https://www.lpu.in/images/logo.png)
//             const correctedHtml = html.replace(/src="\//g, 'src="https://www.lpu.in/');
//             this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(correctedHtml);
//           } else {
//             this.error = true;
//           }
//           this.loading = false;
//         },
//         error: (err) => {
//           console.error('Footer fetch failed:', err);
//           this.error = true;
//           this.loading = false;
//         }
//       });
//   }

//   scrollToTop(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
//     }
//   }

//   ngOnDestroy(): void {
//     this.isMounted = false;
//   }
// }
 