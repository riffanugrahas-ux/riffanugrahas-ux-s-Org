import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isDeleting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  onConfirm,
  onClose,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Apakah Anda yakin ingin menghapus {itemType}{' '}
          <strong className="text-rose-300 font-semibold">"{itemName}"</strong> dari database? Tindakan ini bersifat permanen pada database SQLite.
        </p>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
