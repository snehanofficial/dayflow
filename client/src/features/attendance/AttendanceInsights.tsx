import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, HelpCircle } from 'lucide-react';
import {
  Card,
  Button,
  ErrorState,
  EmptyState,
  Input,
  Label,
  Skeleton,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import type { paths } from '../../types/api.js';

type InsightsResponse =
  paths['/api/attendance/insights']['get']['responses']['200']['content']['application/json'];
type BreakdownItem = InsightsResponse['breakdown'][number];

// Helper to get local date string YYYY-MM-DD in Asia/Kolkata timezone
function getLocalDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

export function AttendanceInsights() {
  const [period, setPeriod] = useState<
    | 'current-month'
    | 'previous-month'
    | 'last-30-days'
    | 'current-year'
    | 'custom'
  >('current-month');

  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Custom range input state (only applied when clicking apply or on change)
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Data states
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recalculate date range based on selected period
  const updateDatesForPeriod = useCallback(
    (selectedPeriod: typeof period) => {
      const today = new Date();
      const todayStr = getLocalDateString(today);

      if (selectedPeriod === 'current-month') {
        const [y, m] = todayStr.split('-');
        setStartDate(`${y}-${m}-01`);
        setEndDate(todayStr);
      } else if (selectedPeriod === 'previous-month') {
        const [yStr, mStr] = todayStr.split('-');
        let year = parseInt(yStr, 10);
        let month = parseInt(mStr, 10) - 1;
        if (month === 0) {
          month = 12;
          year -= 1;
        }
        const mm = String(month).padStart(2, '0');
        const start = `${year}-${mm}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
        setStartDate(start);
        setEndDate(end);
      } else if (selectedPeriod === 'last-30-days') {
        const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
        setStartDate(getLocalDateString(start));
        setEndDate(todayStr);
      } else if (selectedPeriod === 'current-year') {
        const [y] = todayStr.split('-');
        setStartDate(`${y}-01-01`);
        setEndDate(todayStr);
      } else if (selectedPeriod === 'custom') {
        // Keep existing custom dates
        setStartDate(customStart);
        setEndDate(customEnd);
      }
    },
    [customStart, customEnd],
  );

  // Effect to update dates when period changes
  useEffect(() => {
    updateDatesForPeriod(period);
  }, [period, updateDatesForPeriod]);

  // Fetch insights from API
  const fetchInsights = useCallback(async () => {
    if (!startDate || !endDate) return;

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be less than or equal to end date');
      setInsights(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient<InsightsResponse>(
        '/api/attendance/insights',
        {
          params: { startDate, endDate },
        },
      );
      setInsights(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load insights';
      setError(message);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handlePeriodChange = (val: typeof period) => {
    setPeriod(val);
    if (val === 'custom') {
      // Default custom to current month
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const [y, m] = todayStr.split('-');
      setCustomStart(`${y}-${m}-01`);
      setCustomEnd(todayStr);
      setStartDate(`${y}-${m}-01`);
      setEndDate(todayStr);
    }
  };

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      setStartDate(customStart);
      setEndDate(customEnd);
    }
  };

  const formatPercentage = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    return `${val}%`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      {/* Control Bar: Selector & Refresher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Label htmlFor="insight-period" className="sr-only">
              Select Analysis Period
            </Label>
            <select
              id="insight-period"
              value={period}
              onChange={(e) =>
                handlePeriodChange(e.target.value as typeof period)
              }
              className="form-input"
              style={{
                minWidth: '180px',
                height: '36px',
                padding: '0 var(--space-2)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <option value="current-month">Current Month</option>
              <option value="previous-month">Previous Month</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="current-year">Current Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Label htmlFor="customStart" className="sr-only">
                  Start Date
                </Label>
                <Input
                  id="customStart"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{ height: '36px' }}
                />
              </div>
              <span
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                to
              </span>
              <div>
                <Label htmlFor="customEnd" className="sr-only">
                  End Date
                </Label>
                <Input
                  id="customEnd"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{ height: '36px' }}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleApplyCustomRange}
                disabled={!customStart || !customEnd}
                style={{
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={fetchInsights}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1.5)',
            height: '36px',
            fontSize: '0.75rem',
          }}
          aria-label="Refresh attendance insights"
        >
          <RefreshCw size={14} />
          Refresh Insights
        </Button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
          aria-busy="true"
          aria-live="polite"
        >
          {/* Card row skeleton */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Card
                key={i}
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <Skeleton width="80px" height="12px" />
                <Skeleton width="40px" height="24px" />
              </Card>
            ))}
          </div>
          {/* Body content skeleton */}
          <Card
            style={{
              height: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              padding: 'var(--space-4)',
            }}
          >
            <Skeleton width="200px" height="20px" />
            <Skeleton width="100%" height="100%" />
          </Card>
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-4) 0' }}>
          <ErrorState
            title="Insights Error"
            message={error}
            onRetry={fetchInsights}
          />
        </div>
      ) : !insights ? (
        <div style={{ padding: 'var(--space-4) 0' }}>
          <EmptyState
            title="No Insights Available"
            description="Select a different range to calculate metrics."
          />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Metrics Summary Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <Card
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                Recorded Days
              </span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {insights.summary.recordedDays}
              </span>
            </Card>

            <Card
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                Present Days
              </span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-success)',
                }}
              >
                {insights.summary.presentDays}
              </span>
            </Card>

            <Card
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                Late Days
              </span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-warning)',
                }}
              >
                {insights.summary.lateDays}
              </span>
            </Card>

            <Card
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  Absent Days
                </span>
                <div
                  style={{ position: 'relative', cursor: 'help' }}
                  title="Absences are not auto-reconciled by the system. Contact HR to adjust records."
                >
                  <HelpCircle
                    size={12}
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                }}
              >
                N/A
              </span>
            </Card>

            <Card
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                On-Time Rate
              </span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color:
                    insights.summary.onTimeRate &&
                    insights.summary.onTimeRate >= 90
                      ? 'var(--color-success)'
                      : 'var(--color-text-primary)',
                }}
              >
                {formatPercentage(insights.summary.onTimeRate)}
              </span>
            </Card>
          </div>

          {/* Trend Visualization Grid */}
          <Card>
            <h3
              className="card-title"
              style={{
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Attendance Trend & Daily Timeline
            </h3>

            {insights.breakdown.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 'var(--space-6) 0',
                }}
              >
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  No historical entries in selected period.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                {/* Timeline Flex Grid */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: 'var(--space-2) 0',
                  }}
                >
                  {insights.breakdown.map((day: BreakdownItem) => {
                    let color = 'var(--color-bg-tertiary)';
                    if (day.status === 'PRESENT')
                      color = 'var(--color-success)';
                    else if (day.status === 'LATE')
                      color = 'var(--color-warning)';
                    else if (day.status === 'HALF_DAY')
                      color = 'var(--color-info)';
                    else if (day.status === 'ABSENT')
                      color = 'var(--color-error)';

                    return (
                      <div
                        key={day.date}
                        style={{
                          width: '14px',
                          height: '14px',
                          backgroundColor: color,
                          borderRadius: '2px',
                          cursor: 'pointer',
                        }}
                        title={`Date: ${day.date} | Status: ${day.status}`}
                        aria-label={`Attendance for ${day.date} was ${day.status}`}
                        role="img"
                      />
                    );
                  })}
                </div>

                {/* Timeline Legend */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-3)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Legend:</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'var(--color-success)',
                        borderRadius: '2px',
                      }}
                    />
                    <span>Present (On-Time)</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'var(--color-warning)',
                        borderRadius: '2px',
                      }}
                    />
                    <span>Late</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'var(--color-info)',
                        borderRadius: '2px',
                      }}
                    />
                    <span>Half Day</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default AttendanceInsights;
