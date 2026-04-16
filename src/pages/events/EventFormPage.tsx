import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getEvent, createEvent, updateEvent, deleteEvent } from '@/api/events';
import { useToast } from '@/hooks/useToast';
import ConfirmModal from '@/components/common/ConfirmModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toDatetimeLocalValue } from '@/utils/format';
import '@/styles/pages/events.css';

export default function EventFormPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!eventId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setIsFetching(true);
    getEvent(Number(eventId))
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        setStartAt(toDatetimeLocalValue(data.startAt));
        setEndAt(toDatetimeLocalValue(data.endAt));
        setIsActive(data.isActive);
      })
      .catch(() => showToast('error', '이벤트 조회에 실패했습니다'))
      .finally(() => setIsFetching(false));
  }, [eventId, isEdit, showToast]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('error', '제목을 입력하세요');
      return;
    }
    if (!content.trim()) {
      showToast('error', '내용을 입력하세요');
      return;
    }
    if (!startAt || !endAt) {
      showToast('error', '날짜를 입력하세요');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setDateError('종료일은 시작일보다 이후여야 합니다');
      return;
    }
    setDateError('');
    setIsLoading(true);
    try {
      // datetime-local 값(로컬 KST)을 UTC ISO 문자열로 변환해 서버에 전달
      const payload = {
        title,
        content,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isActive,
      };
      if (isEdit) {
        await updateEvent(Number(eventId), payload);
        showToast('success', '저장되었습니다');
      } else {
        const created = await createEvent(payload);
        showToast('success', '생성되었습니다');
        navigate(`/events/${created.id}`, { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('INVALID_EVENT_DATE')) {
        showToast('error', '시작일은 종료일보다 이전이어야 합니다');
      } else {
        showToast('error', '저장에 실패했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(Number(eventId));
      showToast('success', '삭제되었습니다');
      navigate('/events');
    } catch {
      showToast('error', '삭제에 실패했습니다');
    }
  };

  if (isFetching) return <LoadingSpinner />;

  return (
    <div className="event-form">
      <h2 className="page-title">{isEdit ? '이벤트 수정' : '이벤트 생성'}</h2>

      <div className="form-card">
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="이벤트 제목"
          />
          <span className="char-count">{title.length}/200</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이벤트 내용"
            rows={8}
            maxLength={5000}
          />
          <span className="char-count">{content.length}/5000</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startAt">시작일시</label>
            <input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => { setStartAt(e.target.value); setDateError(''); }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endAt">종료일시</label>
            <input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => { setEndAt(e.target.value); setDateError(''); }}
            />
          </div>
        </div>
        {dateError && <p className="form-error">{dateError}</p>}

        <div className="form-group">
          <label>활성화</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="toggle__slider" />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn--secondary" onClick={() => navigate('/events')}>
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
        title="이벤트 삭제"
        message="이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
