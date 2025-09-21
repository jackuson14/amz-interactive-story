import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Turbopack uses the web/ folder as the workspace root
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
