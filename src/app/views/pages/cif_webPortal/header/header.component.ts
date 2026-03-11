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
    this.loading = true;
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
    console.log('Fetching header from /api/header...');
    this.http.get('/api/header', { responseType: 'text' })
      .subscribe({
        next: (html) => {
          console.log('Header response received, length:', html ? html.length : 0);
          if (html && html.trim()) {
            this.headerHtml = this.sanitizer.bypassSecurityTrustHtml(html);
            setTimeout(() => this.reinitializeDropdowns(), 100);
            this.setupMutationObserver();
          } else {
            console.warn('Header response is empty');
            this.error = true;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching header:', err);
          this.error = true;
          this.loading = false;
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

      // Search icon click handler
      const searchButton = document.querySelector('#remote-header-wrapper #openSearch');
      if (searchButton && !(searchButton as any)._searchInitialized) {
        (searchButton as any)._searchInitialized = true;
        searchButton.addEventListener('click', (e) => {
          e.preventDefault();
          const topsearch = document.querySelector('#remote-header-wrapper .topsearch');
          if (topsearch) {
            topsearch.classList.add('open');
            const input = topsearch.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) {
              input.focus();
            }
          }
        });
      }

      // Close search button handler
      const closeSearch = document.querySelector('#remote-header-wrapper .close-search');
      if (closeSearch && !(closeSearch as any)._closeSearchInitialized) {
        (closeSearch as any)._closeSearchInitialized = true;
        closeSearch.addEventListener('click', (e) => {
          e.preventDefault();
          const topsearch = document.querySelector('#remote-header-wrapper .topsearch');
          if (topsearch) {
            topsearch.classList.remove('open');
          }
        });
      }

      // ESC key to close search
      document.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const topsearch = document.querySelector('#remote-header-wrapper .topsearch');
          if (topsearch && topsearch.classList.contains('open')) {
            topsearch.classList.remove('open');
          }
        }
      });
    }
  }
}

