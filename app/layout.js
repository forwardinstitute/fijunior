import './globals.css'

export const metadata = {
  title: 'Forward HQ',
  description: 'Work experience platform for kids aged 8-14',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
