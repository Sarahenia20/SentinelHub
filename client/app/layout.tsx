import './css/style.css'
import { ClerkProvider } from '@clerk/nextjs'

// Use system fonts as fallback to avoid network dependency
const fontClass = 'font-sans'

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
          className={`${fontClass} antialiased bg-gray-900 text-white tracking-tight`}
        >
          <div className="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
          {/* {process.env.NODE_ENV === 'development' && <AuthDebugComponent />} */}
        </body>
      </html>
    </ClerkProvider>
  )
}