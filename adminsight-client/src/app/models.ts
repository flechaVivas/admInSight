// system.model.ts
export interface System {
  id: number;
  name: string;
  ip_address: string;
  ssh_port: number;
}

// sys-user.model.ts
export interface SysUser {
  id: number;
  username: string;
  password: string;
  system: number; // Aquí se almacena el ID del sistema relacionado
}

// app-user.model.ts
export interface AppUser {
  id: number;
  email: string;
  username: string;
}

// app-user-system.model.ts
export interface AppUserSystem {
  id: number;
  app_user: number; // ID del usuario de la aplicación
  system: number; // ID del sistema
}

// ssh-auth-token.model.ts
export interface SSHAuthToken {
  id: number;
  user: number; // ID del usuario
  system: number; // ID del sistema
  token: string;
  created_at: string; // Fecha y hora de creación del token
  expires_at: string; // Fecha y hora de expiración del token
}