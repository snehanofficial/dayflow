import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import {
  Card,
  Button,
  Badge,
  Input,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import {
  Users,
  Activity,
  Calendar,
  CreditCard,
  Printer,
  Search,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendancePercentage: number;
  pendingLeavesCount: number;
  payrollTotal: number;
}

interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  leave: number;
}

interface LeaveDistribution {
  paid: number;
  sick: number;
  unpaid: number;
}

interface DepartmentDistribution {
  department: string;
  count: number;
}

interface PayrollSummary {
  department: string;
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  charts: {
    attendanceTrend: AttendanceTrendPoint[];
    leaveDistribution: LeaveDistribution;
    departmentDistribution: DepartmentDistribution[];
    payrollSummary: PayrollSummary[];
  };
}

interface ReportResponse {
  type: string;
  data: any[];
}

export function HrAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<
    'attendance' | 'leave' | 'payroll'
  >('attendance');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Dashboard Analytics Data
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardData>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => apiClient<DashboardData>('/api/analytics/dashboard'),
  });

  // 2. Fetch Tabular Report Data
  const {
    data: report,
    isLoading: isReportLoading,
    refetch: refetchReport,
  } = useQuery<ReportResponse>({
    queryKey: ['analytics', 'reports', activeTab],
    queryFn: () =>
      apiClient<ReportResponse>(`/api/analytics/reports?type=${activeTab}`),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrintReport = () => {
    const printContent = document.getElementById('printable-report-area');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #000; background: #fff;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Dayflow HRMS - Business Intelligence</h1>
        <h3 style="font-size: 16px; color: #666; margin-bottom: 24px; text-transform: capitalize;">${activeTab} Register Audit Log</h3>
        ${printContent.innerHTML}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (dashboardError) {
    return (
      <section style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Failed to Load Analytics"
          message="An error occurred while fetching company intelligence aggregates."
          onRetry={() => {
            refetchDashboard();
            refetchReport();
          }}
        />
      </section>
    );
  }

  // Filtered report data
  const filteredData =
    report?.data.filter((item: any) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        item.employeeId?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.department?.toLowerCase().includes(query)
      );
    }) || [];

  return (
    <section>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="main-title">HR Intelligence Dashboard</h1>
        <p className="subtitle">
          Real-time indicators of organization metrics, payroll allocations, and
          workforce attendance registers.
        </p>
      </div>

      {isDashboardLoading || !dashboard ? (
        <LoadingState message="Aggregating company metrics..." />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Top KPI Metrics Cards */}
          <div
            className="adaptive-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {/* Total Employees */}
            <Card
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  Total Headcount
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {dashboard.metrics.totalEmployees}
                </div>
              </div>
            </Card>

            {/* Attendance % */}
            <Card
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'var(--color-success-light)',
                  color: 'var(--color-success)',
                }}
              >
                <Activity size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  Today's Attendance
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
                >
                  <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {dashboard.metrics.attendancePercentage}%
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    ({dashboard.metrics.presentToday} present)
                  </span>
                </div>
              </div>
            </Card>

            {/* On Leave Today */}
            <Card
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'var(--color-warning-light)',
                  color: 'var(--color-warning)',
                }}
              >
                <Calendar size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  Active Outages
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
                >
                  <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {dashboard.metrics.onLeaveToday}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    on leave today
                  </span>
                </div>
              </div>
            </Card>

            {/* Payroll Budget */}
            <Card
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'var(--color-error-light)',
                  color: 'var(--color-error)',
                }}
              >
                <CreditCard size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  Monthly Net Payroll
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {formatCurrency(dashboard.metrics.payrollTotal)}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div
            className="adaptive-grid"
            style={{
              gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 0.8fr)',
              gap: 'var(--space-6)',
            }}
          >
            {/* Native SVG line chart for Attendance Trend */}
            <Card style={{ display: 'flex', flexDirection: 'column' }}>
              <h3
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Workforce Outages (7-Day Trend)
              </h3>
              <div
                style={{
                  flex: 1,
                  minHeight: 220,
                  display: 'flex',
                  alignItems: 'flex-end',
                  position: 'relative',
                  padding: '0 20px 30px 40px',
                }}
              >
                {/* SVG Line representation */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 40,
                    width: 'calc(100% - 60px)',
                    height: 'calc(100% - 40px)',
                    overflow: 'visible',
                  }}
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
                    <line
                      key={idx}
                      x1="0%"
                      y1={`${r * 100}%`}
                      x2="100%"
                      y2={`${r * 100}%`}
                      stroke="var(--color-border)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Draw Present line */}
                  {(() => {
                    const maxVal = Math.max(
                      1,
                      ...dashboard.charts.attendanceTrend.map(
                        (t) => t.present + t.leave + t.absent + 2,
                      ),
                    );
                    const points = dashboard.charts.attendanceTrend
                      .map((t, idx) => {
                        const x = (idx / 6) * 100;
                        const y = 100 - (t.present / maxVal) * 100;
                        return `${x}%,${y}%`;
                      })
                      .join(' ');
                    return (
                      <polyline
                        fill="none"
                        stroke="var(--color-success)"
                        strokeWidth={3}
                        points={points}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })()}

                  {/* Draw On-Leave line */}
                  {(() => {
                    const maxVal = Math.max(
                      1,
                      ...dashboard.charts.attendanceTrend.map(
                        (t) => t.present + t.leave + t.absent + 2,
                      ),
                    );
                    const points = dashboard.charts.attendanceTrend
                      .map((t, idx) => {
                        const x = (idx / 6) * 100;
                        const y = 100 - (t.leave / maxVal) * 100;
                        return `${x}%,${y}%`;
                      })
                      .join(' ');
                    return (
                      <polyline
                        fill="none"
                        stroke="var(--color-warning)"
                        strokeWidth={3}
                        points={points}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })()}
                </svg>

                {/* X Axis Labels */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 5,
                    left: 40,
                    right: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {dashboard.charts.attendanceTrend.map((t, idx) => {
                    const date = new Date(t.date);
                    const label = date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                    });
                    return <span key={idx}>{label}</span>;
                  })}
                </div>

                {/* Y Axis Legend */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 10,
                    bottom: 30,
                    width: 30,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {(() => {
                    const maxVal = Math.max(
                      1,
                      ...dashboard.charts.attendanceTrend.map(
                        (t) => t.present + t.leave + t.absent + 2,
                      ),
                    );
                    return [
                      maxVal,
                      Math.round(maxVal * 0.75),
                      Math.round(maxVal * 0.5),
                      Math.round(maxVal * 0.25),
                      0,
                    ].map((v, i) => <span key={i}>{v}</span>);
                  })()}
                </div>
              </div>

              {/* Chart Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'var(--space-6)',
                  fontSize: '0.75rem',
                  marginTop: 'var(--space-2)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      backgroundColor: 'var(--color-success)',
                      borderRadius: 2,
                    }}
                  ></span>
                  Present Today
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      backgroundColor: 'var(--color-warning)',
                      borderRadius: 2,
                    }}
                  ></span>
                  On Approved Leave
                </div>
              </div>
            </Card>

            {/* Custom Pie/Donut Chart for Leave Distributions */}
            <Card style={{ display: 'flex', flexDirection: 'column' }}>
              <h3
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Leaves Audit Breakdown
              </h3>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  position: 'relative',
                }}
              >
                {/* SVG Donut Chart */}
                {(() => {
                  const { paid, sick, unpaid } =
                    dashboard.charts.leaveDistribution;
                  const total = paid + sick + unpaid;

                  if (total === 0) {
                    return (
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        No approved leaves record.
                      </div>
                    );
                  }

                  const r = 50;
                  const circ = 2 * Math.PI * r;
                  const paidPct = paid / total;
                  const sickPct = sick / total;
                  const unpaidPct = unpaid / total;

                  const paidOffset = 0;
                  const sickOffset = circ * paidPct;
                  const unpaidOffset = circ * (paidPct + sickPct);

                  return (
                    <div
                      style={{ position: 'relative', width: 150, height: 150 }}
                    >
                      <svg
                        width="150"
                        height="150"
                        viewBox="0 0 120 120"
                        style={{ transform: 'rotate(-90deg)' }}
                      >
                        {/* Paid Leaves */}
                        {paid > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r={r}
                            fill="transparent"
                            stroke="var(--color-primary)"
                            strokeWidth="14"
                            strokeDasharray={`${circ * paidPct} ${circ}`}
                            strokeDashoffset={-paidOffset}
                          />
                        )}
                        {/* Sick Leaves */}
                        {sick > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r={r}
                            fill="transparent"
                            stroke="var(--color-success)"
                            strokeWidth="14"
                            strokeDasharray={`${circ * sickPct} ${circ}`}
                            strokeDashoffset={-sickOffset}
                          />
                        )}
                        {/* Unpaid Leaves */}
                        {unpaid > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r={r}
                            fill="transparent"
                            stroke="var(--color-warning)"
                            strokeWidth="14"
                            strokeDasharray={`${circ * unpaidPct} ${circ}`}
                            strokeDashoffset={-unpaidOffset}
                          />
                        )}
                      </svg>
                      {/* Inside center text */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {total}
                        </span>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Total Slips
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Pie Legend Details */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  fontSize: '0.75rem',
                  marginTop: 'var(--space-2)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: 'var(--color-primary)',
                        borderRadius: '50%',
                      }}
                    ></span>
                    {dashboard.charts.leaveDistribution.paid}
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Paid
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'center',
                      color: 'var(--color-success)',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: 'var(--color-success)',
                        borderRadius: '50%',
                      }}
                    ></span>
                    {dashboard.charts.leaveDistribution.sick}
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Sick
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'center',
                      color: 'var(--color-warning)',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: 'var(--color-warning)',
                        borderRadius: '50%',
                      }}
                    ></span>
                    {dashboard.charts.leaveDistribution.unpaid}
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Unpaid
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Department Payroll Breakdown Bar Chart */}
          <Card>
            <h3
              className="card-title"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Monthly Payroll Allocation by Department
            </h3>
            <div
              style={{
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-2)',
              }}
            >
              {dashboard.charts.payrollSummary.map((summary, idx) => {
                const maxNet = Math.max(
                  1,
                  ...dashboard.charts.payrollSummary.map((s) => s.net),
                );
                const pct = (summary.net / maxNet) * 100;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        width: 140,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {summary.department}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-bg-secondary)',
                        height: 20,
                        borderRadius: 4,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {/* Dynamic fill bar with gradient */}
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background:
                            'linear-gradient(90deg, var(--color-primary-light), var(--color-primary))',
                          borderRadius: 4,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        width: 100,
                        textAlign: 'right',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                      }}
                    >
                      {formatCurrency(summary.net)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Reports Management Centre */}
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>
                  HR Reports Center
                </h3>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Inspect and print specific workforce operational report
                  registries.
                </p>
              </div>

              {/* Tab Selector Buttons */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: 4,
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => {
                    setActiveTab('attendance');
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor:
                      activeTab === 'attendance'
                        ? 'var(--color-bg-primary)'
                        : 'transparent',
                    color:
                      activeTab === 'attendance'
                        ? 'var(--color-primary)'
                        : 'var(--color-text-secondary)',
                    boxShadow:
                      activeTab === 'attendance' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Attendance Register
                </button>
                <button
                  onClick={() => {
                    setActiveTab('leave');
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor:
                      activeTab === 'leave'
                        ? 'var(--color-bg-primary)'
                        : 'transparent',
                    color:
                      activeTab === 'leave'
                        ? 'var(--color-primary)'
                        : 'var(--color-text-secondary)',
                    boxShadow:
                      activeTab === 'leave' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Leaves Summary
                </button>
                <button
                  onClick={() => {
                    setActiveTab('payroll');
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor:
                      activeTab === 'payroll'
                        ? 'var(--color-bg-primary)'
                        : 'transparent',
                    color:
                      activeTab === 'payroll'
                        ? 'var(--color-primary)'
                        : 'var(--color-text-secondary)',
                    boxShadow:
                      activeTab === 'payroll' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Payroll Register
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  flex: 1,
                  minWidth: 260,
                  maxWidth: 400,
                }}
              >
                <Input
                  placeholder="Search Employee ID or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ height: 36 }}
                />
                <Button
                  variant="secondary"
                  style={{
                    height: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Search size={14} /> Search
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant="secondary"
                  onClick={handlePrintReport}
                  style={{
                    height: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Printer size={14} /> Print Audit Log
                </Button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div id="printable-report-area">
              {isReportLoading ? (
                <LoadingState message="Loading tabular registers..." />
              ) : filteredData.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 'var(--space-6) 0',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <FileSpreadsheet
                    size={32}
                    style={{ opacity: 0.5, marginBottom: 8 }}
                  />
                  <p style={{ fontSize: '0.8125rem' }}>
                    No rows matched your active filters.
                  </p>
                </div>
              ) : (
                <div
                  className="responsive-table-wrapper"
                  style={{ overflowX: 'auto' }}
                >
                  {/* Attendance register view */}
                  {activeTab === 'attendance' && (
                    <table
                      className="adaptive-table"
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            textAlign: 'left',
                            borderBottom: '2px solid var(--color-border)',
                          }}
                        >
                          <th style={{ padding: '10px 8px' }}>Employee ID</th>
                          <th style={{ padding: '10px 8px' }}>Email</th>
                          <th style={{ padding: '10px 8px' }}>Present Days</th>
                          <th style={{ padding: '10px 8px' }}>Absent Days</th>
                          <th style={{ padding: '10px 8px' }}>
                            On Approved Leave
                          </th>
                          <th style={{ padding: '10px 8px' }}>
                            Attendance Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row: any, i: number) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            <td
                              style={{ padding: '12px 8px', fontWeight: 600 }}
                            >
                              {row.employeeId}
                            </td>
                            <td style={{ padding: '12px 8px' }}>{row.email}</td>
                            <td style={{ padding: '12px 8px' }}>
                              {row.presentDays} days
                            </td>
                            <td
                              style={{
                                padding: '12px 8px',
                                color:
                                  row.absentDays > 0
                                    ? 'var(--color-error)'
                                    : 'inherit',
                              }}
                            >
                              {row.absentDays} days
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {row.leaveDays} days
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <Badge
                                variant={
                                  row.attendancePercentage >= 90
                                    ? 'success'
                                    : 'warning'
                                }
                              >
                                {row.attendancePercentage}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Leaves Registry */}
                  {activeTab === 'leave' && (
                    <table
                      className="adaptive-table"
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            textAlign: 'left',
                            borderBottom: '2px solid var(--color-border)',
                          }}
                        >
                          <th style={{ padding: '10px 8px' }}>Employee ID</th>
                          <th style={{ padding: '10px 8px' }}>Email</th>
                          <th
                            style={{
                              padding: '10px 8px',
                              color: 'var(--color-success-dark)',
                            }}
                          >
                            Approved Count
                          </th>
                          <th
                            style={{
                              padding: '10px 8px',
                              color: 'var(--color-error)',
                            }}
                          >
                            Rejected Count
                          </th>
                          <th
                            style={{
                              padding: '10px 8px',
                              color: 'var(--color-warning-dark)',
                            }}
                          >
                            Pending Requests
                          </th>
                          <th style={{ padding: '10px 8px' }}>
                            Total Approved Days
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row: any, i: number) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            <td
                              style={{ padding: '12px 8px', fontWeight: 600 }}
                            >
                              {row.employeeId}
                            </td>
                            <td style={{ padding: '12px 8px' }}>{row.email}</td>
                            <td
                              style={{
                                padding: '12px 8px',
                                color: 'var(--color-success)',
                              }}
                            >
                              {row.approvedCount} requests
                            </td>
                            <td
                              style={{
                                padding: '12px 8px',
                                color: 'var(--color-error)',
                              }}
                            >
                              {row.rejectedCount} requests
                            </td>
                            <td
                              style={{
                                padding: '12px 8px',
                                color:
                                  row.pendingCount > 0
                                    ? 'var(--color-warning)'
                                    : 'inherit',
                                fontWeight:
                                  row.pendingCount > 0 ? 600 : 'normal',
                              }}
                            >
                              {row.pendingCount} pending
                            </td>
                            <td
                              style={{ padding: '12px 8px', fontWeight: 600 }}
                            >
                              {row.totalDays} days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Payroll Ledger */}
                  {activeTab === 'payroll' && (
                    <table
                      className="adaptive-table"
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            textAlign: 'left',
                            borderBottom: '2px solid var(--color-border)',
                          }}
                        >
                          <th style={{ padding: '10px 8px' }}>Employee ID</th>
                          <th style={{ padding: '10px 8px' }}>Email</th>
                          <th style={{ padding: '10px 8px' }}>Department</th>
                          <th style={{ padding: '10px 8px' }}>Designation</th>
                          <th style={{ padding: '10px 8px' }}>Basic Salary</th>
                          <th
                            style={{
                              padding: '10px 8px',
                              color: 'var(--color-success-dark)',
                            }}
                          >
                            Allowances
                          </th>
                          <th
                            style={{
                              padding: '10px 8px',
                              color: 'var(--color-error)',
                            }}
                          >
                            Deductions
                          </th>
                          <th
                            style={{
                              padding: '10px 8px',
                              color: 'var(--color-success)',
                            }}
                          >
                            Net Take-Home
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row: any, i: number) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            <td
                              style={{ padding: '12px 8px', fontWeight: 600 }}
                            >
                              {row.employeeId}
                            </td>
                            <td style={{ padding: '12px 8px' }}>{row.email}</td>
                            <td style={{ padding: '12px 8px' }}>
                              {row.department}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {row.designation}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {formatCurrency(row.basicSalary)}
                            </td>
                            <td
                              style={{
                                padding: '12px 8px',
                                color: 'var(--color-success-dark)',
                              }}
                            >
                              +{formatCurrency(row.allowances)}
                            </td>
                            <td
                              style={{
                                padding: '12px 8px',
                                color: 'var(--color-error)',
                              }}
                            >
                              -{formatCurrency(row.deductions)}
                            </td>
                            <td
                              style={{
                                padding: '12px 8px',
                                fontWeight: 700,
                                color: 'var(--color-success)',
                              }}
                            >
                              {formatCurrency(row.netSalary)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}

export default HrAnalyticsPage;
