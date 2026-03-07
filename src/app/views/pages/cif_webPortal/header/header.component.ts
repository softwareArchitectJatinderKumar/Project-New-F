import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  headerHtml: SafeHtml | null = null;
  loading: boolean = true;
  error: boolean = false;
  isMounted: boolean = false;
  private observer: MutationObserver | null = null;

  constructor(
    private http: HttpClient, 
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isMounted = true;
    this.fetchHeader();
  }

  ngOnDestroy(): void {
    this.isMounted = false;
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  ngAfterViewInit(): void {
    // Reinitialize dropdowns after view is rendered
  }

  fetchHeader(): void {
    // Using /api/remote-header which proxies to https://includepages.lpu.in/newlpu/header.php
    // This matches the React RemoteHeader component's endpoint
    this.http.get('/api/remote-header', { responseType: 'text' })
      .pipe(
        catchError((err) => {
          console.error('Proxy Error Details:', err);
          this.error = true;
          return of('');
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(html => {
        if (html) {
          this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
          // Reinitialize dropdowns after HTML is rendered
          setTimeout(() => this.reinitializeDropdowns(), 100);
          // Also set up a MutationObserver to handle any dynamically added dropdowns
          this.setupMutationObserver();
        }
      });
  }

  private setupMutationObserver(): void {
    if (isPlatformBrowser(this.platformId)) {
      const targetNode = document.getElementById('remote-header-wrapper');
      if (targetNode) {
        this.observer = new MutationObserver((mutations) => {
          this.reinitializeDropdowns();
        });
        this.observer.observe(targetNode, { childList: true, subtree: true });
      }
    }
  }

  private reinitializeDropdowns(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Add hover handlers for nav-items (LPU uses .nav-item, not .dropdown)
      const navItems = document.querySelectorAll('#remote-header-wrapper .nav-item');
      navItems.forEach((navItem: Element) => {
        // Check if event listeners are already added to avoid duplicates
        if ((navItem as any)._hoverInitialized) {
          return;
        }
        (navItem as any)._hoverInitialized = true;
        
        // Mouse enter - show dropdown
        navItem.addEventListener('mouseenter', () => {
          navItem.classList.add('show');
        });
        
        // Mouse leave - hide dropdown
        navItem.addEventListener('mouseleave', () => {
          navItem.classList.remove('show');
        });
      });

      // Also handle click events for dropdown toggle icons
      const toggleIcons = document.querySelectorAll('#remote-header-wrapper .dropdown-toggle-icon');
      toggleIcons.forEach((toggle: Element) => {
        if ((toggle as any)._clickInitialized) {
          return;
        }
        (toggle as any)._clickInitialized = true;
        
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const parent = toggle.parentElement;
          if (parent && parent.classList.contains('nav-item')) {
            parent.classList.toggle('show');
          }
        });
      });
    }
  }
}
