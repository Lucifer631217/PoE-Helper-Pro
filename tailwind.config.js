/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                google: {
                    blue: '#1a73e8',
                    grey: '#F8F9FA',
                }
            },
            borderRadius: {
                'google-card': '12px',
                'google-pill': '24px',
            }
        },
    },
    plugins: [],
}
