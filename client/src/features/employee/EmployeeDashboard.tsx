import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  TrendingUp,
  Activity,
  ArrowRight,
  Play,
  Square,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Card,
  Button,
  Badge,
  ErrorState,
  Skeleton,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import { toast } from '../../components/Toast/toastStore.js';
import type { paths } from '../../types/api.js';

type EmployeeProfile =
  paths['/api/employee/profile']['get']['responses']['200']['content']['application/json'];
type Attendance =
  paths['/api/attendance/today']['get']['responses']['200']['content']['application/json']['attendance'];
type InsightsResponse =
  paths['/api/attendance/insights']['get']['responses']['200']['content']['application/json'];
type HistoryResponse =
  paths['/api/attendance/history']['get']['responses']['200']['content']['application/json'];
type HistoryItem = HistoryResponse['history'][number];

type LeaveBalanceResponse = {
  paid: { allocated: number; used: number; remaining: number };
  sick: { allocated: number; used: number; remaining: number };
  unpaid: { allocated: number; used: number; remaining: number };
};

type SalarySlipsResponse = {
  slips: Array<{
    id: string;
    employeeId: string;
    month: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    status: string;
  }>;
};

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

export function EmployeeDashboard() {
  const { user } = useAuth();

  // Data states
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<HistoryItem[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceResponse | null>(
    null,
  );
  const [latestSlip, setLatestSlip] = useState<
    SalarySlipsResponse['slips'][number] | null
  >(null);

  // Status/Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Active clock counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorText(null);

      // 1. Fetch Profile
      const profileData = await apiClient<EmployeeProfile>(
        '/api/employee/profile',
      );
      setProfile(profileData);

      // 2. Fetch Today's Attendance
      const attendanceData = await apiClient<{ attendance: Attendance }>(
        '/api/attendance/today',
      );
      setTodayAttendance(attendanceData.attendance);

      // 3. Fetch Insights (current month)
      const today = new Date();
      const todayStr = getLocalDateString(today);
      const [y, m] = todayStr.split('-');
      const startOfMonth = `${y}-${m}-01`;

      try {
        const insightsData = await apiClient<InsightsResponse>(
          `/api/attendance/insights?startDate=${startOfMonth}&endDate=${todayStr}`,
        );
        setInsights(insightsData);
      } catch {
        // Silent catch for secondary dashboard widget loads
      }

      // 4. Fetch Recent Logs (last 5)
      try {
        const historyData = await apiClient<HistoryResponse>(
          '/api/attendance/history?limit=5&offset=0',
        );
        setRecentLogs(historyData.history || []);
      } catch {
        // Silent catch for secondary dashboard widget loads
      }

      // 5. Fetch Leave Balance (Developer B)
      try {
        const leaveData =
          await apiClient<LeaveBalanceResponse>('/api/leave/balance');
        setLeaveBalance(leaveData);
      } catch {
        // Silent catch for secondary dashboard widget loads
      }

      // 6. Fetch Salary Slips (Developer B)
      try {
        const slipsData =
          await apiClient<SalarySlipsResponse>('/api/payroll/slips');
        if (slipsData.slips && slipsData.slips.length > 0) {
          const sorted = [...slipsData.slips].sort((a, b) =>
            b.month.localeCompare(a.month),
          );
          setLatestSlip(sorted[0]);
        }
      } catch {
        // Silent catch for secondary dashboard widget loads
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      setErrorText(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Live timer for active check-in
  useEffect(() => {
    let intervalId: any;
    if (todayAttendance && todayAttendance.checkIn) {
      if (!todayAttendance.checkOut) {
        const checkInTime = new Date(todayAttendance.checkIn).getTime();
        const updateTimer = () => {
          const diff = Math.floor((Date.now() - checkInTime) / 1000);
          setElapsedSeconds(diff > 0 ? diff : 0);
        };
        updateTimer();
        intervalId = setInterval(updateTimer, 1000);
      } else {
        const checkInTime = new Date(todayAttendance.checkIn).getTime();
        const checkOutTime = new Date(todayAttendance.checkOut).getTime();
        const diff = Math.floor((checkOutTime - checkInTime) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      }
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [todayAttendance]);

  // Attendance actions handlers
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
      toast.success('Successfully checked in!');
      fetchDashboardData();
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
      toast.success('Successfully checked out!');
      fetchDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-out failed';
      toast.error(message);
    } finally {
      setIsActionPending(false);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
        return <Badge variant="default">NOT CHECKED IN</Badge>;
    }
  };

  const isCheckedIn = !!todayAttendance;
  const isCheckedOut = !!todayAttendance?.checkOut;

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            alignItems: 'center',
          }}
        >
          <Skeleton
            style={{ width: '64px', height: '64px', borderRadius: '50%' }}
          />
          <div style={{ flex: 1 }}>
            <Skeleton
              style={{
                width: '200px',
                height: '24px',
                marginBottom: 'var(--space-2)',
              }}
            />
            <Skeleton style={{ width: '300px', height: '16px' }} />
          </div>
        </div>
        <div
          className="adaptive-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <Skeleton
            style={{ height: '200px', borderRadius: 'var(--radius-sm)' }}
          />
          <Skeleton
            style={{ height: '200px', borderRadius: 'var(--radius-sm)' }}
          />
          <Skeleton
            style={{ height: '200px', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      </div>
    );
  }

  if (errorText) {
    return (
      <ErrorState
        title="Dashboard Error"
        message={errorText}
        onRetry={fetchDashboardData}
      />
    );
  }

  const welcomeName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user?.email || 'Employee';

  return (
    <section style={{ padding: '0 var(--space-2)' }}>
      {/* 1. Header/Welcome Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-6)',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, var(--color-bg-surface) 0%, var(--color-bg-elevated) 100%)',
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-bg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid var(--color-border-interactive)',
          }}
        >
          {profile?.profileImage ? (
            <img
              src={profile.profileImage}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement
                  ?.querySelector('svg')
                  ?.setAttribute('style', 'display: block');
              }}
            />
          ) : null}
          <User
            size={36}
            className="text-secondary"
            style={{ display: profile?.profileImage ? 'none' : 'block' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h1
            className="main-title"
            style={{ fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}
          >
            Welcome back, {welcomeName}!
          </h1>
          <p
            className="subtitle"
            style={{
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            {profile?.designation && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                <Briefcase size={14} /> {profile.designation} (
                {profile.department || 'N/A'})
              </span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <Calendar size={14} /> Code: {profile?.employeeCode || 'N/A'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = '/profile')}
          >
            View Profile <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Card A: Today's Attendance Widget */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '220px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h2
                className="card-title"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <Clock size={18} className="text-primary" /> Today's Attendance
              </h2>
              {getStatusBadge(todayAttendance?.status)}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                margin: 'var(--space-4) 0',
                textAlign: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Check In
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                  {formatTime(todayAttendance?.checkIn)}
                </div>
              </div>
              <div
                style={{
                  borderLeft: '1px solid var(--color-border-subtle)',
                  height: '40px',
                }}
              ></div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Check Out
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                  {formatTime(todayAttendance?.checkOut)}
                </div>
              </div>
              <div
                style={{
                  borderLeft: '1px solid var(--color-border-subtle)',
                  height: '40px',
                }}
              ></div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Worked Hours
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {isCheckedIn ? formatElapsed(elapsedSeconds) : '00:00:00'}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              variant="primary"
              disabled={isCheckedIn || isActionPending}
              onClick={handleCheckIn}
              style={{ display: 'flex', gap: 'var(--space-2)' }}
            >
              <Play size={14} /> Check In
            </Button>
            <Button
              variant="secondary"
              disabled={!isCheckedIn || isCheckedOut || isActionPending}
              onClick={handleCheckOut}
              style={{ display: 'flex', gap: 'var(--space-2)' }}
            >
              <Square size={14} /> Check Out
            </Button>
          </div>
        </Card>

        {/* Card B: Monthly Attendance Summary */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '220px',
          }}
        >
          <div>
            <h2
              className="card-title"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <TrendingUp size={18} className="text-primary" /> Attendance
              Insights (This Month)
            </h2>

            {insights ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr',
                  gap: 'var(--space-4)',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    borderRight: '1px solid var(--color-border-subtle)',
                    paddingRight: 'var(--space-4)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: 'var(--color-success)',
                      lineHeight: '1.2',
                    }}
                  >
                    {insights.summary.onTimeRate !== null
                      ? `${insights.summary.onTimeRate}%`
                      : '--'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Attendance Rate
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div className="kv-row" style={{ padding: '0.25rem 0' }}>
                    <span className="kv-label" style={{ fontSize: '0.75rem' }}>
                      Late Check-ins
                    </span>
                    <Badge
                      variant={
                        insights.summary.lateDays > 0 ? 'warning' : 'success'
                      }
                    >
                      {insights.summary.lateDays}
                    </Badge>
                  </div>
                  <div className="kv-row" style={{ padding: '0.25rem 0' }}>
                    <span className="kv-label" style={{ fontSize: '0.75rem' }}>
                      Absent Days
                    </span>
                    <Badge
                      variant={
                        insights.summary.absentDays > 0 ? 'error' : 'success'
                      }
                    >
                      {insights.summary.absentDays}
                    </Badge>
                  </div>
                  <div className="kv-row" style={{ padding: '0.25rem 0' }}>
                    <span className="kv-label" style={{ fontSize: '0.75rem' }}>
                      Total Worked Days
                    </span>
                    <Badge variant="default" style={{ fontWeight: 600 }}>
                      {insights.summary.presentDays}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100px',
                }}
              >
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                  No insights data available.
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/attendance')}
              style={{ width: '100%' }}
            >
              Detailed Logs & Analytics <ArrowRight size={14} />
            </Button>
          </div>
        </Card>

        {/* Card C: Leave Balance Summary */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '220px',
          }}
        >
          <div>
            <h2
              className="card-title"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <Award size={18} className="text-primary" /> Leave Balance
            </h2>

            {leaveBalance ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      Paid Leave
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Used {leaveBalance.paid.used} /{' '}
                      {leaveBalance.paid.allocated} Days
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--color-success)',
                    }}
                  >
                    {leaveBalance.paid.remaining}{' '}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      left
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      Sick Leave
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Used {leaveBalance.sick.used} /{' '}
                      {leaveBalance.sick.allocated} Days
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--color-info)',
                    }}
                  >
                    {leaveBalance.sick.remaining}{' '}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      left
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100px',
                }}
              >
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                  No leave balance data available.
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/leave')}
              style={{ width: '100%' }}
            >
              Apply / View Leave Requests <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Secondary Row Grid */}
      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Card D: Recent Activity Log */}
        <Card style={{ minHeight: '260px' }}>
          <h2
            className="card-title"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Activity size={18} className="text-primary" /> Recent Attendance
            Logs
          </h2>

          {recentLogs.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              {recentLogs.map((log) => {
                const dateVal = new Date(log.date);
                const dateFormatted = dateVal.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {dateFormatted}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        In: {formatTime(log.checkIn)} | Out:{' '}
                        {formatTime(log.checkOut)}
                      </div>
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
              }}
            >
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                No recent attendance logs.
              </span>
            </div>
          )}
        </Card>

        {/* Card E: Salary Slip Quick Preview */}
        <Card
          style={{
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              className="card-title"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <DollarSign size={18} className="text-primary" /> Latest Payslip
              Summary
            </h2>

            {latestSlip ? (
              <div
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {latestSlip.month}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Salary Period
                    </div>
                  </div>
                  <Badge
                    variant={
                      latestSlip.status === 'PAID' ? 'success' : 'warning'
                    }
                  >
                    {latestSlip.status}
                  </Badge>
                </div>

                <div className="kv-row" style={{ padding: '0.25rem 0' }}>
                  <span className="kv-label">Basic Salary</span>
                  <span className="kv-value" style={{ fontWeight: 600 }}>
                    ${latestSlip.basicSalary}
                  </span>
                </div>
                <div className="kv-row" style={{ padding: '0.25rem 0' }}>
                  <span className="kv-label">Allowances</span>
                  <span
                    className="kv-value"
                    style={{ color: 'var(--color-success)', fontWeight: 600 }}
                  >
                    +${latestSlip.allowances}
                  </span>
                </div>
                <div className="kv-row" style={{ padding: '0.25rem 0' }}>
                  <span className="kv-label">Deductions</span>
                  <span
                    className="kv-value"
                    style={{ color: 'var(--color-danger)', fontWeight: 600 }}
                  >
                    -${latestSlip.deductions}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: '1px dashed var(--color-border-interactive)',
                    margin: 'var(--space-2) 0',
                  }}
                ></div>
                <div
                  className="kv-row"
                  style={{ padding: '0.25rem 0', fontWeight: 700 }}
                >
                  <span className="kv-label">Net Pay</span>
                  <span className="kv-value" style={{ fontSize: '1.125rem' }}>
                    ${latestSlip.netSalary}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '120px',
                }}
              >
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                  No payslip available.
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/payroll/slips')}
              style={{ width: '100%' }}
            >
              View All Salary Slips <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
