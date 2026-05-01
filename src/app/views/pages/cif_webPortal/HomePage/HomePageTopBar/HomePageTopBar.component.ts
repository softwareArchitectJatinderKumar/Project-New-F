import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';

import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DOCUMENT } from '@angular/common';

import swal from 'sweetalert2';

@Component({
  selector: 'app-HomePageTopBar',
  templateUrl: './HomePageTopBar.component.html',
  styleUrls: ['./ResponsiveStyles.scss'],

})

export class HomePageTopBarComponent implements OnInit {
  @Output() facilitiesClicked = new EventEmitter<void>();
  serverUrl: any;
  onFacilitiesClick() {
    this.facilitiesClicked.emit();
  }

  constructor(
    private CIFwebService: LpuCIFWebService,
    private fb: FormBuilder,
    private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.checkScroll();
    this.GetAllEventDetails();
    this.serverUrl = 'https://files.lpu.in/umsweb/CIFDocuments/'
  }
  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at Following Address :',
      html: `
           <address>
            <div class="contact-text">
            Central Instrumentation Facility (CIF) <br/>
            Lovely Professional University <br/>
            Block-38, Room No.106 <br/>
            Jalandhar - Delhi G.T. Road, <br/>
             Phagwara, Punjab (India) - 144411 <br/>
            <a href="tel:+911824444021">+91 1824-444021</a><br>
            cif@lpu.co.in<br>
            </div>
           </address>`,
      icon: 'info'
    });


  }
  goto(val: any) {
    this.router.navigateByUrl(val);
  }

  testClick(a: any): void {
    const fileName = `${a}.pdf`;
    const fileUrl = `assets/CifDocumentsTemplates/${fileName}`;

    // Check if the file exists
    fetch(fileUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // console.error('File not found:', fileUrl);
          // alert('File not found');
        }
      })
      .catch(error => {
        // console.error('Error fetching the file:', error);
        alert('Error downloading file');
      });
  }



  menuIconChanged = false;
  isFixedNav = false;



  toggleMenuIcon(): void {
    this.menuIconChanged = !this.menuIconChanged;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkScroll();
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    this.checkScroll();
  }

  private checkScroll(): void {
    const y = window.scrollY || window.pageYOffset;
    const isIndexPage = document.body.classList.contains('index-page');
    const navWrapElement = document.getElementById('nest-nav-scroll');
    const navWrap = isIndexPage && navWrapElement ? navWrapElement.offsetTop : 100;

    if (window.innerWidth > 1030) {
      this.isFixedNav = y > navWrap;
    } else {
      this.isFixedNav = false;
    }
  }


  // added on 25-sep-25
  ColumnMode = ColumnMode; columns: any; loadingIndicator = false;
  chunkedEventsC: any[][] = [];
  // Error handling properties
  serverError = false;
  errorMessage = '';
  events = [];
  chunkedEvents: any[][] = [];
  allEvents: any = [];

  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce((acc, _, i) =>
      (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }

  GetAllEventDetails(): void {
    this.loadingIndicator = true;
    const startTime = new Date().getTime();
    this.CIFwebService.GetAllEventDetails().subscribe({
      next: response => {
        // Check if response has error flag from service
        if (response && response.error) {
          this.serverError = true;
          this.errorMessage = response.message || 'Data Server Connection error , Try again later';
          this.loadingIndicator = false;
          return;
        }

        if (response.item1 && response.item1.length > 0) {
          this.events = response.item1;
        } else {
          this.events = [];
        }
        // Update chunkedEvents after events are set
        this.chunkedEventsC = this.chunkArray(this.events, 3);
        this.allEvents = this.chunkedEventsC ? this.chunkedEventsC.flat() : [];
        const elapsed = new Date().getTime() - startTime;
        const remainingDelay = Math.max(2500 - elapsed, 0); // wait at least 2.5s

        setTimeout(() => {
          this.loadingIndicator = false;
        }, remainingDelay);
      },
      error: err => {
        this.loadingIndicator = false;
        this.serverError = true;
        this.errorMessage = 'Data Server Connection error , Try again later';
        console.error(err);
        // Fallback to static events and chunk them
        this.events = [];
        this.chunkedEventsC = this.chunkArray(this.events, 3);
      }
    });
  }


  goToEvent(eventId: number) {
    this.router.navigate(['', eventId]);
  }
}
