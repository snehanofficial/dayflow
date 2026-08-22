import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AttendanceInsights } from './AttendanceInsights.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Card,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  Input,
  Label,
  Badge,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import { toast } from '../../components/Toast/toastStore.js';
import type { paths } from '../../types/api.js';

type Attendance =
  paths['/api/attendance/today']['get']['responses']['200']['content']['application/json']['attendance'];
type HistoryResponse =
  paths['/api/attendance/history']['get']['responses']['200']['content']['application/json'];
type HistoryItem = HistoryResponse['history'][number];

export function AttendancePage() {
  const { user } = useAuth();

  // Today's attendance states
  const [todayAttendance, setTodayAttendance] = useState<Attendance>(null);
  const [isTodayLoading, setIsTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // History states
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Filters and Pagination
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch today's status
  const fetchTodayStatus = useCallback(async () => {
    try {
      setIsTodayLoading(true);
      setTodayError(null);
      const data = await apiClient<{ attendance: Attendance }>(
        '/api/attendance/today',
      );
      setTodayAttendance(data.attendance);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load attendance';
      setTodayError(message);
    } finally {
      setIsTodayLoading(false);
    }
  }, []);

  // Fetch history list
  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      setHistoryError(null);

      const params: Record<string, string> = {
        limit: String(limit),
        offset: String((page - 1) * limit),
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Validate range client side first
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setHistoryError('Start date must be less than or equal to end date');
        setIsHistoryLoading(false);
        return;
      }

      const data = await apiClient<HistoryResponse>('/api/attendance/history', {
        params,
      });
      setHistory(data.history || []);
      setTotalRecords(data.pagination.total);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load attendance history';
      setHistoryError(message);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [page, startDate, endDate]);

  // Combine initial loads and page changes
  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Actions handlers
  const handleCheckIn = async () => {
    try {
      setIsActionPending(true);
      const data = await apiClient<{ attendance: Attendance }>(
        '/api/attendance/check-in',
        {
          method: 'POST',
        },
      );
      setTodayAttendance(data.attendance);
      toast.success('Checked in successfully.');
      // Refresh history list to include the new check-in
      fetchHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      toast.error(message);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsActionPending(true);
      const data = await apiClient<{ attendance: Attendance }>(
        '/api/attendance/check-out',
        {
          method: 'POST',
        },
      );
      setTodayAttendance(data.attendance);
      toast.success('Checked out successfully.');
      // Refresh history
      fetchHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-out failed';
      toast.error(message);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (
    status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY',
  ) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">PRESENT</Badge>;
      case 'LATE':
        return <Badge variant="warning">LATE</Badge>;
      case 'HALF_DAY':
        return <Badge variant="info">HALF DAY</Badge>;
      case 'ABSENT':
        return <Badge variant="error">ABSENT</Badge>;
      default:
        return null;
    }
  };

  const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);

  // Derive today's action state
  const isCheckedIn = !!todayAttendance;
  const isCheckedOut = !!todayAttendance?.checkOut;

  return (
    <section
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: 'var(--space-4) 0',
      }}
    >
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="main-title">Attendance Portal</h1>
        <p className="subtitle">
          Log daily work hours and review history logs.
        </p>
      </div>

      {/* Grid containing Today's Checkin and Controls */}
      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Today's Card */}
        <Card style={{ position: 'relative' }}>
          <h2
            className="card-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Clock size={18} />
            Today's Attendance
          </h2>

          {isTodayLoading ? (
            <div style={{ padding: 'var(--space-6) 0' }}>
              <LoadingState message="Loading attendance status..." />
            </div>
          ) : todayError ? (
            <div style={{ padding: 'var(--space-4) 0' }}>
              <ErrorState
                title="Error Loading Status"
                message={todayError}
                onRetry={fetchTodayStatus}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                marginTop: 'var(--space-4)',
              }}
            >
              {/* Status details */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <div className="kv-row">
                  <span className="kv-label">Date</span>
                  <span className="kv-value">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="kv-row">
                  <span className="kv-label">Status</span>
                  <span className="kv-value">
                    {todayAttendance ? (
                      getStatusBadge(todayAttendance.status)
                    ) : (
                      <Badge variant="default">Not Checked In</Badge>
                    )}
                  </span>
                </div>

                <div className="kv-row">
                  <span className="kv-label">Check In</span>
                  <span className="kv-value" style={{ fontWeight: 600 }}>
                    {formatTime(todayAttendance?.checkIn)}
                  </span>
                </div>

                <div className="kv-row">
                  <span className="kv-label">Check Out</span>
                  <span className="kv-value" style={{ fontWeight: 600 }}>
                    {formatTime(todayAttendance?.checkOut)}
                  </span>
                </div>
              </div>

              {/* Actions Section */}
              <div
                style={{
                  marginTop: 'var(--space-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                {!isCheckedIn ? (
                  <Button
                    variant="primary"
                    onClick={handleCheckIn}
                    disabled={isActionPending}
                    style={{ width: '100%', justifyContent: 'center' }}
                    aria-label="Submit check-in for today"
                  >
                    {isActionPending ? 'Checking In...' : 'Check In'}
                  </Button>
                ) : !isCheckedOut ? (
                  <Button
                    variant="secondary"
                    onClick={handleCheckOut}
                    disabled={isActionPending}
                    style={{ width: '100%', justifyContent: 'center' }}
                    aria-label="Submit check-out for today"
                  >
                    {isActionPending ? 'Checking Out...' : 'Check Out'}
                  </Button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-success-bg)',
                      color: 'var(--color-success-text)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    <CheckCircle size={16} />
                    Attendance Completed Today
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Informative Guidance Card */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              className="card-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={18} />
              Portal Guidelines
            </h2>
            <ul
              style={{
                paddingLeft: 'var(--space-4)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-4)',
              }}
            >
              <li>Employees can submit check-in once per calendar day.</li>
              <li>
                Late threshold is configured at exactly 09:00 AM. Any check-ins
                logged from 09:01 AM onward are automatically flagged as LATE.
              </li>
              <li>
                A check-out cannot be modified once successfully recorded.
              </li>
              <li>
                Contact HR support if you need manual adjustments to history
                logs.
              </li>
            </ul>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-3)',
              marginTop: 'var(--space-4)',
            }}
          >
            Logged in as employee:{' '}
            <span style={{ fontWeight: 600 }}>{user?.email}</span>
          </div>
        </Card>
      </div>

      {/* Attendance Insights Section */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <AttendanceInsights />
      </div>

      {/* History Log Section */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h2
            className="card-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 0,
            }}
          >
            <Calendar size={18} />
            Attendance History Log
          </h2>

          <Button
            variant="secondary"
            onClick={fetchHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1.5)',
              height: 32,
              fontSize: '0.75rem',
            }}
            aria-label="Refresh history records"
          >
            <RefreshCw size={12} />
            Refresh Log
          </Button>
        </div>

        {/* Filter controls */}
        <div
          className="adaptive-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            alignItems: 'end',
          }}
        >
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{ marginTop: 'var(--space-1)' }}
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{ marginTop: 'var(--space-1)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              onClick={handleFilterReset}
              disabled={!startDate && !endDate}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Table / Cards Area */}
        {isHistoryLoading ? (
          <div style={{ padding: 'var(--space-8) 0' }}>
            <LoadingState message="Loading attendance logs..." />
          </div>
        ) : historyError ? (
          <div style={{ padding: 'var(--space-4) 0' }}>
            <ErrorState
              title="History Error"
              message={historyError}
              onRetry={fetchHistory}
            />
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: 'var(--space-4) 0' }}>
            <EmptyState
              title="No Attendance Records Found"
              description="Log check-ins or modify search date filters to find matching logs."
            />
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="responsive-table-wrapper">
              <table className="adaptive-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Date" style={{ fontWeight: 500 }}>
                        {new Date(
                          row.date + 'T00:00:00.000Z',
                        ).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC', // Ensure it doesn't shift timezone locally
                        })}
                      </td>
                      <td
                        data-label="Check In"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {formatTime(row.checkIn)}
                      </td>
                      <td
                        data-label="Check Out"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {row.checkOut ? formatTime(row.checkOut) : '--:--'}
                      </td>
                      <td data-label="Status">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Showing Page {page} of {totalPages} ({totalRecords} total
                  logs)
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      height: 32,
                      padding: '0 var(--space-3)',
                    }}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      height: 32,
                      padding: '0 var(--space-3)',
                    }}
                    aria-label="Go to next page"
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informational manual adjustment notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-6)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            borderLeft: '3px solid var(--color-info)',
          }}
        >
          <Info
            size={16}
            style={{ color: 'var(--color-info)', flexShrink: 0 }}
          />
          <span>
            <strong>Need to correct an attendance record?</strong> Contact HR
            support for manual adjustments to your attendance history.
          </span>
        </div>
      </Card>
    </section>
  );
}

export default AttendancePage;
