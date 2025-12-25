// next.config.ts
// Date: December 25, 2025
// Version: v1

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	turbopack: {
		root: __dirname
	},
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '8188',
				pathname: '/view/**'
			}
		]
	},
	async rewrites() {
		return [
			{
				source: '/api/comfy/:path*',
				destination: 'http://localhost:8188/:path*'
			}
		]
	}
}

export default nextConfig
