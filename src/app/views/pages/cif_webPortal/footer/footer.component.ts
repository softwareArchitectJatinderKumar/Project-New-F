import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
// import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
})
export class FooterComponent implements OnInit, AfterViewInit {
    footerHtml: SafeHtml | null = null;
    loading: boolean = true;
    error: boolean = false;
    isMounted: boolean = false;
     showGotoTop = false;
  
    constructor(
      private http: HttpClient, 
      private sanitizer: DomSanitizer,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}
  
    ngOnInit(): void {
      this.isMounted = true;
      this.fetchfooter();
    }
  
    ngOnDestroy(): void {
      this.isMounted = false;
    }
  
    fetchfooter(): void {
      // Using /api/remote-footer which proxies to https://includepages.lpu.in/newlpu/footer.php
      // This matches the React Remotefooter component's endpoint
      this.http.get('/api/remote-footer', { responseType: 'text' })
        .pipe(
          catchError((err) => {
            console.error('Proxy Error Details:', err);
            this.error = true;
            return of('');
          }),
          finalize(() => this.loading = false)
        )
        .subscribe(html => {
          if (html) this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        });
    }

    
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

//   footerHtml: SafeHtml = '';
//   showGotoTop = false;

//   constructor(
//     private http: HttpClient,
//     private sanitizer: DomSanitizer,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit(): void {
//     this.http
//      .get('/api/remote-footer', { responseType: 'text' })
//       // .get('/php-footer', { responseType: 'text' })  
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

