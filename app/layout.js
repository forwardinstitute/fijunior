import './globals.css'

export const metadata = {
  title: 'Forward HQ',
  description: 'Work experience platform for kids aged 8-14',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
