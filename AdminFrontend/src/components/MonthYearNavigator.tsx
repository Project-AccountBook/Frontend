import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];

interface MonthYearNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MonthYearNavigator: React.FC<MonthYearNavigatorProps> = ({
  date,
  onDateChange,
  disabled = false,
  compact = false,
  className = '',
  style
}) => {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(date.getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const year = date.getFullYear();
  const month = date.getMonth();
  const label = `${year}년 ${month + 1}월`;

  useEffect(() => {
    if (!showMonthPicker) {
      setPickerYear(date.getFullYear());
    }
  }, [date, showMonthPicker]);

  useEffect(() => {
    if (!showMonthPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthPicker]);

  const shiftMonth = (delta: number) => {
    if (disabled) return;
    onDateChange(new Date(year, month + delta, 1));
  };

  const openMonthPicker = () => {
    if (disabled) return;
    setPickerYear(year);
    setShowMonthPicker(true);
  };

  const selectPickerMonth = (m: number) => {
    onDateChange(new Date(pickerYear, m, 1));
    setShowMonthPicker(false);
  };

  return (
    <div
      className={`dashboard-date-selector month-year-navigator${compact ? ' month-year-navigator--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <button
        type="button"
        className="dashboard-date-arrow"
        aria-label="이전 달"
        onClick={() => shiftMonth(-1)}
        disabled={disabled}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="cal-month-dropdown" ref={monthPickerRef}>
        <button
          type="button"
          className={`cal-month-label month-year-navigator-label${compact ? ' month-year-navigator-label--compact' : ''}`}
          onClick={openMonthPicker}
          title="년월 선택"
          disabled={disabled}
        >
          {label}
        </button>

        {showMonthPicker && !disabled && (
          <div className="cal-month-picker">
            <div className="cal-picker-year-row">
              <button
                type="button"
                className="cal-picker-year-btn"
                aria-label="이전 연도"
                onClick={() => setPickerYear((y) => y - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <span className="cal-picker-year-label">{pickerYear}년</span>
              <button
                type="button"
                className="cal-picker-year-btn"
                aria-label="다음 연도"
                onClick={() => setPickerYear((y) => y + 1)}
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                className="cal-picker-close"
                aria-label="닫기"
                onClick={() => setShowMonthPicker(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="cal-picker-months">
              {MONTHS.map((monthLabel, i) => (
                <button
                  key={monthLabel}
                  type="button"
                  className={`cal-picker-month-btn${pickerYear === year && i === month ? ' active' : ''}`}
                  onClick={() => selectPickerMonth(i)}
                >
                  {monthLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="dashboard-date-arrow"
        aria-label="다음 달"
        onClick={() => shiftMonth(1)}
        disabled={disabled}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
