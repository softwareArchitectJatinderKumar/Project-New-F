import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Inject, NgZone, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DOCUMENT } from '@angular/common';

import swal from 'sweetalert2';
@Component({
  selector: 'app-HomePage',
  templateUrl: './HomePage.component.html',
  styleUrls: ['./HomePage.component.scss'],
})
export class HomePageComponent implements OnInit {

  ngOnDestroy(): void {
    for (const url of this.preloadedObjectUrls.values()) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    this.preloadedObjectUrls.clear();
    this.preloadedImageUrls.clear();
  }
  @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

  gotoFacilities() {
    this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  ResultData: any[] = []; currentPage = 1; itemsPerPage = 10; InstrumentsDataData: any[] = [];
  tmpsInstrumentsDataData: any[] = []; tmpsResultData: any[] = [];
  InstrumentId: any; instrumentName: any = ''; UserRole: any; UserId: any; uploadEnabled: boolean; Remarks: any; dataSource: any;
  Description: any; ImageUrl: any;
  ColumnMode = ColumnMode; columns: any; loadingIndicator = false; headHtmlData: any[] = []; p: any = 1; perPage: any = 5;
  @ViewChild('table') table: ElementRef;

  areFacilityImagesLoaded: boolean = false;
  private preloadedImageUrls: Set<string> = new Set<string>();
  private preloadedObjectUrls: Map<string, string> = new Map<string, string>();
  private fallbackDataUrl: string = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="20">No Image</text></svg>';
  private failedImageUrls: string[] = [];

  ServerUrl: any; isLoading: boolean = true; loadedCount: number = 0;
  serverError = false;
  errorMessage = '';

  constructor(
    private CIFwebService: LpuCIFWebService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(DOCUMENT) document: Document,
    private router: Router,
    private route: ActivatedRoute) { }

  private fetchAndDecodeImages(imageUrls: string[], setFlag: boolean = true): Promise<void> {
    const validUrls = (imageUrls || []).filter(url => !!url && !this.preloadedImageUrls.has(url));

    if (validUrls.length === 0) {
      if (setFlag) {
        this.ngZone.run(() => this.areFacilityImagesLoaded = true);
      }
      return Promise.resolve();
    }

    const promises = validUrls.map(url =>
      fetch(url, { cache: 'force-cache' })
        .then(res => {
          if (!res.ok) throw new Error('fetch failed');
          return res.blob();
        })
        .then(blob => {
          const objUrl = URL.createObjectURL(blob);
          this.preloadedObjectUrls.set(url, objUrl);
          const img = new Image();
          img.src = objUrl;
          const decodePromise: Promise<void> = (img as any).decode
            ? (img as any).decode()
            : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });
          return decodePromise.finally(() => { });
        })
        .catch(() => {
          this.failedImageUrls.push(url);
          console.warn('Failed to prefetch image', url);
          return null;
        })
        .then(() => { this.preloadedImageUrls.add(url); })
    );

