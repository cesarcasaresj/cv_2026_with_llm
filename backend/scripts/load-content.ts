// Carga los artículos de content/articulos/*.md en la base (spec.md, pregunta 8).
// Uso:   npm run load:content -- --author correo@ejemplo.com
//
// - El nombre del archivo es el slug del artículo; volver a cargar un archivo lo actualiza (no lo duplica).
// - Si algún archivo no cumple las reglas de §5.1, no se escribe nada y se listan los errores.
// - Las portadas se convierten a AVIF, WebP y JPG en frontend/public/images/articulos/ (decisión H).
// - Las categorías son una lista fija que gestiona el autor desde la aplicación (HU-09): el script
//   nunca las crea. La categoría del archivo solo se usa la primera vez que se carga un artículo;
//   después manda la que el autor asigne en la aplicación (HU-08) y el script solo avisa si difieren.

import { readdir, readFile, mkdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import type { Pool, PoolClient } from 'pg';
import { VaultClient } from '../src/infrastructure/security/VaultClient';
import { createDatabasePool } from '../src/infrastructure/database/DatabasePool';
import { slugify } from '../src/core/domain/slug';
import { parseArticle, type ArticleSource } from './content/articleSource';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const CONTENT_DIR = join(REPO_ROOT, 'content', 'articulos');
const COVER_SOURCE_DIR = join(CONTENT_DIR, 'imagenes');
const COVER_OUTPUT_DIR = join(REPO_ROOT, 'frontend', 'public', 'images', 'articulos');
const COVER_MAX_WIDTH = 1600;

interface ProcessedCover {
  width: number;
  height: number;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function authorArgument(): string {
  const index = process.argv.indexOf('--author');
  const email = index >= 0 ? process.argv[index + 1]?.trim().toLowerCase() : undefined;
  if (!email || !email.includes('@')) {
    throw new Error('Indica el autor: npm run load:content -- --author correo@ejemplo.com');
  }
  return email;
}

/** Genera las tres versiones de la portada (constitution.md, sección 9) y devuelve su tamaño final. */
async function processCover(slug: string, sourceFile: string): Promise<ProcessedCover> {
  const image = sharp(join(COVER_SOURCE_DIR, sourceFile)).resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true });
  const output = join(COVER_OUTPUT_DIR, slug);

  const [info] = await Promise.all([
    image.clone().avif({ quality: 55 }).toFile(`${output}.avif`),
    image.clone().webp({ quality: 75 }).toFile(`${output}.webp`),
    image.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${output}.jpg`),
  ]);
  return { width: info.width, height: info.height };
}

/** Busca o crea la etiqueta por su slug (las etiquetas son libres, decisión E), y devuelve su id. */
async function upsertTag(client: PoolClient, name: string): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO tags (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, slugify(name)],
  );
  return rows[0].id;
}

/**
 * Decide la categoría de cada artículo con la lista fija (HU-08 y HU-09):
 * - artículo nuevo: la del archivo, que debe existir; si no, es un error y no se carga nada;
 * - artículo existente: se conserva la de la base; si el archivo dice otra, solo se avisa.
 */
async function resolveCategories(
  pool: Pool,
  articles: ArticleSource[],
): Promise<{ categoryIds: Map<string, number>; problems: string[]; warnings: string[] }> {
  const categories = (await pool.query<{ id: number; name: string; slug: string }>(
    'SELECT id, name, slug FROM categories ORDER BY name',
  )).rows;
  const existing = new Map(
    (await pool.query<{ slug: string; category_id: number }>(
      'SELECT slug, category_id FROM posts WHERE slug = ANY($1)',
      [articles.map((article) => article.slug)],
    )).rows.map((row) => [row.slug, row.category_id]),
  );

  const categoryIds = new Map<string, number>();
  const problems: string[] = [];
  const warnings: string[] = [];
  const available = categories.map((category) => category.name).join(', ') || '(ninguna)';

  for (const article of articles) {
    const wanted = categories.find((category) => category.slug === slugify(article.category));
    const current = existing.get(article.slug);

    if (current !== undefined) {
      categoryIds.set(article.slug, current);
      if (wanted?.id !== current) {
        const currentName = categories.find((category) => category.id === current)?.name;
        warnings.push(
          `${article.slug}: el archivo dice "${article.category}", pero se conserva "${currentName}" (asignada en la aplicación).`,
        );
      }
    } else if (wanted) {
      categoryIds.set(article.slug, wanted.id);
    } else {
      problems.push(
        `${article.slug}.md: la categoría "${article.category}" no existe. Créala en la aplicación (Mi cuenta → Categorías) o usa una de: ${available}.`,
      );
    }
  }

  return { categoryIds, problems, warnings };
}

async function saveArticle(
  client: PoolClient,
  article: ArticleSource,
  categoryId: number,
  authorId: number,
  cover: ProcessedCover | null,
): Promise<void> {

  // Si no se indica updatedAt, se usa publishedAt: así volver a cargar no cambia la fecha del sitemap
  const updatedAt = article.updatedAt ?? article.publishedAt ?? new Date();

  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO posts (slug, title, seo_title, description, body_markdown, category_id, author_id, status,
                        published_at, updated_at, cover_image_path, cover_image_alt, cover_is_decorative,
                        cover_width, cover_height)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title, seo_title = EXCLUDED.seo_title, description = EXCLUDED.description,
       body_markdown = EXCLUDED.body_markdown, author_id = EXCLUDED.author_id,
       status = EXCLUDED.status, published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at,
       cover_image_path = EXCLUDED.cover_image_path, cover_image_alt = EXCLUDED.cover_image_alt,
       cover_is_decorative = EXCLUDED.cover_is_decorative, cover_width = EXCLUDED.cover_width,
       cover_height = EXCLUDED.cover_height
     RETURNING id`,
    [
      article.slug,
      article.title,
      article.seoTitle,
      article.description,
      article.bodyMarkdown,
      categoryId,
      authorId,
      article.status,
      article.publishedAt,
      updatedAt,
      cover ? article.slug : null,
      cover ? article.cover!.alt : null,
      article.cover?.decorative ?? false,
      cover?.width ?? null,
      cover?.height ?? null,
    ],
  );
  const postId = rows[0].id;

  // Las etiquetas del archivo reemplazan a las anteriores
  await client.query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
  for (const tag of article.tags) {
    const tagId = await upsertTag(client, tag);
    await client.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)', [postId, tagId]);
  }
}

