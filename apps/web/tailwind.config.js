/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#1d4ed8", // Royal Blue
                secondary: "#0f172a", // Deep Indigo/Dark Slate
                accent: "#f59e0b", // Warm Amber
                success: "#10b981", // Teal/Green
                "background-light": "#f3f4f6", // Light Gray/White smoke
                "background-dark": "#0f172a", // Dark background
                "card-light": "#ffffff",
                "card-dark": "#1e293b",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 15px rgba(29, 78, 216, 0.3)',
            }
        },
    },
    plugins: [],
}
