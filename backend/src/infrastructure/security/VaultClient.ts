type Secret = Record<string, string>;

export class VaultClient {
  private readonly cache = new Map<string, { data: Secret; expiresAt: number }>();

  constructor(
    private readonly address: string,
    private readonly token: string,
    private readonly cacheMs = 5 * 60_000,
  ) {}

  async readSecret(path: string): Promise<Secret> {
    const cached = this.cache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Solo se incluye la ruta en los errores: nunca el token ni el contenido del secreto
    let response: Response;
    try {
      response = await fetch(`${this.address}/v1/secret/data/${path}`, {
        headers: { 'X-Vault-Token': this.token },
      });
    } catch {
      throw new Error(`VAULT_UNREACHABLE: no se pudo conectar con Vault en ${this.address}`);
    }

    if (!response.ok) {
      throw new Error(`VAULT_READ_FAILED (${response.status}) en la ruta ${path}`);
    }

    const body = (await response.json()) as { data: { data: Secret } };
    const data = body.data.data;
    this.cache.set(path, { data, expiresAt: Date.now() + this.cacheMs });
    return data;
  }
}