async function main(): Promise<void> {
  const authorEmail = authorArgument();

  // 1. Leer y validar todos los archivos antes de escribir nada
  const files = (await readdir(CONTENT_DIR)).filter((file) => file.endsWith('.md') && file !== 'README.md').sort();
  const articles: ArticleSource[] = [];
  const problems: string[] = [];

  for (const file of files) {
    const result = parseArticle(basename(file, '.md'), await readFile(join(CONTENT_DIR, file), 'utf8'));
    if (result.ok) articles.push(result.article);
    else problems.push(`${file}:\n  - ${result.errors.join('\n  - ')}`);
  }

  if (problems.length > 0) {
    throw new Error(`No se cargó nada. Corrige estos archivos:\n${problems.join('\n')}`);
  }

  // 2. Conectar con las credenciales de Vault y comprobar el autor
  const vault = new VaultClient(requiredEnv('VAULT_ADDR'), requiredEnv('VAULT_TOKEN'));
  const pool = await createDatabasePool(vault, requiredEnv('VAULT_POSTS_DB_PATH'));

  try {
    const { rows } = await pool.query<{ id: number; display_name: string | null }>(
      'SELECT id, display_name FROM users WHERE lower(email) = $1',
      [authorEmail],
    );
    const author = rows[0];
    if (!author) throw new Error(`No existe la cuenta ${authorEmail}. Créala con npm run create:user.`);
    if (!author.display_name) {
      throw new Error('La cuenta no tiene nombre público. Vuelve a ejecutar create:user con AUTHOR_NAME definido.');
    }

    // 3. Comprobar las categorías contra la lista fija, también antes de escribir nada
    const { categoryIds, problems: categoryProblems, warnings } = await resolveCategories(pool, articles);
    if (categoryProblems.length > 0) {
      throw new Error(`No se cargó nada. Corrige estas categorías:\n  - ${categoryProblems.join('\n  - ')}`);
    }
    warnings.forEach((warning) => console.warn(`! ${warning}`));

    await mkdir(COVER_OUTPUT_DIR, { recursive: true });

    // 4. Guardar cada artículo en su propia transacción
    for (const article of articles) {
      const cover = article.cover ? await processCover(article.slug, article.cover.file) : null;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await saveArticle(client, article, categoryIds.get(article.slug)!, author.id, cover);
        await client.query('COMMIT');
        console.log(`✓ ${article.slug} (${article.status === 'published' ? 'publicado' : 'borrador'})`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    console.log(`\n${articles.length} artículos cargados.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
});
