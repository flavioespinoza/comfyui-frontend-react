// src/app/layout.tsx
// Date: December 25, 2025
// Version: v2

import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

export const metadata: Metadata = {
	title: 'ComfyUI',
	description: 'ComfyUI - Node-based Stable Diffusion Interface'
}

export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="dark">
			<body className="min-h-screen bg-comfy-bg text-comfy-text antialiased">
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	)
}
