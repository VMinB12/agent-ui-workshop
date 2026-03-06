import type { Metadata } from 'next'
import { Share_Tech_Mono, VT323 } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import './globals.css'

const shareTechMono = Share_Tech_Mono({
  variable: '--font-share-tech-mono',
  weight: '400',
  subsets: ['latin'],
})

const vt323 = VT323({
  variable: '--font-vt323',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AI Chat Workshop',
  description: 'Chat UI connected to a configurable backend route',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${shareTechMono.variable} ${vt323.variable} font-sans antialiased`}>
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
