import express from 'express';
import { VaultClient } from './infrastructure/security/VaultClient';
import { createDatabasePool } from './infrastructure/database/DatabasePool';
import { PostgresPostRepository } from './infrastructure/database/PostgresPostRepository';
import { PostgresTaxonomyRepository } from './infrastructure/database/PostgresTaxonomyRepository';
import { PostgresUserRepository } from './infrastructure/database/PostgresUserRepository';
import { PostgresSessionRepository } from './infrastructure/database/PostgresSessionRepository';
import { ScryptPasswordHasher } from './infrastructure/security/ScryptPasswordHasher';
import { JoseSessionTokens } from './infrastructure/security/JoseSessionTokens';
import { MarkedMarkdownRenderer } from './infrastructure/content/MarkedMarkdownRenderer';
import { GetTotalPostsCount } from './core/usecases/GetTotalPostsCount';
import { ListPosts } from './core/usecases/ListPosts';
import { GetArticle } from './core/usecases/GetArticle';
import { ListTaxonomyTerms } from './core/usecases/ListTaxonomyTerms';
import { GetCategoryWithPosts } from './core/usecases/GetCategoryWithPosts';
import { ListSitemapEntries } from './core/usecases/ListSitemapEntries';
import { LoginUser } from './core/usecases/LoginUser';
import { GetCurrentUser } from './core/usecases/GetCurrentUser';
import { LogoutUser } from './core/usecases/LogoutUser';
import { PostPresenter } from './infrastructure/controllers/postPresenter';
import { postRoutes } from './infrastructure/controllers/postRoutes';
import { categoryRoutes, tagRoutes } from './infrastructure/controllers/taxonomyRoutes';
import { seoRoutes } from './infrastructure/controllers/seoRoutes';
import { authRoutes } from './infrastructure/controllers/authRoutes';
import { errorHandler } from './infrastructure/controllers/errorHandler';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** Quita la barra final para poder concatenar rutas sin duplicarla. */
function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

// Si Vault o la base de datos no responden, el arranque se detiene con un mensaje claro.
// El error solo muestra la ruta o el código de estado, nunca el valor de un secreto.
async function start(): Promise<void> {
  const vault = new VaultClient(requiredEnv('VAULT_ADDR'), requiredEnv('VAULT_TOKEN'));
  const pool = await createDatabasePool(vault, requiredEnv('VAULT_POSTS_DB_PATH'));

  // La clave de firma de la sesión vive en Vault (constitution.md, sección 2)
  const jwtPath = requiredEnv('VAULT_JWT_PATH');
  const jwtSecret = await vault.readSecret(jwtPath);
  if (!jwtSecret.signing_key) throw new Error(`Falta el campo signing_key en la ruta ${jwtPath}`);

  // Origen público del sitio (sitemap) y base de las imágenes (spec.md, decisión H)
  const siteUrl = withoutTrailingSlash(requiredEnv('PUBLIC_SITE_URL'));
  const imageBaseUrl = withoutTrailingSlash(process.env.IMAGE_BASE_URL ?? '/images/articulos');

  // main.ts es el único lugar que conoce todas las piezas y las conecta
  const posts = new PostgresPostRepository(pool);
  const categories = new PostgresTaxonomyRepository(pool, 'category');
  const tags = new PostgresTaxonomyRepository(pool, 'tag');
  const users = new PostgresUserRepository(pool);
  const sessions = new PostgresSessionRepository(pool);
  const hasher = new ScryptPasswordHasher();
  const tokens = new JoseSessionTokens(jwtSecret.signing_key);
  const presenter = new PostPresenter(imageBaseUrl);

  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1/posts',
    postRoutes(
      new GetTotalPostsCount(posts),
      new ListPosts(categories, tags, posts),
      new GetArticle(posts, new MarkedMarkdownRenderer()),
      presenter,
    ),
  );
  app.use(
    '/api/v1/categories',
    categoryRoutes(new ListTaxonomyTerms(categories), new GetCategoryWithPosts(categories, posts), presenter),
  );
  app.use('/api/v1/tags', tagRoutes(new ListTaxonomyTerms(tags)));
  app.use(
    '/api/v1/auth',
    authRoutes(
      new LoginUser(users, hasher, sessions, tokens),
      new GetCurrentUser(users, sessions, tokens),
      new LogoutUser(sessions, tokens),
    ),
  );
  app.use(seoRoutes(new ListSitemapEntries(posts), siteUrl));
  app.use(errorHandler);

  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, () => console.log(`Backend escuchando en http://localhost:${port}`));
}

start().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido al arrancar');
  process.exit(1);
});
