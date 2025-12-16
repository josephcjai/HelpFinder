/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#4F46E5", // Indigo-600 (Updated for Admin Design)
                secondary: "#0EA5E9", // Sky-500
                accent: "#F59E0B", // Amber-500
                danger: "#EF4444", // Red-500
                success: "#10b981",
                "background-light": "#F3F4F6", // Gray-100
                "background-dark": "#0F172A", // Slate-900
                "surface-light": "#FFFFFF",
                "surface-dark": "#1E293B", // Slate-800
                "text-light": "#1F2937", // Gray-800
                "text-dark": "#F8FAFC", // Slate-50
            },
            fontFamily: {
                display: ["'Plus Jakarta Sans'", "sans-serif"],
                body: ["'Inter'", "sans-serif"],
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
