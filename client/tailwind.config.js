/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        card: "hsl(var(--color-card))",
        cardForeground: "hsl(var(--color-card-foreground))",
        border: "hsl(var(--color-border))",
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--color-danger))",
          foreground: "hsl(var(--color-danger-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
          foreground: "hsl(var(--color-muted-foreground))",
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 24px -4px rgba(0, 0, 0, 0.05)',
        'premium-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
