// Copia o worker do pdfjs para public/ para ser servido pelo próprio domínio
// (self-hosted). Assim o worker não passa pelo bundler — evita o erro de
// "import.meta cannot be used outside of module code" na minificação.
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const src = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
const dest = 'public/pdf.worker.min.mjs';

if (!existsSync(src)) {
  console.warn('[copy-pdf-worker] worker não encontrado em', src, '- pulando');
  process.exit(0);
}

mkdirSync('public', { recursive: true });
copyFileSync(src, dest);
console.log('[copy-pdf-worker] copiado para', dest);
