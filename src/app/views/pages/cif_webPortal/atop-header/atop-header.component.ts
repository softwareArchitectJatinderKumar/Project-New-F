import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import swal from 'sweetalert2';
@Component({
  selector: 'app-atop-header',
  templateUrl: './atop-header.component.html',
  styleUrls: ['./atop-header.component.scss'],
  standalone: false
})
export class ATopHeaderComponent implements OnInit {

  constructor(  private fb: FormBuilder, 
    private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
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


  goto(val: any): void {
    this.router.navigateByUrl(val);
  }
}


// import { Component, OnInit } from '@angular/core';
// import { FormBuilder } from '@angular/forms';
// import { Router, ActivatedRoute } from '@angular/router';
// import swal from 'sweetalert2';
// @Component({
//   selector: 'app-atop-header',
//   templateUrl: './atop-header.component.html',
//   styleUrls: ['./atop-header.component.scss'],
//   standalone: false
// })
// export class ATopHeaderComponent implements OnInit {

// import { Component, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';

// @Component({
//   selector: 'app-atop-header',
//   templateUrl: './atop-header-old.component.html',
//   styleUrls: ['./atop-header.component.scss'],
//   standalone: false
// })
// export class ATopHeaderComponent implements AfterViewInit {

//   // Remote PHP header URL
//   headerUrl: string = 'https://includepages.lpu.in/newlpu/header.php';

//   constructor(private el: ElementRef, private renderer: Renderer2) {}

//   ngAfterViewInit(): void {
//     // Dynamically adjust iframe height if content inside changes
//     const iframe = this.el.nativeElement.querySelector('iframe');

//     if (iframe) {
//       iframe.addEventListener('load', () => {
//         try {
//           const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
//           const adjustHeight = () => {
//             const height = iframeDoc.body.scrollHeight;
//             this.renderer.setStyle(iframe, 'height', `${height}px`);
//           };

//           adjustHeight();

//           // Re-adjust height if content inside changes dynamically
//           const observer = new MutationObserver(adjustHeight);
//           observer.observe(iframeDoc.body, { childList: true, subtree: true });
//         } catch (e) {
//           console.warn('Dynamic resizing disabled (cross-domain iframe).');
//           // Fallback: fixed height
//           this.renderer.setStyle(iframe, 'height', '130px');
//         }
//       });
//     }
//   }
// }
