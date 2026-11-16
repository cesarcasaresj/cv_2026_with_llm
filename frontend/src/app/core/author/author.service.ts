import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { components } from '../api/generated';

export type ManagedCategory = components['schemas']['ManagedCategory'];
export type AuthorPost = components['schemas']['AuthorPost'];

const AUTHOR_API = '/api/v1/author';

/** Acciones del autor sobre la lista fija de categorías y la categoría de cada artículo (spec.md, HU-08 y HU-09). */
@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly http = inject(HttpClient);

  readonly categoriesUrl = `${AUTHOR_API}/categories`;
  readonly postsUrl = `${AUTHOR_API}/posts`;

  createCategory(name: string): Observable<ManagedCategory> {
    return this.http.post<ManagedCategory>(this.categoriesUrl, { name });
  }

  renameCategory(id: number, name: string): Observable<ManagedCategory> {
    return this.http.patch<ManagedCategory>(`${this.categoriesUrl}/${id}`, { name });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
  }

  assignCategory(postId: number, categoryId: number): Observable<AuthorPost> {
    return this.http.put<AuthorPost>(`${this.postsUrl}/${postId}/category`, { categoryId });
  }
}

/** Mensaje de un ApiError del backend; si no lo hay (sin red, 500), uno genérico. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
