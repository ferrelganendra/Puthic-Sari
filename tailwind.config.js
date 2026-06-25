/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Puthic Sari design tokens — soft floral luxury, warm rose palette
        primary: {
          DEFAULT: '#B77B7E',
          dark: '#8C5E58',
          soft: '#D6A5A7',
        },
        secondary: {
          DEFAULT: '#F3DAD8',
          deep: '#E8C0BD',
        },
        background: '#FFF9F7',
        surface: '#FFFFFF',
        text: {
          primary: '#2F2523',
          secondary: '#7A6460',
          muted: '#A3918D',
        },
        border: {
          DEFAULT: '#E8D4D0',
          soft: '#F1E2DE',
        },
        success: '#5F8A6B',
        sale: '#C85C5C',
        accent: {
          DEFAULT: '#B77B7E',
          hover: '#8C5E58',
          light: '#F3DAD8',
        },
        heading: '#2F2523',
        body: '#2F2523',
        price: '#2F2523',
        footer: {
          bg: '#FFF4F0',
          text: '#2F2523',
        },
        badge: {
          sale: '#C85C5C',
          soldout: '#7A6460',
          preorder: '#5F8A6B',
          bestseller: '#8C5E58',
          new: '#B77B7E',
          custom: '#5F8A6B',
        },
        star: '#D6A5A7',
      },
      fontFamily: {
        sans: ['"Figtree"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Figtree"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Figtree"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Figtree"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Soft, warm radii — premium gifting feel, not sharp ZM
        'none': '0',
        'sm': '4px',
        'md': '8px',
        'lg': '14px',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      letterSpacing: {
        'button': '0.08em',
        'eyebrow': '0.18em',
        'editorial': '0.04em',
      },
      spacing: {
        'section': {
          'mobile': '48px',
          'desktop': '88px',
        },
      },
      boxShadow: {
        'card': '0 1px 2px rgba(47, 37, 35, 0.04), 0 8px 24px rgba(47, 37, 35, 0.04)',
        'card-hover': '0 4px 12px rgba(47, 37, 35, 0.06), 0 24px 48px rgba(47, 37, 35, 0.08)',
        'soft': '0 2px 12px rgba(183, 123, 126, 0.08)',
        'soft-lg': '0 12px 40px rgba(183, 123, 126, 0.12)',
        'ring-primary': '0 0 0 3px rgba(183, 123, 126, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'soft-float': 'soft-float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'soft-radial': 'radial-gradient(ellipse at top, #FFF4F0 0%, #FFF9F7 60%)',
        'rose-gradient': 'linear-gradient(135deg, #F3DAD8 0%, #FFE9E6 100%)',
      },
    },
  },
  plugins: [],
}
