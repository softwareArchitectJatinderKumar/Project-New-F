import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

export interface TopLink {
  label: string;
  href: string;
  active?: boolean;
  rel?: string;
}

export interface NavColumn {
  heading: string;
  headingHref?: string;
  links: { label: string; href: string; target?: string }[];
}

export interface NavItem {
  label: string;
  type: 'link' | 'simple' | 'mega';
  href?: string;
  children?: { label: string; href: string; target?: string }[];
  columns?: NavColumn[];
}

export interface StickyItem {
  tooltip: string;
  label: string;
  icon: string;
  href?: string;
  modal?: string;
}

@Component({
  selector: 'app-staticheader',
  templateUrl: './atop-header-new.html',
  styleUrls: ['./atop-header-new.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticHeaderComponent implements OnInit, AfterViewInit, OnDestroy {

  /* ── State ─────────────────────────────────────────── */
  isSticky        = false;
  mobileMenuOpen  = false;
  searchOpen      = false;
  stickyBarOpen   = false;
  callModalOpen   = false;
  callTab: 'now' | 'later' = 'now';
  activeNavIndex: number | null = null;

  /* ── Form values ────────────────────────────────────── */
  callPhone        = '';
  scheduleName     = '';
  schedulePhone    = '';
  scheduleProgramme = '';
  scheduleDate     = '';
  scheduleTime     = '';

  /* ── Announcement bar ──────────────────────────────── */
  announcements = [
    'Last chance to apply — Admissions closing soon!',
    'LPUNEST Scholarship Exam — Register Now',
    'LPU Ranked #1 Private University in India',
    'International Admissions Open for 2025-26',
  ];
  currentAnnouncement = 0;

  /* ── Private timers ─────────────────────────────────── */
  private announcementTimer: any;
  private hoverTimer: any;
  private stickyShownCount = 0;

  /* ═══════════════════════════════════════════════════
     TOP LINKS DATA
  ═══════════════════════════════════════════════════ */
  topLinks: TopLink[] = [
    { label: 'JOBS',                    href: 'https://www.lpu.in/jobs/' },
    { label: 'HAPPENINGS',              href: 'https://happenings.lpu.in/' },
    { label: 'CONFERENCES',             href: 'https://www.lpu.in/conferences/' },
    { label: 'STUDY ABROAD',            href: 'https://www.lpu.in/international-relations/' },
    { label: 'LPUNEST',                 href: '//www.lpu.in/nest/', active: true },
    { label: 'INTERNATIONAL ADMISSIONS',href: 'https://www.lpu.in/international/' },
    { label: 'ONLINE EDUCATION',        href: 'https://www.lpuonline.com/' },
    { label: 'DISTANCE EDUCATION',      href: 'https://www.lpude.in/' },
    { label: 'CONTACT',                 href: 'https://www.lpu.in/contact-us/contact-us.php' },
  ];

  /* ═══════════════════════════════════════════════════
     MAIN NAV DATA
  ═══════════════════════════════════════════════════ */
  navItems: NavItem[] = [
    {
      label: 'ABOUT', type: 'simple',
      children: [
        { label: 'Overview',               href: 'https://www.lpu.in/about-lpu/' },
        { label: 'Infrastructure',         href: 'https://www.lpu.in/about-lpu/infrastructure.php' },
        { label: 'Accreditations',         href: 'https://www.lpu.in/about-lpu/accreditation.php' },
        { label: 'Rankings',               href: 'https://www.lpu.in/about-lpu/ranking.php' },
        { label: 'Placements',             href: 'https://www.lpu.in/placements.php' },
        { label: 'Alumni',                 href: '//alumni.lpu.in/' },
        { label: 'Leadership',             href: 'https://www.lpu.in/about-lpu/#leadership' },
        { label: 'Organization Structure', href: 'https://www.lpu.in/about-lpu/organization-structure.php' },
        { label: 'Location',               href: 'https://www.lpu.in/admission/lpu-in-your-town.php' },
        { label: 'Tour LPU',              href: 'https://iviewd.com/lpu2/', target: '_blank' },
      ],
    },
    {
      label: 'ADMISSIONS', type: 'mega',
      columns: [
        {
          heading: 'Admissions', headingHref: 'https://www.lpu.in/admission/admissions.php',
          links: [
            { label: 'Overview',        href: 'https://www.lpu.in/admission/admissions.php' },
            { label: 'All Programmes',  href: 'https://www.lpu.in/programmes/all/' },
            { label: 'Fee Structure',   href: 'https://www.lpu.in/admission/fee-structure.php' },
            { label: 'Scholarship',     href: 'https://www.lpu.in/admission/scholarship.php' },
            { label: 'How to Apply',    href: 'https://www.lpu.in/admission/how-to-apply.php' },
            { label: 'Important Dates', href: 'https://www.lpu.in/admission/important-dates.php' },
          ],
        },
        {
          heading: 'LPUNEST', headingHref: 'https://www.lpu.in/nest/',
          links: [
            { label: 'About LPUNEST',  href: 'https://www.lpu.in/nest/' },
            { label: 'Exam Pattern',   href: 'https://www.lpu.in/nest/exam-pattern.php' },
            { label: 'Sample Papers',  href: 'https://www.lpu.in/nest/sample-papers.php' },
            { label: 'Results',        href: 'https://www.lpu.in/nest/results.php' },
          ],
        },
        {
          heading: 'International', headingHref: 'https://www.lpu.in/international/',
          links: [
            { label: 'Overview',          href: 'https://www.lpu.in/international/' },
            { label: 'Language Req.',     href: 'https://www.lpu.in/international/english-language.php' },
            { label: 'Scholarship',       href: 'https://www.lpu.in/international/scholarship.php' },
            { label: 'How to Apply',      href: 'https://www.lpu.in/international/how-to-apply.php' },
          ],
        },
        {
          heading: 'Online Education', headingHref: 'https://www.lpuonline.com/',
          links: [
            { label: 'Programmes', href: 'https://www.lpuonline.com/' },
            { label: 'Apply Now',  href: 'https://admission.lpuonline.com/' },
          ],
        },
        {
          heading: 'Distance Education', headingHref: 'https://www.lpude.in/',
          links: [
            { label: 'About',              href: 'https://www.lpude.in/' },
            { label: 'Programmes',         href: 'https://www.lpude.in/admissions/overview.php' },
            { label: 'Enquire Now',        href: 'https://www.lpude.in/contact-us/contact-us.php' },
          ],
        },
      ],
    },
    {
      label: 'ACADEMICS', type: 'mega',
      columns: [
        {
          heading: 'Academics @LPU',
          links: [
            { label: 'Overview',                href: 'https://www.lpu.in/academics/' },
            { label: 'Faculty',                 href: 'https://www.lpu.in/faculty/' },
            { label: 'Live Projects',           href: 'https://www.lpu.in/academics/live-projects.php' },
            { label: 'Industry Immersion',      href: 'https://www.lpu.in/academics/industry-immersion.php' },
            { label: 'Interdisciplinary Minors',href: 'https://www.lpu.in/academics/Interdisciplinary-minors.php' },
            { label: 'Curriculum Innovations',  href: 'https://www.lpu.in/academics/curriculum-innovations.php' },
            { label: 'Guest Lectures',          href: 'https://www.lpu.in/academics/guest-lectures.php' },
          ],
        },
        {
          heading: 'Schools',
          links: [
            { label: 'School of Engineering',       href: 'https://www.lpu.in/schools/engineering/' },
            { label: 'School of Business',          href: 'https://www.lpu.in/schools/business/' },
            { label: 'School of Law',               href: 'https://www.lpu.in/schools/law/' },
            { label: 'School of Agriculture',       href: 'https://www.lpu.in/schools/agriculture/' },
            { label: 'School of Design',            href: 'https://www.lpu.in/schools/design/' },
            { label: 'School of Hotel Management',  href: 'https://www.lpu.in/schools/hotel-management/' },
          ],
        },
      ],
    },
    {
      label: 'CAMPUS LIFE', type: 'mega',
      columns: [
        {
          heading: 'Life at LPU',
          links: [
            { label: 'Overview',              href: 'https://www.lpu.in/campus-life/' },
            { label: 'Sports & Fitness',      href: 'https://www.lpu.in/campus-life/sports.php' },
            { label: 'Festivals & Events',    href: 'https://www.lpu.in/campus-life/festivals.php' },
            { label: 'Clubs & Societies',     href: 'https://www.lpu.in/campus-life/clubs.php' },
            { label: 'Diversity',             href: 'https://www.lpu.in/campus-life/diversity.php' },
            { label: 'Inclusivity',           href: 'https://www.lpu.in/spinal-cord-injury.php' },
            { label: 'On Campus Jobs',        href: 'https://www.lpu.in/campus-life/on-campus-jobs.php' },
            { label: 'Student Ambassadors',   href: 'https://www.lpu.in/student-ambassadors/' },
          ],
        },
        {
          heading: 'Student Services',
          links: [
            { label: 'Campus Security',      href: 'https://www.lpu.in/student-services/security.php' },
            { label: 'Uni Health Centre',    href: 'https://www.lpu.in/student-services/healthcare.php' },
            { label: 'UMS',                  href: 'https://www.lpu.in/student-services/ums.php' },
            { label: 'Residential Facilities',href: 'https://www.lpu.in/student-services/residence.php' },
            { label: 'Transportation',       href: 'https://www.lpu.in/student-services/transport.php' },
            { label: 'Shopping & Dining',    href: 'https://www.lpu.in/student-services/shopping-dining.php' },
            { label: 'Education Loan',       href: 'https://www.lpu.in/student-services/education-loan-assistance.php' },
          ],
        },
      ],
    },
    {
      label: 'PLACEMENTS',
      type: 'link',
      href: 'https://www.lpu.in/placements.php',
    },
    {
      label: 'RESEARCH', type: 'simple',
      children: [
        { label: 'Overview',       href: 'https://www.lpu.in/academics/research.php' },
        { label: 'Collaborations', href: 'https://www.lpu.in/academics/research/collaborations.php' },
      ],
    },
  ];

  /* ═══════════════════════════════════════════════════
     STICKY BAR DATA
  ═══════════════════════════════════════════════════ */
  stickyItems: StickyItem[] = [
    {
      tooltip: 'Virtual Tour', label: 'Virtual Tour',
      icon: 'https://www.lpu.in/lpu-assets/images/icons/360-view-w.svg',
      href: 'https://iviewd.com/lpu2/',
    },
    {
      tooltip: 'Schedule a Call', label: 'Schedule a Call',
      icon: 'https://www.lpu.in/lpu-assets/images/icons/phone-full.svg',
      modal: 'call',
    },
    {
      tooltip: 'Whatsapp', label: 'Whatsapp',
      icon: 'https://www.lpu.in/lpu-assets/images/icons/whatsapp-white.svg',
      href: 'https://api.whatsapp.com/send?phone=+919852569000&text=Hi%2C%20I%20need%20assistance%20for%20Admission%20at%20LPU.',
    },
    {
      tooltip: 'Live Video Counselling', label: 'Live Video Counselling',
      icon: 'https://www.lpu.in/lpu-assets/images/icons/live-video.svg',
      modal: 'video',
    },
    {
      tooltip: 'LPU Office in your City', label: 'LPU Office in your City',
      icon: 'https://www.lpu.in/lpu-assets/images/icons/town.svg',
      href: '//www.lpu.in/admission/lpu-in-your-town.php',
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  /* ── Remote header HTML ─────────────────────────── */
  trustedHeaderHtml: SafeHtml | null = null;
  private headerSub?: Subscription;
  @ViewChild('remoteFrame', { static: false }) remoteFrame?: ElementRef<HTMLIFrameElement>;
  iframeVisible = true;
  showHtmlContainer = false;

  /* ── Lifecycle ───────────────────────────────────── */
  ngOnInit(): void {
    // Load remote header HTML (dynamic header)
    // attempt iframe first; HTTP fallback will be triggered if iframe blocked

    this.announcementTimer = setInterval(() => {
      this.currentAnnouncement = (this.currentAnnouncement + 1) % this.announcements.length;
      this.cdr.markForCheck();
    }, 3000);

    // Auto-show sticky bar twice on desktop
    if (window.innerWidth > 992) {
      setTimeout(() => this.triggerStickyOnce(), 600);
      const scrollOnce = () => {
        this.triggerStickyOnce();
        window.removeEventListener('scroll', scrollOnce);
      };
      window.addEventListener('scroll', scrollOnce, { passive: true });
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.announcementTimer);
    clearTimeout(this.hoverTimer);
    if (this.headerSub) this.headerSub.unsubscribe();
  }

  ngAfterViewInit(): void {
    // If iframe is present, attach load/error handlers and a fallback timer
    setTimeout(() => {
      const frame = this.remoteFrame?.nativeElement;
      if (!frame) {
        // no iframe available - try HTTP fallback
        this.triggerHttpFallback();
        return;
      }

      let loaded = false;

      const onLoad = () => {
        loaded = true;
        // iframe loaded; keep visible
        this.iframeVisible = true;
        this.showHtmlContainer = false;
        this.cdr.markForCheck();
      };

      const onError = () => {
        loaded = false;
        this.triggerHttpFallback();
      };

      frame.addEventListener('load', onLoad);
      frame.addEventListener('error', onError);

      // If iframe load doesn't fire within X ms, assume blocked or slow and fallback
      setTimeout(() => {
        if (!loaded) {
          this.triggerHttpFallback();
        }
      }, 5000); // increased wait to allow slower connections
    }, 0);
  }

  private triggerHttpFallback(): void {
    // hide iframe and show HTML container; attempt to fetch HTML
    this.iframeVisible = false;
    this.showHtmlContainer = true;
    this.cdr.markForCheck();
    this.loadRemoteHeader();
  }

  private loadRemoteHeader(): void {
    const url = 'https://includepages.lpu.in/newlpu/header.php';
    const base = 'https://includepages.lpu.in/newlpu/';
    try {
      this.headerSub = this.http.get(url, { responseType: 'text' }).subscribe(
        (html) => {
          try {
            // Parse HTML and rewrite relative asset URLs to absolute ones
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Fix link[href], img[src], script[src] to absolute URLs where needed
            const fixAttr = (selector: string, attr: string) => {
              const els = Array.from(doc.querySelectorAll(selector)) as Element[];
              els.forEach(el => {
                const val = el.getAttribute(attr);
                if (val && !/^https?:\/\//i.test(val) && !val.startsWith('//')) {
                  const abs = new URL(val, base).href;
                  el.setAttribute(attr, abs);
                } else if (val && val.startsWith('//')) {
                  el.setAttribute(attr, window.location.protocol + val);
                }
              });
            };

            fixAttr('link', 'href');
            fixAttr('img', 'src');
            fixAttr('a', 'href');
            fixAttr('script', 'src');

            // Collect external scripts (with src) so we can load them dynamically
            const scriptEls = Array.from(doc.querySelectorAll('script[src]')) as HTMLScriptElement[];
            const scriptSrcs = scriptEls.map(s => s.getAttribute('src')!).filter(Boolean);

            // Remove script tags from the HTML to avoid inline execution when setting innerHTML
            scriptEls.forEach(s => s.remove());

            // Inject stylesheet links from fetched doc.head into our document.head
            const headLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]')) as HTMLLinkElement[];
            headLinks.forEach(link => {
              try {
                const href = link.getAttribute('href');
                if (!href) return;
                const abs = /^https?:\/\//i.test(href) || href.startsWith('//') ? (href.startsWith('//') ? window.location.protocol + href : href) : new URL(href, base).href;
                // avoid duplicates
                if (!document.querySelector(`link[href="${abs}"]`)) {
                  const newLink = document.createElement('link');
                  newLink.rel = 'stylesheet';
                  newLink.href = abs;
                  document.head.appendChild(newLink);
                }
              } catch (e) {
                console.warn('Failed to inject stylesheet link', link, e);
              }
            });

            // Inject inline <style> tags from fetched doc into our document.head
            const styleEls = Array.from(doc.querySelectorAll('style')) as HTMLStyleElement[];
            styleEls.forEach(s => {
              try {
                const newStyle = document.createElement('style');
                newStyle.type = 'text/css';
                newStyle.textContent = s.textContent || '';
                document.head.appendChild(newStyle);
              } catch (e) {
                console.warn('Failed to inject inline style', e);
              }
            });

            const bodyHtml = doc.body.innerHTML;

            // Trust the sanitized HTML (scripts will be loaded separately)
            this.trustedHeaderHtml = this.sanitizer.bypassSecurityTrustHtml(bodyHtml);
            this.cdr.markForCheck();

            // Dynamically load external scripts sequentially to preserve order
            (async () => {
              for (const src of scriptSrcs) {
                try {
                  await new Promise<void>((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = src;
                    s.async = false;
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error('Failed to load script ' + src));
                    document.body.appendChild(s);
                  });
                } catch (e) {
                  console.warn('Failed to load remote header script', src, e);
                }
              }
            })();

          } catch (e) {
            console.error('Error processing remote header HTML', e);
            // fallback: set raw html
            this.trustedHeaderHtml = this.sanitizer.bypassSecurityTrustHtml(html);
            this.cdr.markForCheck();
          }
        },
        (err) => {
          console.error('Failed to load remote header from', url, err);
        }
      );
    } catch (e) {
      console.error('Exception while requesting remote header', e);
    }
  }

  /* ── Scroll ──────────────────────────────────────── */
  @HostListener('window:scroll', [])
  onScroll(): void {
    const was = this.isSticky;
    this.isSticky = window.scrollY > 1;
    if (was !== this.isSticky) this.cdr.markForCheck();
  }

  /* ── ESC closes overlays ─────────────────────────── */
  @HostListener('document:keyup', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.closeSearch();
      this.closeCallModal();
      if (this.mobileMenuOpen) this.closeMobileMenu();
    }
  }

  /* ── Announcement ────────────────────────────────── */
  prevAnnouncement(): void {
    this.currentAnnouncement =
      (this.currentAnnouncement - 1 + this.announcements.length) % this.announcements.length;
  }
  nextAnnouncement(): void {
    this.currentAnnouncement = (this.currentAnnouncement + 1) % this.announcements.length;
  }

  /* ── Mobile drawer ───────────────────────────────── */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
    this.cdr.markForCheck();
  }
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  /* ── Search ──────────────────────────────────────── */
  openSearch(): void {
    this.searchOpen = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }
  closeSearch(): void {
    this.searchOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  /* ── Desktop nav hover ───────────────────────────── */
  onNavEnter(i: number): void {
    if (window.innerWidth <= 991) return;
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      this.activeNavIndex = i;
      this.cdr.markForCheck();
    }, 100);
  }

  onNavLeave(i: number): void {
    if (window.innerWidth <= 991) return;
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      if (this.activeNavIndex === i) {
        this.activeNavIndex = null;
        this.cdr.markForCheck();
      }
    }, 180);
  }

  /* ── Mobile nav tap ──────────────────────────────── */
  toggleMobileNav(i: number): void {
    if (window.innerWidth > 991) return;
    this.activeNavIndex = this.activeNavIndex === i ? null : i;
    this.cdr.markForCheck();
  }

  /* ── Sticky bar ──────────────────────────────────── */
  private triggerStickyOnce(): void {
    if (this.stickyShownCount >= 2) return;
    this.stickyBarOpen = true;
    this.stickyShownCount++;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.stickyBarOpen = false;
      this.cdr.markForCheck();
    }, 2000);
  }

  onStickyHover(open: boolean): void {
    this.stickyBarOpen = open;
    this.cdr.markForCheck();
  }

  /* ── Call modal ──────────────────────────────────── */
  openCallModal(tab: 'now' | 'later' = 'now'): void {
    this.callTab = tab;
    this.callModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }
  closeCallModal(): void {
    this.callModalOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  handleStickyItemClick(item: StickyItem): void {
    if (item.modal === 'call') this.openCallModal('later');
  }

  /* ── Form submits ────────────────────────────────── */
  submitCallNow(): void {
    // TODO: wire to actual API
    // console.log('Call now:', this.callPhone);
  }
  submitScheduleCall(): void {
    // TODO: wire to actual API
    // console.log('Schedule call:', { name: this.scheduleName, phone: this.schedulePhone });
  }

  /* ── Template helpers ────────────────────────────── */
  isMegaMenu(item: NavItem): boolean  { return item.type === 'mega';   }
  isSimpleMenu(item: NavItem): boolean { return item.type === 'simple'; }
  isLink(item: NavItem): boolean       { return item.type === 'link';   }
  trackByIndex(i: number): number      { return i; }
}