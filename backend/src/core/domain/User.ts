export interface User {
  id: number;
  email: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithPassword | null>;
  findById(id: number): Promise<User | null>;
  /**
   * Crea la cuenta o cambia su contraseña si el correo ya existe (lo usa el script de alta del autor).
   * `displayName` es el nombre público en los artículos; si no se indica, se conserva el actual.
   */
  saveAccount(email: string, passwordHash: string, displayName?: string): Promise<User>;
}
