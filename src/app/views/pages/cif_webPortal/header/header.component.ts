import { Component, Inject, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Declare jQuery if the header uses it for hover effects
declare var $: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, AfterViewInit {
  headerHtml: SafeHtml = '';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.http.get('/php-header', { responseType: 'text' }).subscribe({
      next: (html: string) => {
        this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        
        // Wait a tiny bit for Angular to render the HTML into the view
        setTimeout(() => {
          this.reinitializeHeaderScripts();
        }, 100);
      },
      error: (err) => console.error('Error:', err)
    });
  }

  private reinitializeHeaderScripts() {
    // If the header uses a standard Bootstrap dropdown or custom jQuery hover:
    if (typeof $ !== 'undefined') {
      // Example: Force re-binding of hover/dropdowns
      $('.dropdown').hover(
        () => { $(this).addClass('show').find('.dropdown-menu').addClass('show'); },
        () => { $(this).removeClass('show').find('.dropdown-menu').removeClass('show'); }
      );
    }
    
    // Check if the remote header requires a specific global function to be called
    // Many LPU headers use a function like initMenu() or layout.init()
  }

  ngAfterViewInit(): void {
    this.loadGTMScript('GTM-P8ZP9K2');
  }

  private loadGTMScript(gtmId: string): void {
    if (this.document.getElementById('gtm-js')) return;
    const script = this.document.createElement('script');
    script.id = 'gtm-js';
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    this.document.head.appendChild(script);
  }
}
// import { Component, Inject, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DOCUMENT } from '@angular/common';

// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html'
// })
// export class HeaderComponent implements OnInit {
//    headerHtml: SafeHtml = '';

//   constructor(
//     private http: HttpClient,
//     private sanitizer: DomSanitizer,
//     @Inject(DOCUMENT) private document: Document
//   ) {}

//   ngOnInit() {
//     // Load remote header HTML
//     this.http
//       .get('https://includepages.lpu.in/newlpu/header.php', { responseType: 'text' })
//       .subscribe({
//         next: html => {
//           this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
//         },
//         error: err => {
//           console.error('Error fetching PHP header:', err);
//         }
//       });
//   }

//   ngAfterViewInit() {
//     this.loadGTMScript('GTM-P8ZP9K2');
//   }

//   loadGTMScript(gtmId: string) {
//     const script = this.document.createElement('script');
//     script.innerHTML = `
//       (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
//       new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
//       j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
//       'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
//       })(window,document,'script','dataLayer','${gtmId}');
//     `;
//     this.document.head.appendChild(script);
//   }
// }

