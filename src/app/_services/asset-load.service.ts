import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AssetLoaderService {

  private cssLoaded = new Set<string>();
  private jsLoaded = new Set<string>();

  loadCss(url: string) {
    if (this.cssLoaded.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);

    this.cssLoaded.add(url);
  }

  loadJs(url: string) {
    if (this.jsLoaded.has(url)) return;

    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    document.body.appendChild(script);

    this.jsLoaded.add(url);
  }
}