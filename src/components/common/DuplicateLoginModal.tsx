import { useEffect } from 'react';

interface DuplicateLoginModalProps {
  show: boolean;
  onClose: () => void;
}

export default function DuplicateLoginModal({ show, onClose }: DuplicateLoginModalProps) {
  useEffect(() => {
    if (!show) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-login-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">&#9888;</div>
        <h3 id="duplicate-login-title">다른 기기에서 로그인</h3>
        <p>다른 기기에서 로그인되어 현재 세션이 만료되었습니다.</p>
        <p>본인이 아닌 경우 비밀번호를 변경해주세요.</p>
        <button className="btn btn--primary" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
