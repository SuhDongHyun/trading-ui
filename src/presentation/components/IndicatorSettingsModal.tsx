import { useEffect, useState, type FormEvent } from 'react';
import type { IndicatorSettings } from '../../domain/stock';

type IndicatorSettingsModalProps = {
  open: boolean;
  settings: IndicatorSettings;
  onClose: () => void;
  onApply: (settings: IndicatorSettings) => void;
};

export function IndicatorSettingsModal({ open, settings, onClose, onApply }: IndicatorSettingsModalProps) {
  const [draft, setDraft] = useState({
    movingAverageWindows: settings.movingAverageWindows.join(', '),
    rsiWindow: settings.rsiWindow,
    rsiSignalEmaWindow: settings.rsiSignalEmaWindow,
    macdShortWindow: settings.macdShortWindow,
    macdLongWindow: settings.macdLongWindow,
  });

  useEffect(() => {
    if (open) {
      setDraft({
        movingAverageWindows: settings.movingAverageWindows.join(', '),
        rsiWindow: settings.rsiWindow,
        rsiSignalEmaWindow: settings.rsiSignalEmaWindow,
        macdShortWindow: settings.macdShortWindow,
        macdLongWindow: settings.macdLongWindow,
      });
    }
  }, [open, settings]);

  if (!open) {
    return null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const movingAverageWindows = draft.movingAverageWindows
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 6);
    onApply({
      movingAverageWindows: movingAverageWindows.length > 0 ? movingAverageWindows : settings.movingAverageWindows,
      rsiWindow: clampPositiveInteger(draft.rsiWindow, settings.rsiWindow),
      rsiSignalEmaWindow: clampPositiveInteger(draft.rsiSignalEmaWindow, settings.rsiSignalEmaWindow),
      macdShortWindow: clampPositiveInteger(draft.macdShortWindow, settings.macdShortWindow),
      macdLongWindow: clampPositiveInteger(draft.macdLongWindow, settings.macdLongWindow),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="settings-title">지표 설정</h2>
          <button type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={submit} className="settings-form">
          <label>
            이동평균 window
            <input
              value={draft.movingAverageWindows}
              onChange={(event) => setDraft({ ...draft, movingAverageWindows: event.target.value })}
              placeholder="5, 20, 60, 120"
            />
          </label>
          <label>
            RSI window
            <input
              type="number"
              min="1"
              value={draft.rsiWindow}
              onChange={(event) => setDraft({ ...draft, rsiWindow: Number(event.target.value) })}
            />
          </label>
          <label>
            Signal EMA
            <input
              type="number"
              min="1"
              value={draft.rsiSignalEmaWindow}
              onChange={(event) => setDraft({ ...draft, rsiSignalEmaWindow: Number(event.target.value) })}
            />
          </label>
          <label>
            MACD short EMA
            <input
              type="number"
              min="1"
              value={draft.macdShortWindow}
              onChange={(event) => setDraft({ ...draft, macdShortWindow: Number(event.target.value) })}
            />
          </label>
          <label>
            MACD long EMA
            <input
              type="number"
              min="1"
              value={draft.macdLongWindow}
              onChange={(event) => setDraft({ ...draft, macdLongWindow: Number(event.target.value) })}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              취소
            </button>
            <button type="submit">적용</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function clampPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }
  return Math.round(value);
}
