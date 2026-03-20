import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit,  AfterViewInit {
  headerHtml: SafeHtml | null = null;
  loading: boolean = true;
  error: boolean = false;
  isMounted: boolean = false;
  private observer: MutationObserver | null = null;

 
 
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}
ngOnInit() {
    this.http
      .get('https://includepages.lpu.in/newlpu/header.php', { responseType: 'text' })
      .subscribe({
        next: html => {
          this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
          this.cdRef.detectChanges();  
        },
        error: err => {
          console.error('Error fetching PHP header:', err);
        }
      });
  }
  
  loadGTMScript(gtmId: string) {
    const script = this.document.createElement('script');
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
  }

  
}
