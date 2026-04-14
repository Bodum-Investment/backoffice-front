import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function VersionUpdateBanner() {
  const { hasUpdate, reload } = useVersionCheck();
  if (!hasUpdate) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '10px 16px',
        background: '#1f2937',
        color: '#fff',
        fontSize: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <span>새 버전이 배포되었습니다. 새로고침 후 이용해 주세요.</span>
      <button
        type="button"
        onClick={reload}
        style={{
          padding: '6px 14px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        새로고침
      </button>
    </div>
  );
}
