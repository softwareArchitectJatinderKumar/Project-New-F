import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { StorageService } from './storage.service';
import { environment } from 'src/environments/environment';

// ─── Interfaces matching SP columns & WebAPI model ───────────────────────────

export interface CifInstrumentModel {
  instrumentId:   string;
  instrumentName: string;
  isActive:       number;
}

export interface CIFAnalysisModel {
  recordId?:      string;
  analysisType:   string;
  instrumentId:   string;
  instrumentName: string;
  createdBy?:     string;
  createdOn?:     string;
  isActive?:      number;
}

export interface CIFAnalysisPriceModel {
  recordId?:      string;
  analysisId:     string;
  analysisType?:  string;
  instrumentId?:  string;
  instrumentName?: string;
  userTypeId:     string;
  typeName:       string;
  price:          string;
}

export interface CIFAnalysisCrudPayload {
  action:          string;
  recordId?:       string;
  analysisType?:   string;
  instrumentId?:   string;
  analysisId?:     string;
  userTypeId?:     string;
  typeName?:       string;
  price?:          string;
  approvalRemarks?: string;
  userId?:         string;
}

export interface CIFApiResponse {
  item1: { msg: string; returnId: string | number }[];
}

export interface CIFAnalysisViewResponse {
  item1: CIFAnalysisModel[];
}

export interface CIFAnalysisPriceViewResponse {
  item1: CIFAnalysisPriceModel[];
}

export interface CIFInstrumentViewResponse {
  item1: CifInstrumentModel[];
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AnalysisPriceService {

  // ✅ Update to your actual API base URL
  // private readonly baseUrl = 'https://your-api-domain.com/api/LpuCIF';

   private readonly baseUrl = 'https://projectsapi.lpu.in/api/LpuCIF';//'; 'https://localhost:7125/api/LpuCIF';// 'https://localhost:7125/api/LpuCIF';
  
    private readonly authToken = environment.authToken;
    // private get authHeadersFormData(): HttpHeaders {
    //   const token = this.storageService.getUser();
    //   return new HttpHeaders()
    //     .set('Authorization', 'Bearer ' + this.authToken);
    // }
  

    
  constructor(
    private readonly http:           HttpClient,
    private readonly storageService: StorageService,
  ) {}

  // ── Bearer token header — no Content-Type (FormData sets it with boundary) ─
  private get authHeaders(): HttpHeaders {
    const token = this.storageService.getUser();
    return new HttpHeaders().set('Authorization', 'Bearer ' + this.authToken);
    // return new HttpHeaders().set('Authorization', 'Bearer ' + token);
  }

  // ── Build FormData with PascalCase keys matching WebAPI model binder ────────
  private buildFormData(fields: Record<string, string | undefined | null>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null && value !== '') {
        fd.append(key, value);
      }
    }
    return fd;
  }

  // ── Shared error handler ──────────────────────────────────────────────────
  private handleError<T>(operation: string, fallback: T) {
    return (error: any): Observable<T> => {
      console.error(`[AnalysisPriceService] ${operation} failed:`, error);
      return of(fallback);
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INSTRUMENTS
  // ════════════════════════════════════════════════════════════════════════════

  /** GET all active instruments for the instrument dropdown */
  getAllInstruments(): Observable<CIFInstrumentViewResponse> {
    return this.http.get<CIFInstrumentViewResponse>(
      `${this.baseUrl}/GetInstrumentsDetails`,
      { headers: this.authHeaders }
    ).pipe(
      catchError(this.handleError('GetInstrumentsDetails', { item1: [] }))
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ANALYSIS (Tab 1)
  // ════════════════════════════════════════════════════════════════════════════

  /** ViewAnalysis — optionally filtered by InstrumentId */
  viewAnalysis(instrumentId?: string): Observable<CIFAnalysisViewResponse> {
    const fd = this.buildFormData({
      Action:       'ViewAnalysis',
      InstrumentId: instrumentId,
    });
    return this.http.post<CIFAnalysisViewResponse>(
      `${this.baseUrl}/CIFAnalysisandPriceCRUDOperation`,
      fd, { headers: this.authHeaders }
    ).pipe(catchError(this.handleError('viewAnalysis', { item1: [] })));
  }

  /** InsertAnalysis */
  insertAnalysis(payload: CIFAnalysisCrudPayload): Observable<CIFApiResponse> {
    const fd = this.buildFormData({
      Action:       'InsertAnalysis',
      AnalysisType: payload.analysisType,
      InstrumentId: payload.instrumentId,
      AnalysisId:   payload.analysisId,   // SP also uses @AnalysisId on insert
      UserId:       payload.userId,
    });
    return this.http.post<CIFApiResponse>(
      `${this.baseUrl}/CIFAnalysisandPriceCRUDOperation`,
      fd, { headers: this.authHeaders }
    ).pipe(catchError(this.handleError('insertAnalysis', { item1: [{ msg: 'Failed', returnId: -1 }] })));
  }

  /** DeleteAnalysis (soft delete — sets IsActive = 0) */
  deleteAnalysis(recordId: string, userId: string): Observable<CIFApiResponse> {
    const fd = this.buildFormData({
      Action:   'DeleteAnalysis',
      RecordId: recordId,
      UserId:   userId,
    });
    return this.http.post<CIFApiResponse>(
      `${this.baseUrl}/CIFAnalysisandPriceCRUDOperation`,
      fd, { headers: this.authHeaders }
    ).pipe(catchError(this.handleError('deleteAnalysis', { item1: [{ msg: 'Failed', returnId: -1 }] })));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ANALYSIS PRICES (Tab 2)
  // ════════════════════════════════════════════════════════════════════════════

  /** ViewAnalysisPrice — optionally filtered by InstrumentId */
  viewAnalysisPrice(instrumentId?: string): Observable<CIFAnalysisPriceViewResponse> {
    const fd = this.buildFormData({
      Action:       'ViewAnalysisPrice',
      InstrumentId: instrumentId,
    });
    return this.http.post<CIFAnalysisPriceViewResponse>(
      `${this.baseUrl}/CIFAnalysisandPriceCRUDOperation`,
      fd, { headers: this.authHeaders }
    ).pipe(catchError(this.handleError('viewAnalysisPrice', { item1: [] })));
  }

  /** InsertAnalysisPrice */
  insertAnalysisPrice(payload: CIFAnalysisCrudPayload): Observable<CIFApiResponse> {
    const fd = this.buildFormData({
      Action:     'InsertAnalysisPrice',
      AnalysisId: payload.analysisId,
      UserTypeId: payload.userTypeId,
      TypeName:   payload.typeName,
      Price:      payload.price,
      UserId:     payload.userId,
    });
    return this.http.post<CIFApiResponse>(
      `${this.baseUrl}/CIFAnalysisandPriceCRUDOperation`,
      fd, { headers: this.authHeaders }
    ).pipe(catchError(this.handleError('insertAnalysisPrice', { item1: [{ msg: 'Failed', returnId: -1 }] })));
  }

  /** DeletePrices (soft delete) */
  deletePrice(recordId: string, userId: string): Observable<CIFApiResponse> {
    const fd = this.buildFormData({
      Action:   'DeletePrices',
      RecordId: recordId,
      UserId:   userId,
    });
    return this.http.post<CIFApiResponse>(
      `${this.baseUrl}/CIFAnalysisandPriceCRUDOperation`,
      fd, { headers: this.authHeaders }
    ).pipe(catchError(this.handleError('deletePrice', { item1: [{ msg: 'Failed', returnId: -1 }] })));
  }
}
