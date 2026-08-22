import { useState } from 'react';
import { clsx } from 'clsx';
import { Dialog, Badge } from '../../components/ui/index.js';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  remarks?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  user?: {
    email: string;
  };
}

interface LeaveCalendarProps {
  requests: LeaveRequest[];
  isHrView?: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function LeaveCalendar({
  requests,
  isHrView = false,
}: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Date range calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const cells: { day: number; date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevDate = new Date(
      month === 0 ? year - 1 : year,
      month === 0 ? 11 : month - 1,
      d,
    );
    cells.push({ day: d, date: prevDate, isCurrentMonth: false });
  }

  // Current month cells
  for (let d = 1; d <= totalDays; d++) {
    const currDate = new Date(year, month, d);
    cells.push({ day: d, date: currDate, isCurrentMonth: true });
  }

  // Next month padding cells
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(
      month === 11 ? year + 1 : year,
      month === 11 ? 0 : month + 1,
      d,
    );
    cells.push({ day: d, date: nextDate, isCurrentMonth: false });
  }

  // Filter leaves active on a specific cell date
  const getLeavesForDate = (date: Date) => {
    const target = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();

    return requests.filter((req) => {
      const start = new Date(req.startDate);
      const startTime = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      ).getTime();

      const end = new Date(req.endDate);
      const endTime = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
      ).getTime();

      return target >= startTime && target <= endTime;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatLocalDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return (
          <Badge variant="success">
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCircle size={10} /> Approved
            </span>
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="error">
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <XCircle size={10} /> Rejected
            </span>
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge variant="warning">
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Clock size={10} /> Pending
            </span>
          </Badge>
        );
    }
  };

  return (
    <div className="calendar-container">
      {/* Calendar Header Control bar */}
      <div className="calendar-header">
        <div className="calendar-title-wrapper">
          <CalendarIcon size={16} className="text-primary" />
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
            Calendar View
          </h2>
        </div>
        <div className="calendar-nav-buttons">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="calendar-month-year-label">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            style={{
              width: 'auto',
              padding: '0 var(--space-3)',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
            onClick={handleToday}
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid Box */}
      <div className="calendar-grid">
        {/* Weekday Labels */}
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {/* Days Cells */}
        {cells.map((cell, idx) => {
          const dateLeaves = getLeavesForDate(cell.date);
          const cellToday = isToday(cell.date);

          return (
            <div
              key={idx}
              className={clsx(
                'calendar-cell',
                !cell.isCurrentMonth && 'inactive',
                cellToday && 'today',
              )}
            >
              <span className="calendar-day-number">{cell.day}</span>
              <div className="calendar-events-list">
                {dateLeaves.map((leave) => {
                  const status = leave.status.toUpperCase();
                  const pillClass =
                    status === 'APPROVED'
                      ? 'calendar-event-approved'
                      : status === 'REJECTED'
                        ? 'calendar-event-rejected'
                        : 'calendar-event-pending';

                  // Display detail strings based on user role
                  const displayLabel = isHrView
                    ? `${leave.user?.email.split('@')[0] || leave.employeeId}: ${leave.leaveType}`
                    : leave.leaveType;

                  return (
                    <button
                      key={leave.id}
                      type="button"
                      className={clsx('calendar-event-pill', pillClass)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(leave);
                        setIsModalOpen(true);
                      }}
                      title={`${leave.leaveType} leave - Click for details`}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Legend indicators */}
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <div
            className="calendar-legend-color"
            style={{ backgroundColor: 'var(--color-success)' }}
          />
          <span>Approved</span>
        </div>
        <div className="calendar-legend-item">
          <div
            className="calendar-legend-color"
            style={{ backgroundColor: 'var(--color-warning)' }}
          />
          <span>Pending</span>
        </div>
        <div className="calendar-legend-item">
          <div
            className="calendar-legend-color"
            style={{ backgroundColor: 'var(--color-danger)' }}
          />
          <span>Rejected</span>
        </div>
      </div>

      {/* Event Details Dialog Modal */}
      {selectedRequest && (
        <Dialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Leave Request Details"
        >
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div
              className="kv-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span style={{ fontWeight: 600 }}>Employee ID</span>
              <span>{selectedRequest.employeeId}</span>
            </div>
            {selectedRequest.user?.email && (
              <div
                className="kv-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  paddingBottom: 'var(--space-2)',
                }}
              >
                <span style={{ fontWeight: 600 }}>Email Address</span>
                <span>{selectedRequest.user.email}</span>
              </div>
            )}
            <div
              className="kv-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span style={{ fontWeight: 600 }}>Leave Type</span>
              <span style={{ fontWeight: 600 }}>
                {selectedRequest.leaveType}
              </span>
            </div>
            <div
              className="kv-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span style={{ fontWeight: 600 }}>Date Range</span>
              <span>
                {formatLocalDate(selectedRequest.startDate)} -{' '}
                {formatLocalDate(selectedRequest.endDate)}
              </span>
            </div>
            <div
              className="kv-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span style={{ fontWeight: 600 }}>Current Status</span>
              <span>{getStatusBadge(selectedRequest.status)}</span>
            </div>
            <div
              className="kv-row"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span style={{ fontWeight: 600 }}>Reason</span>
              <p
                style={{
                  margin: 0,
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--color-bg-canvas)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {selectedRequest.reason}
              </p>
            </div>
            {selectedRequest.remarks && (
              <div
                className="kv-row"
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <span style={{ fontWeight: 600 }}>HR Comments</span>
                <p
                  style={{
                    margin: 0,
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--color-bg-canvas)',
                    borderRadius: 'var(--radius-xs)',
                    fontStyle: 'italic',
                  }}
                >
                  {selectedRequest.remarks}
                </p>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-2)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  height: 'var(--min-touch-target)',
                  padding: '0 var(--space-4)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border-subtle)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
