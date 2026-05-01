import { Component, OnInit, ViewEncapsulation, AfterViewInit, Inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from 'src/environments/environment';

// CORS proxy services - these allow bypassing CORS restrictions
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
];
;
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, AfterViewInit {
  headerHtml: SafeHtml | null = null;
  private observer: MutationObserver | null = null;
  private scriptsExecuted = false;  // ← GUARD FLAG

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

ngOnInit() {
    this.loadHeaderWithCorsWorkaround(environment.headerUrl, 0);
  }

  private loadHeaderWithCorsWorkaround(url: string, proxyIndex: number): void {
    const targetUrl = proxyIndex === 0 ? url : CORS_PROXIES[proxyIndex - 1] + encodeURIComponent(url);
    
    this.http.get(targetUrl, { responseType: 'text' }).subscribe({
      next: html => {
        this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.cdRef.detectChanges();
        // Disconnect observer before setTimeout fires to prevent double execution
        this.observer?.disconnect();
        setTimeout(() => {
          if (!this.scriptsExecuted) {
            this.reExecuteScripts('fixed-header');
            this.scriptsExecuted = true;
          }
        }, 500);
      },
      error: (err) => {
        console.error('Error fetching header (attempt ' + (proxyIndex + 1) + '):', err);
        // Try next CORS proxy if available
        if (proxyIndex < CORS_PROXIES.length) {
          console.log('Trying CORS proxy: ' + CORS_PROXIES[proxyIndex]);
          this.loadHeaderWithCorsWorkaround(url, proxyIndex + 1);
        } else {
          // All proxies failed, show fallback
          const fallback = ` `;
          this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(fallback);
          this.cdRef.detectChanges();
        }
      }
    });
  }

  private reExecuteScripts(containerId: string): void {
    const container = this.document.getElementById(containerId);
    if (!container) {
      console.warn(`Container #${containerId} not found`);
      return;
    }

    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      // Skip scripts that reference localhost-only resources (Cloudflare challenge etc.)
      const src = oldScript.getAttribute('src') || '';
      if (src.includes('cdn-cgi') || src.includes('challenge-platform')) {
        return; // skip — these only work on the real server
      }

      const newScript = this.document.createElement('script');

      // Copy all attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Wrap inline scripts in try-catch to prevent one failure blocking others
      if (oldScript.textContent && !oldScript.getAttribute('src')) {
        newScript.textContent = `try { ${oldScript.textContent} } catch(e) { console.warn('Header script error (safe to ignore on localhost):', e.message); }`;
      }

      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // Re-attach external CSS links
    const links = container.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = (link as HTMLLinkElement).href;
      if (!this.document.head.querySelector(`link[href="${href}"]`)) {
        this.document.head.appendChild(link.cloneNode(true));
      }
    });
  }

  loadGTMScript(gtmId: string) {
    // Prevent duplicate GTM injection
    if (this.document.querySelector(`script[data-gtm="${gtmId}"]`)) return;
    const script = this.document.createElement('script');
    script.setAttribute('data-gtm', gtmId);
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    this.document.head.appendChild(script);
  }

  ngAfterViewInit() {
    this.loadGTMScript('GTM-P8ZP9K2');

    // MutationObserver as fallback ONLY if ngOnInit HTTP hasn't resolved yet
    this.observer = new MutationObserver(() => {
      const container = this.document.getElementById('fixed-header');
      if (container && container.children.length > 0) {
        this.observer?.disconnect(); // Always disconnect once container is found
        if (!this.scriptsExecuted) {
          this.reExecuteScripts('fixed-header');
          this.scriptsExecuted = true;
        }
      }
    });

    this.observer.observe(this.document.body, { childList: true, subtree: true });
  }
}
// import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// import { DOCUMENT, isPlatformBrowser } from '@angular/common';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrls: ['./header.component.css'],
//   encapsulation: ViewEncapsulation.None
// })
// export class HeaderComponent implements OnInit, AfterViewInit {
//   headerHtml: SafeHtml | null = null;
//   loading: boolean = true;
//   error: boolean = false;
//   isMounted: boolean = false;
//   private observer: MutationObserver | null = null;



//   constructor(
//     private http: HttpClient,
//     private sanitizer: DomSanitizer,
//     private cdRef: ChangeDetectorRef,
//     @Inject(DOCUMENT) private document: Document
//   ) { }
//   ngOnInit() {
//     this.http
//       .get('https://includepages.lpu.in/newlpu/header.php', { responseType: 'text' })
//       .subscribe({
//         next: html => {
//           this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
//           this.cdRef.detectChanges();
//         },
//         error: err => {
//           console.error('Error fetching PHP header:', err);
//         }
//       });
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


//   ngAfterViewInit() {
//     this.loadGTMScript('GTM-P8ZP9K2');
//   }


// }
