import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    'grid',
    'grid-cols-1',
    'grid-cols-2',
    'lg:grid-cols-2',
    'gap-6',
    'min-h-[calc(100vh-8rem)]',
    'min-h-[calc(100vh-12rem)]',
  ],
  plugins: [], // ✅ MUST be an array
};

export default config;
