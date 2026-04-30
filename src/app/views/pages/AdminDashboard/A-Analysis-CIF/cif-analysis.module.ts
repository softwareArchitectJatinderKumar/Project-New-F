import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Bootstrap imports (if using Bootstrap 5)
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

 

// Component
import { CIFAnalysisPriceComponent } from './cif-analysis-price.component';

 

// Routing
import { RouterModule, Routes } from '@angular/router';
import { CIFAnalysisService } from 'src/app/_services/cif-analysis.service';

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
 
    RouterModule.forChild(routes)
  ],
  providers: [
    CIFAnalysisService
  ]
})
export class CIFAnalysisModule { }
