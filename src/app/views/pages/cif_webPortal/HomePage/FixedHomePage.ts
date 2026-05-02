import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { LpuCIFWebService } from 'src/app/_services/lpu-cifweb.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-HomePage',
  templateUrl: './FixedHomePage.html',
  styleUrls: ['./FixedHomePage.scss'],
})
export class FixedHomePageComponent implements OnInit, OnDestroy {
   @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

  tmpsInstrumentsDataData: any[] = [];
  areFacilityImagesLoaded: boolean = false;
  loadingIndicator: boolean = true;
  serverError: boolean = false;
  errorMessage: string = '';

  constructor(
    private CIFwebService: LpuCIFWebService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getAllInstruments();
  }

  ngOnDestroy(): void {
    // Clean up memory
    this.tmpsInstrumentsDataData.forEach(item => {
      if (item.cachedImageUrl && item.cachedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.cachedImageUrl);
      }
    });
  }

  getAllInstruments(): void {
    this.loadingIndicator = true;
    this.CIFwebService.GetAllInstrumentsData().subscribe({
      next: (response) => {
        if (response.item1 && response.item1.length > 0) {
          this.tmpsInstrumentsDataData = response.item1;
          this.preloadInstrumentImages();
        } else {
          this.handleErrorState('No instruments available.');
        }
      },
      error: () => {
        this.handleErrorState('Data Server Connection error, Try again later');
      }
    });
  }

  private async preloadInstrumentImages() {
    const loadPromises = this.tmpsInstrumentsDataData.map(instrument => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = instrument.imageUrl;
        img.onload = () => {
          instrument.cachedImageUrl = instrument.imageUrl;
          resolve(true);
        };
        img.onerror = () => {
          instrument.cachedImageUrl = 'assets/images/default-instrument.jpg';
          resolve(false);
        };
      });
    });

    await Promise.all(loadPromises);
    
    this.ngZone.run(() => {
      this.areFacilityImagesLoaded = true;
      this.loadingIndicator = false;
    });
  }

  private handleErrorState(msg: string) {
    this.serverError = true;
    this.errorMessage = msg;
    this.loadingIndicator = false;
  }

  gotoFacilities() {
    this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

    VisitUrl(Sufix: any, name: any, Id: any, catId: any) {
    this.router.navigateByUrl(Sufix + '/' + name + '/' + Id + '/' + catId);
  }
  // VisitUrl(suffix: string, name: string, id: any, catId: any) {
  //   this.router.navigateByUrl(`${suffix}/${name.slice(0, 10)}/${id}/${catId}`);
  // }

  goto(path: string) {
    this.router.navigateByUrl(path);
  }

  openSampleInstructions() {
    swal.fire({
      title: 'Send Samples at Following Address :',
      html: `
        <address>
          <div class="contact-text" style="text-align:left;">
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
}
//   @ViewChild('facilitiesSection') facilitiesSection!: ElementRef;

//   tmpsInstrumentsDataData: any[] = [];
//   areFacilityImagesLoaded = false;
//   loadingIndicator = true;
//   serverError = false;
//   errorMessage = '';

//   constructor(
//     private CIFwebService: LpuCIFWebService,
//     private ngZone: NgZone,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.getAllInstruments();
//   }

//   ngOnDestroy(): void {
//     // Cleanup cached object URLs to prevent memory leaks
//     this.tmpsInstrumentsDataData.forEach(item => {
//       if (item.cachedImageUrl && item.cachedImageUrl.startsWith('blob:')) {
//         URL.revokeObjectURL(item.cachedImageUrl);
//       }
//     });
//   }

//   getAllInstruments(): void {
//     this.loadingIndicator = true;
//     this.CIFwebService.GetAllInstrumentsData().subscribe({
//       next: (response) => {
//         if (response.item1 && response.item1.length > 0) {
//           this.tmpsInstrumentsDataData = response.item1;
//           this.preloadImages();
//         } else {
//           this.handleErrorState('No instruments available at the moment.');
//         }
//       },
//       error: () => {
//         this.handleErrorState('Data Server Connection error, please try again later.');
//       }
//     });
//   }

//   /**
//    * Requirements #1: Preload images as blobs to ensure they render instantly 
//    * without loaders or "staircase" effects once visible.
//    */
//   private async preloadImages() {
//     const promises = this.tmpsInstrumentsDataData.map(item => {
//       return new Promise((resolve) => {
//         const img = new Image();
//         img.src = item.imageUrl;
        
//         img.onload = () => {
//           item.cachedImageUrl = item.imageUrl;
//           resolve(true);
//         };
        
//         img.onerror = () => {
//           // Silent fallback to a local asset if remote fails
//           item.cachedImageUrl = 'assets/images/default-instrument.jpg';
//           resolve(false);
//         };
//       });
//     });

//     await Promise.all(promises);
    
//     this.ngZone.run(() => {
//       this.areFacilityImagesLoaded = true;
//       this.loadingIndicator = false;
//     });
//   }

//   private handleErrorState(msg: string) {
//     this.serverError = true;
//     this.errorMessage = msg;
//     this.loadingIndicator = false;
//   }

//   gotoFacilities() {
//     this.facilitiesSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
//   }

//   VisitUrl(prefix: string, name: string, id: any, catId: any) {
//     this.router.navigateByUrl(`${prefix}/${name.slice(0, 10)}/${id}/${catId}`);
//   }

//   goto(path: string) {
//     this.router.navigateByUrl(path);
//   }

//   openSampleInstructions() {
//     swal.fire({
//       title: 'Send Samples to:',
//       html: `
//         <address style="text-align: left; line-height: 1.6;">
//           <strong>Central Instrumentation Facility (CIF)</strong><br/>
//           Lovely Professional University, Block-38, Room No.106<br/>
//           Jalandhar - Delhi G.T. Road, Phagwara, Punjab - 144411<br/>
//           Email: <a href="mailto:cif@lpu.co.in">cif@lpu.co.in</a>
//         </address>`,
//       icon: 'info'
//     });
//   }
// }