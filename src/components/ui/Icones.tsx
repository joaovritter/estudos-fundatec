// Família única de ícones SVG (traço 1.8, cantos arredondados, 1em).
// Regra do design system: nenhum emoji como ícone estrutural.

interface IconeProps {
  className?: string;
}

function Base({ children, className = 'h-5 w-5' }: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconeLivro = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Base>
);

export const IconeCartas = (p: IconeProps) => (
  <Base {...p}>
    <rect x="3" y="6" width="13" height="15" rx="2" />
    <path d="M8 3h11a2 2 0 0 1 2 2v13" />
    <path d="M7.5 13.5h4" />
  </Base>
);

export const IconeConversa = (p: IconeProps) => (
  <Base {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.3 8.6 8.6 0 0 1-3.9-.9L3 21l2.1-5.6a8.3 8.3 0 0 1-.6-3A8.38 8.38 0 0 1 13 4.1a8.4 8.4 0 0 1 8 7.4z" />
    <path d="M9 10.5h6M9 13.5h4" />
  </Base>
);

export const IconeProva = (p: IconeProps) => (
  <Base {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 7h6M9 11h6" />
    <path d="m9 15.5 1.5 1.5 3-3" />
  </Base>
);

export const IconeHistorico = (p: IconeProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const IconeEditar = (p: IconeProps) => (
  <Base {...p}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </Base>
);

export const IconeLixeira = (p: IconeProps) => (
  <Base {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </Base>
);

export const IconeBrilho = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const IconeOlho = (p: IconeProps) => (
  <Base {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const IconeRelogio = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

export const IconeSair = (p: IconeProps) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Base>
);

export const IconeMais = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeSetaDireita = (p: IconeProps) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const IconeSetaEsquerda = (p: IconeProps) => (
  <Base {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Base>
);

export const IconeCheck = (p: IconeProps) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const IconeX = (p: IconeProps) => (
  <Base {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const IconeGirar = (p: IconeProps) => (
  <Base {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 3v6h-6" />
  </Base>
);

export const IconeUpload = (p: IconeProps) => (
  <Base {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M12 15V4M7 9l5-5 5 5" />
  </Base>
);

export const IconeMedalha = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="9" r="6" />
    <path d="m9 14.5-2 7 5-3 5 3-2-7" />
    <path d="m10 8.5 1.5 1.5 3-3" />
  </Base>
);

/* Marca da aplicação: livro aberto com marcador */
export const LogoMarca = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 6c-1.8-1.6-4.2-2.2-8-2.2v14c3.8 0 6.2.6 8 2.2 1.8-1.6 4.2-2.2 8-2.2v-14c-3.8 0-6.2.6-8 2.2z" />
    <path d="M12 6v14" />
    <path d="M16 4v6l1.8-1.4L19.5 10V4.2" />
  </Base>
);
