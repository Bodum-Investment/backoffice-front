interface DuplicateLoginModalProps {
  show: boolean;
  onClose: () => void;
}

export default function DuplicateLoginModal({ show, onClose }: DuplicateLoginModalProps) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-icon">&#9888;</div>
        <h3>다른 기기에서 로그인</h3>
        <p>다른 기기에서 로그인되어 현재 세션이 만료되었습니다.</p>
        <p>본인이 아닌 경우 비밀번호를 변경해주세요.</p>
        <button className="btn btn--primary" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
