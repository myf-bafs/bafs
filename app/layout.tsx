export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body style={{ margin: 0, padding: 20, fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
