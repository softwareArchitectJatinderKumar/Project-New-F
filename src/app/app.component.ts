import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'LPU';


  headerHtml: string = '';
  footerHtml: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Fetch Header
    // this.http.get('https://includepages.lpu.in/newlpu/header.php', { responseType: 'text' })
    //   .subscribe(data => this.headerHtml = data);

    //   console.log('Header HTML:', this.headerHtml); // Debug log to check header content
      
    //   // Fetch Footer
    //   this.http.get('https://includepages.lpu.in/newlpu/footer.php', { responseType: 'text' })
    //   .subscribe(data => this.footerHtml = data);
    //   console.log('Header HTML:', this.footerHtml); // Debug log to check header content
  }

}
