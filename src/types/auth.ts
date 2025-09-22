// Define UserRole type since SQLite doesn't support enums
export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES'

declare module 'next-auth' {
  interface User {
    id: string
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}