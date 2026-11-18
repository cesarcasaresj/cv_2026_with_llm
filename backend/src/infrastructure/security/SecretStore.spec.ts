import { describe, expect, it } from 'vitest';
import { EnvSecretStore, createSecretStore, secretPaths } from './SecretStore';
import { VaultClient } from './VaultClient';

describe('EnvSecretStore', () => {
  it('lee las variables con el prefijo del último tramo de la ruta', async () => {
    const store = new EnvSecretStore({
      DATABASE_HOST: 'localhost',
      DATABASE_PASSWORD: 'x',
      JWT_SIGNING_KEY: 'k',
      OTRA: 'no',
    });

    expect(await store.readSecret('cv-app/database')).toEqual({ host: 'localhost', password: 'x' });
    expect(await store.readSecret('cv-app/jwt')).toEqual({ signing_key: 'k' });
  });

  it('si no hay variables, el error nombra el prefijo y no muestra valores', async () => {
    const store = new EnvSecretStore({ DATABASE_PASSWORD: 'secreto' });

    await expect(store.readSecret('cv-app/jwt')).rejects.toThrow('SECRET_MISSING: no hay variables JWT_*');
    await expect(store.readSecret('cv-app/jwt')).rejects.not.toThrow('secreto');
  });
});

describe('createSecretStore', () => {
  it('por defecto usa Vault', () => {
    expect(createSecretStore({ VAULT_ADDR: 'http://vault', VAULT_TOKEN: 't' })).toBeInstanceOf(VaultClient);
  });

  it('con SECRETS_PROVIDER=env usa las variables de entorno', () => {
    expect(createSecretStore({ SECRETS_PROVIDER: 'env' })).toBeInstanceOf(EnvSecretStore);
  });

  it('rechaza un proveedor desconocido', () => {
    expect(() => createSecretStore({ SECRETS_PROVIDER: 'archivo' })).toThrow('SECRETS_PROVIDER no válido');
  });
});

describe('secretPaths', () => {
  it('usa las rutas del entorno o las de siempre', () => {
    expect(secretPaths({})).toEqual({ database: 'cv-app/database', jwt: 'cv-app/jwt' });
    expect(secretPaths({ VAULT_POSTS_DB_PATH: 'a/b', VAULT_JWT_PATH: 'c/d' })).toEqual({ database: 'a/b', jwt: 'c/d' });
  });
});
