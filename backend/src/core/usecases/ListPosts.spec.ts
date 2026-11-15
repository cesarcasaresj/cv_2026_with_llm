import { describe, expect, it } from 'vitest';
import { ListPosts } from './ListPosts';
import { NotFoundError } from '../domain/errors';
import { accesibilidad, diseno, fakePosts, fakeTaxonomy, samplePost } from './testing/fakes';

const proyectos = { id: 8, name: 'Proyectos', slug: 'proyectos' };
const conDisenoYEtiqueta = samplePost({ id: 1, category: diseno, tags: [accesibilidad] });
const conDisenoSinEtiqueta = samplePost({ id: 2, category: diseno, tags: [] });
const deProyectos = samplePost({ id: 3, category: proyectos, tags: [accesibilidad] });

function useCase() {
  return new ListPosts(
    fakeTaxonomy([diseno, proyectos]),
    fakeTaxonomy([accesibilidad]),
    fakePosts([conDisenoYEtiqueta, conDisenoSinEtiqueta, deProyectos]),
  );
}

describe('ListPosts', () => {
  it('sin filtros devuelve todos los artículos publicados', async () => {
    expect(await useCase().execute()).toHaveLength(3);
  });

  it('con categoría devuelve solo sus artículos', async () => {
    const result = await useCase().execute({ categorySlug: 'diseno' });

    expect(result.map((post) => post.id)).toEqual([1, 2]);
  });

  it('con etiqueta devuelve solo los artículos que la tienen', async () => {
    const result = await useCase().execute({ tagSlug: 'accesibilidad' });

    expect(result.map((post) => post.id)).toEqual([1, 3]);
  });

  it('combina categoría y etiqueta: deben cumplirse ambas', async () => {
    const result = await useCase().execute({ categorySlug: 'diseno', tagSlug: 'accesibilidad' });

    expect(result.map((post) => post.id)).toEqual([1]);
  });

  it('con una categoría desconocida lanza NotFoundError', async () => {
    await expect(useCase().execute({ categorySlug: 'no-existe' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('con una etiqueta desconocida lanza NotFoundError', async () => {
    await expect(useCase().execute({ tagSlug: 'no-existe' })).rejects.toThrow('No encontramos esa etiqueta.');
  });
});
