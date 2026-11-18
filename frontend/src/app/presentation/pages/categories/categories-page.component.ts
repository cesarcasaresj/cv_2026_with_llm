import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { firstValueFrom } from 'rxjs';
import {
  AuthorService,
  apiErrorMessage,
  type AuthorPost,
  type ManagedCategory,
} from '../../../core/author/author.service';
import { SeoService } from '../../../core/seo/seo.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { stateOf } from '../../../core/http/resource-state';
import {
  CategoryManagerComponent,
  type CategoryRename,
  type ListState,
} from '../../components/organisms/category-manager/category-manager.component';
import {
  PostCategoryListComponent,
  type CategoryAssignment,
} from '../../components/molecules/post-category-list/post-category-list.component';

/** Gestión de categorías del autor (spec.md, HU-08 y HU-09). Ruta protegida: /cuenta/categorias. */
@Component({
  imports: [RouterLink, CategoryManagerComponent, PostCategoryListComponent],
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.css',
  host: { class: 'l-page' },
})
export class CategoriesPageComponent {
  private readonly author = inject(AuthorService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly seo = inject(SeoService);
  protected readonly t = inject(I18nService).t;

  private readonly manager = viewChild.required(CategoryManagerComponent);
  private readonly postList = viewChild.required(PostCategoryListComponent);

  protected readonly categories = httpResource<ManagedCategory[]>(() => this.author.categoriesUrl);
  protected readonly posts = httpResource<AuthorPost[]>(() => this.author.postsUrl);

  protected readonly categoriesState = computed<ListState>(() => stateOf(this.categories));
  /** La tabla necesita las dos listas: artículos y categorías para el selector. */
  protected readonly postsState = computed<ListState>(() => {
    const states = [stateOf(this.posts), stateOf(this.categories)];
    return states.includes('error') ? 'error' : states.includes('loading') ? 'loading' : 'ready';
  });

  protected readonly busy = signal(false);
  protected readonly savingPostId = signal<number | null>(null);
  protected readonly categoryError = signal<string | null>(null);
  protected readonly assignmentError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const text = this.t().categories;
      this.seo.setPage({ title: text.title, description: text.seoDescription, path: '/cuenta/categorias', noindex: true });
    });
  }

  protected async create(name: string): Promise<void> {
    await this.runCategoryAction(async () => {
      const created = await firstValueFrom(this.author.createCategory(name));
      this.manager().createSucceeded();
      return this.t().categories.created(created.name);
    });
  }

  protected async rename({ id, name }: CategoryRename): Promise<void> {
    await this.runCategoryAction(async () => {
      const renamed = await firstValueFrom(this.author.renameCategory(id, name));
      this.manager().renameSucceeded(id);
      return this.t().categories.renamed(renamed.name);
    });
  }

  protected async remove(id: number): Promise<void> {
    const name = this.categories.hasValue() ? this.categories.value().find((c) => c.id === id)?.name : undefined;
    await this.runCategoryAction(async () => {
      await firstValueFrom(this.author.deleteCategory(id));
      this.manager().deleteSucceeded();
      return this.t().categories.deleted(name ?? null);
    });
  }

  protected async assign({ postId, categoryId }: CategoryAssignment): Promise<void> {
    this.savingPostId.set(postId);
    this.assignmentError.set(null);
    try {
      const updated = await firstValueFrom(this.author.assignCategory(postId, categoryId));
      this.postList().assignmentSaved(postId);
      // Los contadores de la lista de categorías cambian: se recargan las dos listas
      this.posts.reload();
      this.categories.reload();
      this.announcer.announce(this.t().categories.moved(updated.title, updated.category.name), 'polite');
    } catch (error) {
      const message = apiErrorMessage(error, this.t().categories.saveError);
      this.assignmentError.set(message);
      this.announcer.announce(message, 'assertive');
    } finally {
      this.savingPostId.set(null);
    }
  }

  /** Ejecuta una acción de HU-09, recarga los datos y anuncia el resultado o el error. */
  private async runCategoryAction(action: () => Promise<string>): Promise<void> {
    this.busy.set(true);
    this.categoryError.set(null);
    try {
      const success = await action();
      this.categories.reload();
      this.posts.reload();
      this.announcer.announce(success, 'polite');
    } catch (error) {
      const message = apiErrorMessage(error, this.t().categories.saveError);
      this.categoryError.set(message);
      this.announcer.announce(message, 'assertive');
    } finally {
      this.busy.set(false);
    }
  }
}
