module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C6FF6',
        secondary: '#A78BFA',
        accent: '#F472B6',
        lavender: '#EDE9FE',
        pinksoft: '#FDF2F8',
        softblue: '#EEF2FF',
        bg: '#F8FAFC'
      },
      boxShadow: {
        'glass-lg': '0 20px 60px rgba(124,111,246,0.15)'
      },
      borderRadius: {
        'card': '28px'
      }
    }
  },
  plugins: []
};
