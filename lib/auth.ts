import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const users = [
  { 
    username: process.env.USER1_USERNAME!, 
    passwordHash: process.env.USER1_PASSWORD_HASH!, 
    name: process.env.USER1_NAME! 
  },
  { 
    username: process.env.USER2_USERNAME!, 
    passwordHash: process.env.USER2_PASSWORD_HASH!, 
    name: process.env.USER2_NAME! 
  }
]

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        
        const user = users.find(u => u.username === credentials.username)
        if (!user) return null
        
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValidPassword) return null
        
        return {
          id: user.username,
          name: user.name,
          username: user.username
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).username = token.username
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}
