import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { API_KEY, API_5_DAY_ROOT_URL } from '../../private';
import {
  FullWeatherData,
  HTTPErrorData,
  OneDayWeatherData,
} from './interfaces';
import { catchError, map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  constructor(private http: HttpClient) {}

  handleError(error: HttpErrorResponse): Observable<HTTPErrorData> {
    return throwError(error);
  }

  convertToCamelCase(payload: FullWeatherData): FullWeatherData {
    const makeCamelCase = (s: string): string =>
      s.replace(/([-_][a-z])/gi, (current) =>
        current.toUpperCase().replace('-', '').replace('_', '')
      );
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        const newKey = makeCamelCase(key);
        const value = payload[key];
        delete payload[key];
        payload[newKey] = value;
        if (typeof value === 'object') {
          this.convertToCamelCase(value);
        }
      }
    }
    return payload;
  }

  normalizeApiDate(apiDate: string | Date): Date {
    if (typeof apiDate === 'string') {
      if (apiDate.includes('-')) {
        const formattedDateStr = apiDate.replace(/-/g, '/');
        const todaysDate = new Date();
        const formattedDate = new Date(formattedDateStr);
        const year = formattedDate.getFullYear();
        const month = formattedDate.getMonth();
        const day = formattedDate.getDay();
        const hours = todaysDate.getHours();
        const mins = todaysDate.getMinutes();
        const secs = todaysDate.getSeconds();
        return new Date(year, month, day, hours, mins, secs);
      }
    } else {
      return apiDate;
    }
  }

  getFullWeather(
    inputValue: string,
    inputType: string,
    tempScale: string
  ): Observable<FullWeatherData | HTTPErrorData> {
    let fullAPIUrl: string;
    if (inputType === 'string') {
      fullAPIUrl = `${API_5_DAY_ROOT_URL}city=${inputValue}&key=${API_KEY}&days=5`;
    } else {
      fullAPIUrl = `${API_5_DAY_ROOT_URL}postal_code=${inputValue}&key=${API_KEY}&days=5`;
    }
    if (tempScale === 'Fahrenheit') {
      fullAPIUrl = `${fullAPIUrl}&units=I`;
    }
    return this.http.get<FullWeatherData>(fullAPIUrl).pipe(
      map((resp) => {
        let normalizedPayload = JSON.parse(JSON.stringify(resp));
        normalizedPayload = this.convertToCamelCase(normalizedPayload);
        normalizedPayload.data.forEach(
          (day: OneDayWeatherData) =>
            (day.validDate = this.normalizeApiDate(day.validDate))
        );
        return normalizedPayload;
      }),
      catchError((error) => this.handleError(error))
    );
  }
}
