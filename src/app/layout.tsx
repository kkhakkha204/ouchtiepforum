import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Ouch! — Chia sẻ thất bại",
    description: "Nơi mọi người chia sẻ thất bại của mình."
}

export default function RootLayout({
                                       children
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
        <body>{children}</body>
        </html>
    )
}