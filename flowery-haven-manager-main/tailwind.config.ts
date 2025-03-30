import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				flora: {
					'green': '#9ED365',      // Vert vif
					'green-light': '#B8DC9C', // Vert tendre
					'green-dark': '#7BB344',  // Vert profond
					'pink': '#FF9D9D',       // Rose lumineux
					'pink-light': '#FFB5B5', // Rose pâle
					'pink-dark': '#FF7D7D',  // Rose vif
					'cream': '#F2F0EB',      // Blanc lin
					'beige': '#E9DDC7',      // Beige paille
					'brown': '#BE8A64',      // Brun noisette
					'brown-light': '#D3B394' // Brun clair
				},
				// Nouvelles couleurs élégantes pour le backend
				elegant: {
					'base': 'hsl(40, 25%, 96%)',      // Fond principal
					'surface': 'hsl(40, 20%, 94%)',   // Surface de carte
					'panel': 'hsl(40, 20%, 92%)',     // Panneaux
					'border': 'hsl(35, 30%, 85%)',    // Bordures
					'highlight': 'hsl(35, 45%, 82%)', // Surbrillance
					'brown': '#BE8A64',               // Accent brun élégant
					'brown-light': '#D3B394',         // Brun clair
					'brown-dark': '#A67553'           // Brun foncé
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Montserrat', 'sans-serif'],
				serif: ['Cormorant Garamond', 'serif'],
				script: ['"La Belle Aurore"', 'cursive']
			},
			letterSpacing: {
				'elegant': '0.08em',
				'wider': '0.1em',
				'widest': '0.15em',
			},
			lineHeight: {
				'elegant': '1.6',
				'tight-elegant': '1.4',
			},
			boxShadow: {
				'bloom': '0 10px 30px rgba(158, 211, 101, 0.15)',
				'bloom-hover': '0 15px 40px rgba(158, 211, 101, 0.25)',
				'petal': '0 10px 30px rgba(255, 157, 157, 0.15)',
				'petal-hover': '0 15px 40px rgba(255, 157, 157, 0.25)',
				'elegant': '0 5px 20px rgba(0, 0, 0, 0.05)',
				'elegant-hover': '0 12px 30px rgba(0, 0, 0, 0.1)',
				'elegant-soft': '0 4px 15px rgba(190, 138, 100, 0.08)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				'elegant-appear': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'float-elegant': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-8px)' },
				},
				'line-draw': {
					'0%': { width: '0', left: '0', right: 'auto' },
					'50%': { width: '100%', left: '0', right: 'auto' },
					'50.1%': { width: '100%', left: 'auto', right: '0' },
					'100%': { width: '0', left: 'auto', right: '0' },
				},
                // Nouvelles animations élégantes
                'elegant-slide-up': {
                    from: { opacity: '0', transform: 'translateY(30px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'elegant-slide-down': {
                    from: { opacity: '0', transform: 'translateY(-30px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'elegant-scale': {
                    from: { opacity: '0', transform: 'scale(0.9)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                'elegant-breathe': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.03)' },
                },
                'elegant-rotate': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'elegant-shimmer': {
                    '0%': { backgroundPosition: '-100% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'elegant-border-pulse': {
                    '0%, 100%': { borderColor: 'rgba(190, 138, 100, 0.3)' },
                    '50%': { borderColor: 'rgba(190, 138, 100, 0.7)' },
                },
                'elegant-draw-line': {
                    '0%': { width: '0' },
                    '100%': { width: '100%' },
                },
                'elegant-dropdown': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(-10px) scaleY(0.95)',
                        transformOrigin: 'top'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0) scaleY(1)',
                        transformOrigin: 'top'
                    },
                },
                'elegant-wave': {
                    '0%': { transform: 'translateX(-100%) translateZ(0) scaleY(1)' },
                    '50%': { transform: 'translateX(-30%) translateZ(0) scaleY(0.8)' },
                    '100%': { transform: 'translateX(0) translateZ(0) scaleY(1)' },
                },
                'elegant-pulse': {
                    '0%, 100%': { transform: 'scale(0)', opacity: '1' },
                    '50%': { transform: 'scale(1)', opacity: '0' },
                },
                'elegant-notification': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '10%, 90%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
                'ripple': {
                    to: { transform: 'scale(4)', opacity: '0' },
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-up': 'fade-up 0.7s ease-out',
				'elegant-appear': 'elegant-appear 0.8s cubic-bezier(0.25, 0.4, 0.2, 1) forwards',
				'float-elegant': 'float-elegant 5s ease-in-out infinite',
				'line-draw': 'line-draw 4s ease-in-out infinite',
                // Nouvelles animations élégantes
                'elegant-fade-in': 'fade-in 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                'elegant-slide-up': 'elegant-slide-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'elegant-slide-down': 'elegant-slide-down 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'elegant-scale': 'elegant-scale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'elegant-breathe': 'elegant-breathe 3s ease-in-out infinite',
                'elegant-rotate': 'elegant-rotate 1.5s linear infinite',
                'elegant-shimmer': 'elegant-shimmer 2.5s infinite',
                'elegant-border-pulse': 'elegant-border-pulse 2s ease-in-out infinite',
                'elegant-float': 'float-elegant 4s ease-in-out infinite',
                'elegant-draw-line': 'elegant-draw-line 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                'elegant-dropdown': 'elegant-dropdown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'elegant-wave': 'elegant-wave 3s ease-in-out infinite',
                'elegant-pulse': 'elegant-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'elegant-notification': 'elegant-notification 5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'ripple': 'ripple 0.6s linear',
			},
			backgroundImage: {
				'floral-pattern': "url('/images/subtle-floral-bg.svg')",
				'petal-texture': "url('/images/petal-texture.svg')",
				'leaf-pattern': "url('/images/leaf-pattern.svg')",
				'gradient-spring': 'linear-gradient(135deg, var(--tw-gradient-stops))',
				'gradient-elegant': 'linear-gradient(to right, var(--tw-gradient-stops))',
				'gradient-warm': 'linear-gradient(to right, #BE8A64, #D3B394)',
                'shimmer-elegant': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
			},
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'elegant': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            }
		}
	},
	plugins: [
		require("tailwindcss-animate")
	],
} satisfies Config;