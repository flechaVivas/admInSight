export interface UserCredentials {
  email: string;
  password: string;
}

export interface LoggedInUser {
  id: number;
  token: string;
  username: string;
}

export interface UserRegistration {
  username: string;
  password: string;
  email: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}