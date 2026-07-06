'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Spinner from '@/components/ui/Spinner';
import { IconeSetaEsquerda, IconeSetaDireita } from '@/components/ui/Icones';

// Worker do pdfjs servido de /public (copiado no postinstall). Fica no próprio
// domínio e não passa pelo bundler — ver scripts/copy-pdf-worker.mjs.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface VisualizadorPDFProps {
  url: string;
  /** avisa o total de páginas assim que o documento carrega */
  onCarregado?: (numPaginas: number) => void;
  /** largura máxima do render em px */
  largura?: number;
}

export default function VisualizadorPDF({ url, onCarregado, largura = 560 }: VisualizadorPDFProps) {
  const [numPaginas, setNumPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState(false);

  if (erro) {
    return (
      <div className="rounded-xl bg-erro/10 p-4 text-center text-sm text-erro">
        Não foi possível carregar a visualização do PDF.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="max-h-[60vh] w-full overflow-auto rounded-xl border border-terra-500/15 bg-creme-200/50 p-2">
        <Document
          file={url}
          loading={<Spinner texto="Carregando PDF…" />}
          onLoadSuccess={({ numPages }) => {
            setNumPaginas(numPages);
            onCarregado?.(numPages);
          }}
          onLoadError={() => setErro(true)}
        >
          <Page
            pageNumber={pagina}
            width={largura}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto shadow-carta"
          />
        </Document>
      </div>

      {numPaginas > 1 && (
        <div className="flex items-center gap-3 text-sm text-terra-700">
          <button
            type="button"
            className="btn-icone !h-9 !w-9 disabled:opacity-40"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            aria-label="Página anterior"
          >
            <IconeSetaEsquerda className="h-4 w-4" />
          </button>
          <span className="font-mono tabular-nums">
            {pagina} / {numPaginas}
          </span>
          <button
            type="button"
            className="btn-icone !h-9 !w-9 disabled:opacity-40"
            onClick={() => setPagina((p) => Math.min(numPaginas, p + 1))}
            disabled={pagina >= numPaginas}
            aria-label="Próxima página"
          >
            <IconeSetaDireita className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
