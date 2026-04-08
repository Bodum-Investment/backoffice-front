import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface FormModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function FormModal({
  isOpen,
  title,
  children,
  onSubmit,
  onCancel,
  submitLabel = '확인',
  isLoading = false,
}: FormModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="btn btn--secondary" onClick={onCancel} disabled={isLoading}>
            취소
          </button>
          <button className="btn btn--primary" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? '처리 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
