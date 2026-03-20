import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { of, throwError, Observable, timer } from 'rxjs';


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
     private isProduction: boolean = false;
     private apiTimeout: number = 10000; // 10 seconds timeout
     private fallbackHtml: string = `
       <div class="fallback-footer">
         <div class="fallback-content">
           
         </div>
       </div>
     `;

    constructor(
      private http: HttpClient, 
      private sanitizer: DomSanitizer,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
      this.isProduction = this.detectProductionMode();
    }

    private detectProductionMode(): boolean {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
        const isLpuDomain = hostname.includes('lpu.in') || hostname.includes('lpu.co.in');
        const isDevelopment = !!(window as any).isDevelopment;
        
        return !isLocalhost && !isDevelopment && isLpuDomain;
      } catch (error) {
        console.warn('Production mode detection failed, defaulting to development:', error);
        return false;
      }
    }
  
    ngOnInit(): void {
      this.isMounted = true;
      this.loading = true;
      this.fetchfooter();
    }
  
    ngOnDestroy(): void {
      this.isMounted = false;
    }
  
  fetchfooter(): void {
    if (!this.isMounted) return;

    const endpoint = this.isProduction 
      ? 'https://includepages.lpu.in/newlpu/footer.php' 
      : 'https://includepages.lpu.in/newlpu/footer.php';
      // : '/api/footer';

    this.checkNetworkConnectivity()
      .pipe(
        timeout(this.apiTimeout),
        catchError((error) => {
          console.warn('Network connectivity check failed, proceeding with API call:', error);
          return of(true);
        })
      )
      .subscribe((isConnected) => {
        if (isConnected) {
          this.makeApiCall(endpoint);
        } else {
          this.showFallbackContent('Network connection unavailable');
        }
      });
  }

  private makeApiCall(endpoint: string): void {
    const headers = new HttpHeaders({
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    this.http.get(endpoint, { 
      responseType: 'text',
      headers,
      observe: 'response' 
    })
    .pipe(
      timeout(this.apiTimeout),
      catchError((error: HttpErrorResponse) => {
        this.handleApiError(error, endpoint);
        return of(null);
      }),
      finalize(() => {
        if (this.isMounted) {
          this.loading = false;
        }
      })
    )
    .subscribe((response) => {
      if (response && response.status === 200) {
        const html = response.body;
        if (html && html.trim()) {
          this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        } else {
          this.showFallbackContent('Empty response from server');
        }
      } else {
        this.showFallbackContent('Invalid response from server');
      }
    });
  }

  private handleApiError(error: HttpErrorResponse, endpoint: string): void {
    console.error('API call failed:', error);
    
    if (error.status === 0) {
      console.warn('Network error or CORS issue detected');
      this.showFallbackContent('Network error or CORS issue');
    } else if (error.status === 404) {
      console.warn('API endpoint not found');
      this.showFallbackContent('API endpoint not found');
    } else if (error.status === 403 || error.status === 401) {
      console.warn('Access denied');
      this.showFallbackContent('Access denied');
    } else if (error.error instanceof ErrorEvent) {
      console.warn('Client-side error:', error.error.message);
      this.showFallbackContent('Client-side error');
    } else {
      console.warn('Server returned code:', error.status, 'body was:', error.error);
      this.showFallbackContent('Server error');
    }
  }

  private showFallbackContent(reason: string): void {
    console.warn('Showing fallback content:', reason);
    this.footerHtml = this.sanitizer.bypassSecurityTrustHtml(this.fallbackHtml);
    this.error = true;
    
    // Add visual indicator for debugging
    if (isPlatformBrowser(this.platformId)) {
      const wrapper = document.getElementById('remote-footer-wrapper');
      if (wrapper) {
        wrapper.style.border = '2px solid red';
        wrapper.style.padding = '10px';
        wrapper.style.backgroundColor = '#fff8f8';
      }
    }
  }

  private checkNetworkConnectivity(): Observable<boolean> {
    return new Observable((observer) => {
      if (typeof window !== 'undefined' && 'connection' in window.navigator) {
        const connection = (window.navigator as any).connection;
        if (connection && connection.effectiveType) {
          observer.next(connection.effectiveType !== 'none');
          observer.complete();
          return;
        }
      }
      
      // Fallback: try to ping a reliable endpoint
      const testUrl = 'https://www.google.com/generate_204';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      fetch(testUrl, { signal: controller.signal })
        .then((response) => {
          clearTimeout(timeoutId);
          observer.next(response.status === 204);
          observer.complete();
        })
        .catch(() => {
          clearTimeout(timeoutId);
          observer.next(false);
          observer.complete();
        });
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

 

