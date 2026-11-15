// Carga los artículos de content/articulos/*.md en la base (spec.md, pregunta 8).
// Uso:   npm run load:content -- --author correo@ejemplo.com
//
// - El nombre del archivo es el slug del artículo; volver a cargar un archivo lo actualiza (no lo duplica).
// - Si algún archivo no cumple las reglas de §5.1, no se escribe nada y se listan los errores.
// - Las portadas se convierten a AVIF, WebP y JPG en frontend/public/images/articulos/ (decisión H).

import { readdir, readFile, mkdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import type { PoolClient } from 'pg';
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

/** Busca o crea la categoría o etiqueta por su slug, y devuelve su id. */
async function upsertTerm(client: PoolClient, table: 'categories' | 'tags', name: string): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO ${table} (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, slugify(name)],
  );
  return rows[0].id;
}

async function saveArticle(
  client: PoolClient,
  article: ArticleSource,
  authorId: number,
  cover: ProcessedCover | null,
): Promise<void> {
  const categoryId = await upsertTerm(client, 'categories', article.category);

  // Si no se indica updatedAt, se usa publishedAt: así volver a cargar no cambia la fecha del sitemap
  const updatedAt = article.updatedAt ?? article.publishedAt ?? new Date();

  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO posts (slug, title, seo_title, description, body_markdown, category_id, author_id, status,
                        published_at, updated_at, cover_image_path, cover_image_alt, cover_is_decorative,
                        cover_width, cover_height)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title, seo_title = EXCLUDED.seo_title, description = EXCLUDED.description,
       body_markdown = EXCLUDED.body_markdown, category_id = EXCLUDED.category_id, author_id = EXCLUDED.author_id,
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
    const tagId = await upsertTerm(client, 'tags', tag);
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

    await mkdir(COVER_OUTPUT_DIR, { recursive: true });

    // 3. Guardar cada artículo en su propia transacción
    for (const article of articles) {
      const cover = article.cover ? await processCover(article.slug, article.cover.file) : null;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await saveArticle(client, article, author.id, cover);
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
