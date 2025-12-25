// tailwind.config.ts
// Date: December 25, 2025
// Version: v1

import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				comfy: {
					bg: '#1a1a2e',
					surface: '#16213e',
					border: '#0f3460',
					accent: '#e94560',
					text: '#eaeaea',
					muted: '#7f8c8d'
				}
			}
		}
	},
	plugins: []
}

export default config
