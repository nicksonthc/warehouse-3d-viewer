import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Warehouse 3D Viewer',
  description: 'Interactive 3D warehouse SKU visualization tool',
  keywords: ['warehouse', '3D', 'visualization', 'SKU', 'inventory'],
  authors: [{ name: 'Warehouse 3D Team' }]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-dark-900 text-white`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}