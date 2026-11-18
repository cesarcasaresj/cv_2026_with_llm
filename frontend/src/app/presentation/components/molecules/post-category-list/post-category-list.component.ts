import { Component, inject, input, output, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import type { AuthorPost, ManagedCategory } from '../../../../core/author/author.service';

export type PostCategoryState = 'loading' | 'error' | 'ready';

export interface CategoryAssignment {
  postId: number;
  categoryId: number;
}

/**
 * Categoría de cada artículo, borradores incluidos (spec.md, HU-08).
 * Elegir en la lista no guarda nada: el cambio se aplica con "Guardar" (WCAG 3.2.2, sin cambios al seleccionar).
 */
@Component({
  selector: 'app-post-category-list',
  templateUrl: './post-category-list.component.html',
  styleUrl: './post-category-list.component.css',
})
export class PostCategoryListComponent {
  protected readonly t = inject(I18nService).t;
  readonly posts = input<AuthorPost[] | null>(null);
  readonly categories = input<ManagedCategory[] | null>(null);
  readonly state = input.required<PostCategoryState>();
  /** Artículo que se está guardando, o null. */
  readonly savingPostId = input<number | null>(null);
  readonly errorMessage = input<string | null>(null);

  readonly assigned = output<CategoryAssignment>();

  /** Categoría elegida en cada fila y aún sin guardar. */
  private readonly pending = signal<Record<number, number>>({});

  protected selectedId(post: AuthorPost): number {
    return this.pending()[post.id] ?? post.category.id;
  }

  protected choose(post: AuthorPost, value: string): void {
    this.pending.update((current) => ({ ...current, [post.id]: Number(value) }));
  }

  protected hasChange(post: AuthorPost): boolean {
    return this.selectedId(post) !== post.category.id;
  }

  protected save(post: AuthorPost): void {
    if (!this.hasChange(post)) return;
    this.assigned.emit({ postId: post.id, categoryId: this.selectedId(post) });
  }

  /** La página lo llama cuando el backend confirma el cambio: la fila vuelve a reflejar el servidor. */
  assignmentSaved(postId: number): void {
    this.pending.update(({ [postId]: _saved, ...rest }) => rest);
  }
}
