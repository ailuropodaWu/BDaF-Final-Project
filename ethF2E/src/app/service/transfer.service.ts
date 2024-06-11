import { Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  // url = 'https://dummyjson.com/products/1';
  url = 'http://127.0.0.1:3000/api/transfer';

  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get(this.url);
  }

  postData(data: any): Observable<any> {
    return this.http.post(this.url, data, { withCredentials: false }).pipe(
      timeout(1000000)
    );
  }
}