    return Promise.all(promises).then(() => {
      if (setFlag) {
        this.ngZone.run(() => { this.areFacilityImagesLoaded = true; });
      }
    });
  }

  ngOnInit(): void {
    const fallbackUrls = this.DataItems.map(i => i.imageUrl).filter(u => !!u);
    this.fetchAndDecodeImages(fallbackUrls, false).catch(() => {/* ignore */ });

    this.getAllInstruments();
    this.chunkedEvents = this.chunkArray(this.events, 3);
    this.updateChunks();
  }

  onImageTagError(event: Event, item: any): void {
    const img = event.target as HTMLImageElement;
    const cached = item && item.cachedImageUrl ? item.cachedImageUrl : undefined;
    if (cached && img.src !== cached) {
      img.src = cached;
      return;
    }
    if (img.src !== this.fallbackDataUrl) {
      img.src = this.fallbackDataUrl;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateChunks();
  }

  updateChunks() {
    const width = window.innerWidth;
    let itemsPerSlide = 3;

    if (width < 768) {
      itemsPerSlide = 1;
    } else if (width < 992) {
      itemsPerSlide = 2;
    }
    const groups = [];
    if (this.events) {
      for (let i = 0; i < this.events.length; i += itemsPerSlide) {
        groups.push(this.events.slice(i, i + itemsPerSlide));
      }
    }
    this.chunkedEvents = groups;
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
          Phone : <a href="tel:+911824444021">+91 1824-444021</a><br>
          Email : cif@lpu.co.in<br>
          </div>
           </address>`,
      icon: 'info'
    });
  }

  goto(val: any): void {
    this.router.navigateByUrl(val);
  }

  VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
    this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
  }

  DataItems = [
    {
      "id": 1,
      "instrumentId": 0,
      "instrumentName": "Field Emission Scanning Electron Microscope, FESEM JEOL JSM-7610F-PLUS",
      "categoryId": 1,
      "isActive": true,
      "description": "The Jeol field emission scanning electron microscope is a versatile high resolution scanning electron microscope. This Machine combines two proven technologies – an electron column with semi-in-lens objective lens which can provide high resolution imaging by low accelerating voltage and an in-lens Schottky FEG which can provide stable large probe current – to deliver ultrahigh resolution with wide range of probe currents for all applications (A few pA to more than 200 nA). The in-lens Schottky FEG is a combination of a Schottky FEG and the first condenser lens and is designed to collect the electrons from the emitter efficiently. The Gentle Beam (GB) mode applies a negative voltage to a specimen and decelerates incident electrons just before they irradiate the specimen, thus the resolution is improved at an extremely low accelerating voltage. Therefore, this instrument is possible to observe a topmost surface by a few hundred eV which were difficult to observe conventionally and nonconductive samples \r\nsuch as ceramics and semiconductor etc. The High-Power Optics produces fine electron probe for both observation and analysis. The aperture angle control lens maintains a small probe diameter even at a larger probe current. Using both techniques, the machine is suitable for a wide variety of analysis with EDS.\r\nApart from giving the high resolution surface morphological images, this machine also has the analytical capabilities such as detecting the presence of elements down to boron (B) on any solid conducting materials through the energy dispersive X-ray spectrometry (EDX) providing crystalline information from the few nano meter depth of the material surface via electron back scattered detection (BSD) system attached with microscope. ",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_23899918_2_2025_100006_FESEM-Instrument.JPG"
    },
    {
      "id": 2,
      "instrumentId": 0,
      "instrumentName": "Powder XRD (Bruker D8 Advance)",
      "categoryId": 2,
      "isActive": true,
      "description": "This Bruker equipment benchmark when it comes to extracting structural information from X-Ray Powder Diffraction including Rietveld (TOPAS) analysis, \"total\" scattering (PDF analysis), and Small Angle X-Ray Scattering (SAXS). \r\n\r\nMonochromatic Ka1 radiation with Johansson monochromators for Co, Cu and Mo radiation Highest intensity with focusing Göbel mirrors for Cr, Co, Cu, Mo and Ag radiation.\r\nDynamic Beam Optimization\r\nDynamic Beam Optimization (DBO) provides best in class powder diffraction data by setting new benchmarks in terms of counting statistics and peak-to-background ratio, all without the need for manual instrument reconfiguration.\r\n\r\nThe high-speed energy-dispersive LYNXEYE XE-T detector uniquely combines fast data collection with unprecedented filtering of fluorescence and Kß radiation. Its proprietary Variable Active Detector Window and the Motorized Anti-Scatter Screen (MASS) enable data collection from lowest 2? angles without parasitic low-angle background scattering, in particular air scattering. The fully automated MASS retraction avoids beam cropping, even in combination with continuously variable slits that provide superb counting statistics over the whole angular range.\r\n•\tSuperb counting statistics allows for faster data collection and increased sample throughput\r\n•\tNo parasitic low-angle background scattering massively improves data quality of pharma, clay, zeolite and other samples having a large unit cell\r\n•\tBest peak-to-background enhances sensitivity for minor phases\r\n•\tFull quantification of crystalline and amorphous phases with DIFFRACTOPAS\r\n",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_2005552723_2_2025_100009_XRD-Instrument.JPG"
    },
    {
      "id": 3,
      "instrumentId": 0,
      "instrumentName": "FTIR with Diamond ATR & Pellet accessories (Perkin Elmer Spectrum 2)",
      "categoryId": 3,
      "isActive": true,
      "description": "In Infrared spectroscopy or vibrational spectroscopy is used to study the chemical composition of a sample.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_926534728_2_2025_100014_FTIR-Instrument.JPG"
    },
    {
      "id": 4,
      "instrumentId": 0,
      "instrumentName": "Fluorescence Spectrometer (Perkin Elmer LS6500)",
      "categoryId": 4,
      "isActive": true,
      "description": "Fluorescence spectrophotometry is a technique that analyze the state of sample.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1449097689_2_2025_100011_Flourescence-Instrument.JPG"
    },
    {
      "id": 5,
      "instrumentId": 0,
      "instrumentName": "Thermogravimetric analyzer (Perkin Elmer TGA 4000)",
      "categoryId": 5,
      "isActive": true,
      "description": "Thermogravimetric analysis is an equipment that measures the change in weight and hence mass of a sample.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_543001469_2_2025_100012_TGA-Instrument.JPG"
    },
    {
      "id": 6,
      "instrumentId": 0,
      "instrumentName": "Differential scanning calorimeter (Perkin Elmer DSC 6000)",
      "categoryId": 6,
      "isActive": true,
      "description": "Differential Scanning Calorimetry is a thermal analysis technique.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1507892084_2_2025_100013_DSC-Instrument.JPG"
    },
    {
      "id": 9,
      "instrumentId": 0,
      "instrumentName": "Gas Chromatography and Mass Spectroscopy, Shimadzu GCMS TQ8040 NX",
      "categoryId": 7,
      "isActive": true,
      "description": "The Gas Chromatograph - Mass Spectrometer, Shimadzu is Equipped with an ion source.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_2009182246_2_2025_100008_GCMS-Instrument.JPG"
    },
    {
      "id": 10,
      "instrumentId": 0,
      "instrumentName": "High Performance and Liquid Chromatography, Shimadzu Prominence LPGE",
      "categoryId": 8,
      "isActive": true,
      "description": "This Shimadzu equipment is used in the analysis of pharmaceutical, toxicological, environmental, and biological samples.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_34620374_2_2025_100007_HPLC-Instrument.JPG"
    },
    {
      "id": 11,
      "instrumentId": 0,
      "instrumentName": "Electrochemical workstation, Metrohm: Multi-Channel Autolab AUT.MAC.204",
      "categoryId": 9,
      "isActive": true,
      "description": "Metrohum is a multi-channel Potentiostat/galvanostat which is useful in electrochemical measurements.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1060204202_3_2026_100000_ADP_2248.JPG"
    },
    {
      "id": 14,
      "instrumentId": 0,
      "instrumentName": "Viscometer (LABMAN model of LMDV-200)",
      "categoryId": 12,
      "isActive": true,
      "description": "This Labman machine is Rotational Digital Direct Reading Viscometer.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_696381150_2_2025_100001_ADP_2298---.JPG"
    },
    {
      "id": 15,
      "instrumentId": 0,
      "instrumentName": "Particle size and Zeta potential analyzer (Malverrn Zetasizer Nano ZS90)",
      "categoryId": 13,
      "isActive": true,
      "description": "Light scattering is a fundamental analytical technique for the characterization of particulate materials.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_284316046_2_2025_100010_Particle_Size-Instrument.JPG"
    },
    {
      "id": 21,
      "instrumentId": 0,
      "instrumentName": "Shimadzu UV-1800 UV-Vis",
      "categoryId": 14,
      "isActive": true,
      "description": "The UV-1800 is an advanced high-resolution spectrophotometer.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_1208223655_17_2025_100004_-14-UV.JPG"
    },
    {
      "id": 22,
      "instrumentId": 0,
      "instrumentName": "ICP-OES, PerkinElmer Optima 8000",
      "categoryId": 15,
      "isActive": true,
      "description": "The Optima 8000 is a bench-top, dual-view ICP-OES with full-wavelength-range CCD array detector.",
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_323568347_3_2025_100005_ICP-OES-Instrument-21.jpg"
    },
    {
      "id": 23,
      "instrumentId": 0,
      "instrumentName": "Distilled Water (milli-Q water)",
      "categoryId": 0,
      "isActive": true,
      "description": null,
      "imageUrl": "https://files.lpu.in/umsweb/CIFDocuments/Instrument_507378691_3_2025_100015_noImage.jpg"
    }
  ];

  getAllInstruments(): void {
    this.loadingIndicator = true;
    this.areFacilityImagesLoaded = false;
    const startTime = new Date().getTime();

    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: response => {
        if (response.item1 && response.item1.length > 0) {
          this.InstrumentsDataData = response.item1;
          this.tmpsInstrumentsDataData = response.item1.slice(0, this.InstrumentsDataData.length);
          console.log('Fetched instruments data:', this.tmpsInstrumentsDataData);
        } else {
          this.InstrumentsDataData = this.DataItems;
          this.tmpsInstrumentsDataData = this.InstrumentsDataData.slice(0, this.InstrumentsDataData.length);
        }
        const imageUrls = this.tmpsInstrumentsDataData.map(item => item.imageUrl);
        this.fetchAndDecodeImages(imageUrls, true).then(() => {
          this.tmpsInstrumentsDataData = this.tmpsInstrumentsDataData.map(item => ({
            ...item,
            cachedImageUrl: this.preloadedObjectUrls.get(item.imageUrl) || undefined
          }));
          const elapsed = new Date().getTime() - startTime;
          const remainingDelay = Math.max(2500 - elapsed, 0);
          setTimeout(() => {
            this.loadingIndicator = false;
          }, remainingDelay);
        });
      },
      error: err => {
        this.InstrumentsDataData = this.DataItems;
        this.tmpsInstrumentsDataData = this.InstrumentsDataData.slice(0, this.InstrumentsDataData.length);

        const imageUrls = this.tmpsInstrumentsDataData.map(item => item.imageUrl);
        this.fetchAndDecodeImages(imageUrls, true).then(() => {
          this.tmpsInstrumentsDataData = this.tmpsInstrumentsDataData.map(item => ({
            ...item,
            cachedImageUrl: this.preloadedObjectUrls.get(item.imageUrl) || undefined
          }));
          const elapsed = new Date().getTime() - startTime;
          const remainingDelay = Math.max(2500 - elapsed, 0);
          setTimeout(() => {
            this.loadingIndicator = false;
          }, remainingDelay);
        });

        this.serverError = true;
        this.errorMessage = 'Data Server Connection error , Try again later';
        console.error(err);
      }
    });
  }

  chunkedEvents: any[][] = [];

  chunkArray(arr: any[], size: number): any[][] {
    return arr.reduce((acc, _, i) =>
      (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }

  serverUrl: any = 'https://www.lpu.in/lpu-assets/images/cif/';
  events = [
    {
      img: 'Advanced-Materials-Characterization.webp',
      title: 'Short Term Course on Advanced Materials and Characterization: Theory & Applications',
      date: '(03 November - 07 November, 2025)'
    },
    {
      img: 'summer-training-programme-2025.webp',
      title: 'ANRF Sponsored Summer Training Programme',
      date: '(2 June - 11 July 2025)'
    },
    {
      img: 'event-10.jpg',
      title: 'Discovering the Crystalline and Nano world using X-ray Diffraction and Particle Size and Zeta Potential Analyzer: A National Workshop',
      date: '(24 - 26 April 2025)'
    },
    {
      img: 'event-9.jpg',
      title: 'National Workshop on Advance Research with Field Emission Scanning Electron Microscopy: Exploring the Nano-Structural Imaging',
      date: '(27 - 29 March 2025)'
    },
    {
      img: 'event-7.jpg',
      title: 'National Workshop on Advanced Chromatographic Techniques Theory & Applications',
      date: '(19 - 21 September, 2024)'
    },
    {
      img: 'event-8.jpg',
      title: 'SHORT-TERM COURSE on Advanced Materials analysis & Characterization Techniques: Hands-on-Training and Data Interpretation',
      date: '(09 - 13 December, 2024)'
    },
    {
      img: 'event-1.jpg',
      title: 'National workshop on X-Ray Diffraction and Particle Size Analyzer',
      date: '(26 - 27 April 2024)'
    },
    {
      img: 'event-2.jpg',
      title: 'Summer Training Programme',
      date: '(3 June - 13 July 2024)'
    },
    {
      img: 'event-3.jpg',
      title: 'Workshop on Field Emission Scanning Electron Microscope',
      date: '(29 - 30 March 2024)'
    },
    {
      img: 'summer-training-programme-2025.webp',
      title: 'ANRF Sponsored Summer Training Programme',
      date: '(2 June - 11 July 2025)'
    },
  ];

  get eventGroups() {
    const groups = [];
    for (let i = 0; i < this.events.length; i += 3) {
      groups.push(this.events.slice(i, i + 3));
    }
    return groups;
  }

  testClick(a: any): void {
    const fileName = `${a}.pdf`;
    const fileUrl = `assets/CifDocumentsTemplates/${fileName}`;

    fetch(fileUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      })
      .catch(error => {
        alert('Error downloading file');
      });
  }

  isDisabled: any = true;
  showSearchForm: boolean = false; show: boolean = true; isSearchOpen: boolean = false;
  toggleSearchForm() {
    this.showSearchForm = !this.showSearchForm;
    this.show = !this.show;
  }
}

