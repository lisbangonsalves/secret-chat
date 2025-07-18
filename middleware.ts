import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/chat') {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/chat/:path*']
}
