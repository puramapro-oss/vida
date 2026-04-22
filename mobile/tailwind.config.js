/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#10B981',
          deep: '#047857',
          glow: 'rgba(16,185,129,0.35)',
        },
        sage: '#84cc16',
        void: '#030806',
        forest: '#0a1f17',
        nebula: '#061a11',
        border: 'rgba(16,185,129,0.12)',
        'text-primary': '#f0fdf4',
        'text-secondary': 'rgba(240,253,244,0.72)',
        'text-muted': 'rgba(240,253,244,0.55)',
      },
      fontFamily: {
        display: ['Syne_700Bold'],
        body: ['Inter_400Regular'],
      },
    },
  },
  plugins: [],
}
