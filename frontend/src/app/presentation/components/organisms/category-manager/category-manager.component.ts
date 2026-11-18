import { Component, ElementRef, afterNextRender, inject, Injector, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ManagedCategory } from '../../../../core/author/author.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

export type ListState = 'loading' | 'error' | 'ready';

export interface CategoryRename {
  id: number;
  name: string;
}

const NAME_VALIDATORS = [Validators.required, Validators.minLength(2), Validators.maxLength(40)];

/**
 * Lista fija de categorías del autor (spec.md, HU-09): crear, renombrar y borrar.
 * Solo presenta y emite eventos; la página llama al backend y decide qué mostrar.
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-category-manager',
  templateUrl: './category-manager.component.html',
  styleUrl: './category-manager.component.css',
})
export class CategoryManagerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly t = inject(I18nService).t;

  readonly categories = input<ManagedCategory[] | null>(null);
  readonly state = input.required<ListState>();
  /** true mientras se guarda un cambio: evita envíos dobles. */
  readonly busy = input(false);
  /** Error de la última acción (409, 422…), o null. */
  readonly errorMessage = input<string | null>(null);

  readonly created = output<string>();
  readonly renamed = output<CategoryRename>();
  readonly deleted = output<number>();

  // Cada <form> necesita su FormGroup: así Angular emite ngSubmit y evita el envío nativo del navegador
  protected readonly newForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: NAME_VALIDATORS }),
  });
  protected readonly editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: NAME_VALIDATORS }),
  });
  protected readonly newName = this.newForm.controls.name;
  protected readonly editName = this.editForm.controls.name;
  protected readonly editingId = signal<number | null>(null);
  protected readonly confirmingId = signal<number | null>(null);

  protected submitNew(): void {
    if (this.newName.invalid) {
      this.newName.markAsTouched();
      return;
    }
    this.created.emit(this.newName.value.trim());
  }

  protected startEdit(category: ManagedCategory): void {
    this.confirmingId.set(null);
    this.editingId.set(category.id);
    this.editName.reset(category.name);
    this.focus(`#category-edit-${category.id}`);
  }

  protected submitEdit(category: ManagedCategory): void {
    if (this.editName.invalid) {
      this.editName.markAsTouched();
      return;
    }
    this.renamed.emit({ id: category.id, name: this.editName.value.trim() });
  }

  protected cancelEdit(category: ManagedCategory): void {
    this.editingId.set(null);
    this.focus(`#category-rename-${category.id}`);
  }

  protected askDelete(category: ManagedCategory): void {
    this.editingId.set(null);
    this.confirmingId.set(category.id);
    this.focus(`#category-confirm-${category.id}`);
  }

  protected cancelDelete(category: ManagedCategory): void {
    this.confirmingId.set(null);
    this.focus(`#category-delete-${category.id}`);
  }

  protected confirmDelete(category: ManagedCategory): void {
    this.deleted.emit(category.id);
  }

  /** La página lo llama cuando el backend confirma la creación. */
  createSucceeded(): void {
    this.newName.reset('');
  }

  /** La página lo llama cuando el backend confirma el cambio de nombre. */
  renameSucceeded(id: number): void {
    this.editingId.set(null);
    this.focus(`#category-rename-${id}`);
  }

  /** Tras borrar, la fila ya no existe: el foco va al título de la lista para no perderse. */
  deleteSucceeded(): void {
    this.confirmingId.set(null);
    this.focus('#category-list-title');
  }

  /** Mueve el foco cuando Angular ya pintó el elemento (WCAG 2.4.3, orden del foco). */
  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
