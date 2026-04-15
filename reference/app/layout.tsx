import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '中式人生模拟器',
  description: '看看你这辈子拿到的是什么剧本',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {children}
      </body>
    </html>
  )
}
