import { Component, OnInit, ViewEncapsulation, AfterViewInit, Inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from 'src/environments/environment';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { AssetLoaderService } from 'src/app/_services/asset-load.service';
import * as $ from 'jquery';
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
  @ViewChild('headerDiv', { static: true }) headerDiv!: ElementRef;
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
   private CIFwebService: LpuCIFWebService,
    private assetLoader: AssetLoaderService,
    @Inject(DOCUMENT) private document: Document
  ) {}

ngOnInit() {
    //this.loadHeaderWithCorsWorkaround(environment.headerUrl, 0);
    this.loadHeader();
  }
  loadHeader() {
    this.CIFwebService.getLpuHeader().subscribe(async (res) => {


      // load css
      res.css.forEach((css: string) => this.assetLoader.loadCss(css));

      // load js
      res.js.forEach((js: string) => this.assetLoader.loadJs(js));

      // inject html
      this.headerDiv.nativeElement.innerHTML = res.html;
     
      // execute inline events after load
      setTimeout(() => {
      this.executeSafeInlineScripts(res.inlineScripts);
     this.initializeAnnouncementBar();
      }, 1500);
    });
  }


executeSafeInlineScripts(scripts: string[]) {
  if (!scripts) return;

  scripts.forEach((code: string) => {
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = code;
      document.body.appendChild(script);
    } catch (e) {
      console.log('safe script skipped');
    }
  });
}


initializeAnnouncementBar() {
  fetch("https://webapi.lpu.in/LPUAnnouncement/api/Announcement/GetAll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  })
  .then(res => res.json())
  .then(response => {

    if (!response.taskStatus || !response.data || response.data.length === 0) {
      const bar = document.querySelector(".announcement-bar");
      if (bar) (bar as HTMLElement).style.display = "none";
      return;
    }

    const slider = document.querySelector(".topbar-slider");
    if (!slider) return;

    slider.innerHTML = "";

    response.data
      .filter((x: any) => x.isActive)
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
      .forEach((item: any) => {

        const div = document.createElement("div");

        if (item.isCountdown && item.targetDate) {
          div.classList.add("notice");

          div.innerHTML = `
            <a href="${item.redirectUrl}" target="_blank">
              <span class="last-date" data-date="${item.targetDate}"></span>
              ${item.title}
            </a>
          `;
        } else {
          div.innerHTML = `
            <a href="${item.redirectUrl}" target="_blank">${item.title}</a>
          `;
        }

        slider.appendChild(div);
      });

  });
}

  rebindScripts() {
    const scripts = this.headerDiv.nativeElement.querySelectorAll('script');
    scripts.forEach((oldScript: any) => {
      const script = document.createElement('script');
      script.text = oldScript.innerHTML;
      document.body.appendChild(script);
    });
  }

  executeInlineScripts1(scripts: string[]) {
  if (!scripts || scripts.length === 0) return;

  scripts.forEach((code: string) => {
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = code;
      document.body.appendChild(script);
    } catch (e) {
      // console.log('inline script skipped');
    }
  });
}
// async loadHeader() {
//   this.CIFwebService.getLpuHeader().subscribe(async (res) => {

//     // wait css files
//     for (const css of res.css) {
//       await this.assetLoader.loadCss(css);
//     }

//     // wait js files
//     for (const js of res.js) {
//       await this.assetLoader.loadJs(js);
//     }

//     let cleanedHtml = this.removeJunkTags(res.html);
//     this.headerDiv.nativeElement.innerHTML = cleanedHtml;

//     setTimeout(() => {
//       this.initializeHeaderMenus();
//     }, 500);
//   });
// }



  // private loadHeaderWithCorsWorkaround(url: string, proxyIndex: number): void {
  //   const targetUrl = proxyIndex === 0 ? url : CORS_PROXIES[proxyIndex - 1] + encodeURIComponent(url);
    
  //   this.http.get(targetUrl, { responseType: 'text' }).subscribe({
  //     next: html => {
  //       this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  //       this.cdRef.detectChanges();
  //       // Disconnect observer before setTimeout fires to prevent double execution
  //       this.observer?.disconnect();
  //       setTimeout(() => {
  //         if (!this.scriptsExecuted) {
  //           this.reExecuteScripts('fixed-header');
  //           this.scriptsExecuted = true;
  //         }
  //       }, 500);
  //     },
  //     error: (err) => {
  //       console.error('Error fetching header (attempt ' + (proxyIndex + 1) + '):', err);
  //       // Try next CORS proxy if available
  //       if (proxyIndex < CORS_PROXIES.length) {
  //         console.log('Trying CORS proxy: ' + CORS_PROXIES[proxyIndex]);
  //         this.loadHeaderWithCorsWorkaround(url, proxyIndex + 1);
  //       } else {
  //         // All proxies failed, show fallback
  //         const fallback = ` `;
  //         this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(fallback);
  //         this.cdRef.detectChanges();
  //       }
  //     }
  //   });
  // }

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
