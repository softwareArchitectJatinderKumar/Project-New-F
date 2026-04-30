import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Bootstrap imports (if using Bootstrap 5)
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Toastr for notifications
import { ToastrModule } from 'ngx-toastr';

// Component
import { CIFAnalysisPriceComponent } from './cif-analysis-price.component';

// Service
import { CIFAnalysisService } from './services/cif-analysis.service';

// Routing
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: CIFAnalysisPriceComponent
  }
];

@NgModule({
  declarations: [
    CIFAnalysisPriceComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      timeOut: 3000,
      progressBar: true
    }),
    RouterModule.forChild(routes)
  ],
  providers: [
    CIFAnalysisService
  ]
})
export class CIFAnalysisModule { }
