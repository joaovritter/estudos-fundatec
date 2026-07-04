'use client';

import Modal from '@/components/ui/Modal';

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  perigo?: boolean;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Componente reutilizável de confirmação — obrigatório em deleções,
// edições de card, reformulações que substituem e finalização de simulado.
export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  perigo = false,
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal aberto={aberto} onFechar={onCancelar} titulo={titulo} largura="max-w-md">
      <p className="mb-6 text-terra-700">{mensagem}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-secundario" onClick={onCancelar} disabled={carregando}>
          Cancelar
        </button>
        <button
          className={perigo ? 'btn-perigo' : 'btn-primario'}
          onClick={onConfirmar}
          disabled={carregando}
        >
          {carregando ? 'Aguarde…' : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
