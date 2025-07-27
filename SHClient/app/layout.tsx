import { Inter } from 'next/font/google'
import './css/style.css'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata = {
  title: 'SentinelHub - DevOps Security Platform',
  description: 'Advanced security scanning and DevOps automation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} font-inter antialiased bg-gray-900 text-white tracking-tight`}
        >
          <div className="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}