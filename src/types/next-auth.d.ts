import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan?: string; // Add plan to session
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    plan?: string; // Add plan to user
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan?: string; // Add plan to JWT
  }
}
