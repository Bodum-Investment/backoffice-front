import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getNotice, createNotice, updateNotice, deleteNotice } from '@/api/notices';
import { useToast } from '@/hooks/useToast';
import ConfirmModal from '@/components/common/ConfirmModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import '@/styles/pages/notices.css';

export default function NoticeFormPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!noticeId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setIsFetching(true);
    getNotice(Number(noticeId))
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        setIsPublished(data.isPublished);
        setIsPinned(data.isPinned);
      })
      .catch(() => showToast('error', '공지사항 조회에 실패했습니다'))
      .finally(() => setIsFetching(false));
  }, [noticeId, isEdit, showToast]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('error', '제목을 입력하세요');
      return;
    }
    if (!content.trim()) {
      showToast('error', '내용을 입력하세요');
      return;
    }
    setIsLoading(true);
    try {
      const payload = { title, content, isPublished, isPinned };
      if (isEdit) {
        await updateNotice(Number(noticeId), payload);
        showToast('success', '저장되었습니다');
      } else {
        const created = await createNotice(payload);
        showToast('success', '생성되었습니다');
        navigate(`/notices/${created.id}`, { replace: true });
      }
    } catch {
      showToast('error', '저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotice(Number(noticeId));
      showToast('success', '삭제되었습니다');
      navigate('/notices');
    } catch {
      showToast('error', '삭제에 실패했습니다');
    }
  };

  if (isFetching) return <LoadingSpinner />;

  return (
    <div className="notice-form">
      <h2 className="page-title">{isEdit ? '공지사항 수정' : '공지사항 생성'}</h2>

      <div className="form-card">
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="공지사항 제목"
          />
          <span className="char-count">{title.length}/200</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지사항 내용"
            rows={8}
          />
        </div>

        <div className="form-group">
          <label>공개 여부</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span className="toggle__slider" />
          </label>
        </div>

        <div className="form-group">
          <label>상단 고정</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            <span className="toggle__slider" />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn--secondary" onClick={() => navigate('/notices')}>
            취소
          </button>
          {isEdit && (
            <button className="btn btn--danger" onClick={() => setShowDeleteModal(true)}>
              삭제
            </button>
          )}
          <button className="btn btn--primary" onClick={handleSave} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="공지사항 삭제"
        message="이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
