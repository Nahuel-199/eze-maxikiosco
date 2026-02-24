import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Controla360 | Sistema de gestion de comercios',
  description:
    'Software de gestion para comercios, maxikioscos. Control de stock, punto de venta, reportes y mas. Sin instalacion, desde tu celular o computadora.',
  keywords: [
    'sistema para kioscos',
    'software para maxikiosco',
    'control de stock kiosco Argentina',
    'punto de venta kiosco',
    'gestion de kiosco',
    'sistema para comercios'
  ],
  icons: {
    icon: [
      {
        url: '/logo360.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo360.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logo360.ico',
        type: 'image/svg+xml',
      },
    ],
    apple: '/logo360.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
