import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/environments/environment';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { AssetLoaderService } from 'src/app/_services/asset-load.service';

// CORS proxy services - these allow bypassing CORS restrictions
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
})
export class FooterComponent implements OnInit, AfterViewInit {
  footerHtml: SafeHtml = '';
  showGotoTop = false;
  @ViewChild('footerDiv', { static: true }) footerDiv!: ElementRef;
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
      private CIFwebService: LpuCIFWebService,
        private assetLoader: AssetLoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
  //  this.loadFooterWithCorsWorkaround(environment.footerUrl, 0);
   this.loadFooter();
  }

  loadFooter() {
    this.CIFwebService.getLpuFooter().subscribe(res => {

      // load css
      res.css.forEach((css: string) => this.assetLoader.loadCss(css));

      // load js
      res.js.forEach((js: string) => this.assetLoader.loadJs(js));

      // inject html
      this.footerDiv.nativeElement.innerHTML = res.html;

      // execute inline events after load
      setTimeout(() => {
        this.rebindScripts();
      }, 1500);
    });
  }

  rebindScripts() {
    const scripts = this.footerDiv.nativeElement.querySelectorAll('script');
    scripts.forEach((oldScript: any) => {
      const script = document.createElement('script');
      script.text = oldScript.innerHTML;
      document.body.appendChild(script);
    });
  }


  // private loadFooterWithCorsWorkaround(url: string, proxyIndex: number): void {
  //   const targetUrl = proxyIndex === 0 ? url : CORS_PROXIES[proxyIndex - 1] + encodeURIComponent(url);
    
  //   this.http.get(targetUrl, { responseType: 'text' }).subscribe({
  //     next: html => {
  //       this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  //     },
  //     error: (err) => {
  //       console.error('Error fetching footer (attempt ' + (proxyIndex + 1) + '):', err);
  //       // Try next CORS proxy if available
  //       if (proxyIndex < CORS_PROXIES.length) {
  //         console.log('Trying CORS proxy: ' + CORS_PROXIES[proxyIndex]);
  //         this.loadFooterWithCorsWorkaround(url, proxyIndex + 1);
  //       } else {
  //         // All proxies failed, show empty fallback
  //         const fallback = ` `;
  //         this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(fallback);
  //       }
  //     }
  //   });
  // }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        this.showGotoTop = window.scrollY > 300;
      });
    }
  }

  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }
}


// import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import { isPlatformBrowser } from '@angular/common';
// import { environment } from 'src/environments/environment';
// @Component({
//   selector: 'app-footer',
//   templateUrl: './footer.component.html',
// })
// export class FooterComponent implements OnInit, AfterViewInit {
//   footerHtml: SafeHtml = '';
//   showGotoTop = false;

//   constructor(
//     private http: HttpClient,
//     private sanitizer: DomSanitizer,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit(): void {
//     this.http
//     .get(environment.footerUrl, { responseType: 'text' })
//       // .get('/api/footer', { responseType: 'text' })   // ← changed
//       .subscribe({
//         next: html => {
//           this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
//         },
//         error: err => console.error('Error fetching footer:', err),
//       });
//   }

//   ngAfterViewInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       window.addEventListener('scroll', () => {
//         this.showGotoTop = window.scrollY > 300;
//       });
//     }
//   }

//   scrollToTop(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
//     }
//   }
// }
// import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import { isPlatformBrowser } from '@angular/common';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// @Component({
//   selector: 'app-footer',
//   templateUrl: './footer.component.html',
// })
// export class FooterComponent implements OnInit, AfterViewInit {
//     footerHtml: SafeHtml = '';
//   showGotoTop = false;

//   constructor(
//     private http: HttpClient,
//     private sanitizer: DomSanitizer,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit(): void {
//     this.http
//       .get('https://includepages.lpu.in/newlpu/footer.php', { responseType: 'text' })
//       .subscribe({
//         next: html => {
//           this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
//         },
//         error: err => console.error('Error fetching footer:', err),
//       });
//   }

//   ngAfterViewInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       window.addEventListener('scroll', () => {
//         this.showGotoTop = window.scrollY > 300;
//       });
//     }
//   }

//   scrollToTop(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
//     }
//   }
// }
