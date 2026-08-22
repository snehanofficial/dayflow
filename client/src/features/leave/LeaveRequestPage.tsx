import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import {
  Card,
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Badge,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import { toast } from '../../components/Toast/toastStore.js';
import { Calendar, Info, Clock, CheckCircle, XCircle } from 'lucide-react';

interface BalanceItem {
  allocated: number;
  used: number;
  remaining: number;
}

interface LeaveBalance {
  paid: BalanceItem;
  sick: BalanceItem;
  unpaid: BalanceItem;
}

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
}

export function LeaveRequestPage() {
  const queryClient = useQueryClient();
  const [leaveType, setLeaveType] = useState('PAID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // 1. Fetch Balances
  const {
    data: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery<LeaveBalance>({
    queryKey: ['leave', 'balance'],
    queryFn: () => apiClient<LeaveBalance>('/api/leave/balance'),
  });

  // 2. Fetch Personal History
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<{ requests: LeaveRequest[] }>({
    queryKey: ['leave', 'my-requests'],
    queryFn: () =>
      apiClient<{ requests: LeaveRequest[] }>('/api/leave/my-requests'),
  });

  // 3. Submit Leave Mutation
  const submitLeaveMutation = useMutation({
    mutationFn: (payload: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) =>
      apiClient<LeaveRequest>('/api/leave/request', {
        method: 'POST',
        data: payload,
      }),
    onSuccess: () => {
      toast.success('Leave request submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['leave', 'my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'balance'] });
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit leave request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('All form fields are required.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    submitLeaveMutation.mutate({
      leaveType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      reason,
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

  const calculateDuration = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatLocalDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (balanceError || historyError) {
    return (
      <section style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Error Loading Data"
          message="An error occurred while fetching leave balances or requests history."
          onRetry={() => {
            refetchBalance();
            refetchHistory();
          }}
        />
      </section>
    );
  }

  return (
    <section>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="main-title">Leaves Portal</h1>
        <p className="subtitle">
          Submit leave requests and view your current leave balances.
        </p>
      </div>

      {/* Balance Cards */}
      {isBalanceLoading ? (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <LoadingState message="Loading leave balances..." />
        </div>
      ) : (
        balance && (
          <div
            className="adaptive-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              marginBottom: 'var(--space-6)',
              gap: 'var(--space-4)',
            }}
          >
            {/* Paid Leave Card */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  opacity: 0.05,
                  color: 'var(--color-primary)',
                }}
              >
                <Calendar size={120} />
              </div>
              <h3
                className="card-title"
                style={{ color: 'var(--color-primary)' }}
              >
                Paid Leaves
              </h3>
              <div className="kv-row">
                <span className="kv-label">Allocated</span>
                <span className="kv-value">{balance.paid.allocated} Days</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Used</span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {balance.paid.used} Days
                </span>
              </div>
              <div
                className="kv-row"
                style={{
                  borderTop: '1px dashed var(--color-border)',
                  paddingTop: 'var(--space-2)',
                }}
              >
                <span className="kv-label" style={{ fontWeight: 600 }}>
                  Remaining
                </span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-success)', fontWeight: 600 }}
                >
                  {balance.paid.remaining} Days
                </span>
              </div>
            </Card>

            {/* Sick Leave Card */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  opacity: 0.05,
                  color: 'var(--color-info)',
                }}
              >
                <Calendar size={120} />
              </div>
              <h3 className="card-title" style={{ color: 'var(--color-info)' }}>
                Sick Leaves
              </h3>
              <div className="kv-row">
                <span className="kv-label">Allocated</span>
                <span className="kv-value">{balance.sick.allocated} Days</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Used</span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {balance.sick.used} Days
                </span>
              </div>
              <div
                className="kv-row"
                style={{
                  borderTop: '1px dashed var(--color-border)',
                  paddingTop: 'var(--space-2)',
                }}
              >
                <span className="kv-label" style={{ fontWeight: 600 }}>
                  Remaining
                </span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-success)', fontWeight: 600 }}
                >
                  {balance.sick.remaining} Days
                </span>
              </div>
            </Card>

            {/* Unpaid Leave Card */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  opacity: 0.05,
                  color: 'var(--color-text-muted)',
                }}
              >
                <Calendar size={120} />
              </div>
              <h3
                className="card-title"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Unpaid Leaves
              </h3>
              <div className="kv-row">
                <span className="kv-label">Allocated</span>
                <span className="kv-value">
                  {balance.unpaid.allocated} Days
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Used</span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {balance.unpaid.used} Days
                </span>
              </div>
              <div
                className="kv-row"
                style={{
                  borderTop: '1px dashed var(--color-border)',
                  paddingTop: 'var(--space-2)',
                }}
              >
                <span className="kv-label" style={{ fontWeight: 600 }}>
                  Approved Unpaid
                </span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-warning)', fontWeight: 600 }}
                >
                  {balance.unpaid.used} Days
                </span>
              </div>
            </Card>
          </div>
        )
      )}

      {/* Grid: Apply Form on Left, History Table on Right */}
      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'minmax(300px, 1fr) 2.2fr',
          alignItems: 'start',
          gap: 'var(--space-6)',
        }}
      >
        {/* Leave Request Form */}
        <Card>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Apply for Leave
          </h3>
          <form onSubmit={handleSubmit}>
            <div
              className="form-group"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                id="leaveType"
                options={[
                  { label: 'Paid Leave', value: 'PAID' },
                  { label: 'Sick Leave', value: 'SICK' },
                  { label: 'Unpaid Leave', value: 'UNPAID' },
                ]}
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              />
            </div>

            <div
              className="form-group"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div
              className="form-group"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div
              className="form-group"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                placeholder="Please state the reason for your leave request..."
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={submitLeaveMutation.isPending}
              style={{ width: '100%' }}
            >
              Submit Application
            </Button>
          </form>
        </Card>

        {/* History Table */}
        <Card style={{ minHeight: 400 }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            My Leave Requests History
          </h3>
          {isHistoryLoading ? (
            <LoadingState message="Loading requests history..." />
          ) : !historyData?.requests || historyData.requests.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-8) 0',
                color: 'var(--color-text-muted)',
              }}
            >
              <Info
                size={32}
                style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}
              />
              <p style={{ fontSize: '0.875rem' }}>No leave requests found.</p>
            </div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="adaptive-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date Range</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>HR Response</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.requests.map((req) => (
                    <tr key={req.id}>
                      <td data-label="Type" style={{ fontWeight: 600 }}>
                        {req.leaveType}
                      </td>
                      <td
                        data-label="Date Range"
                        style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      >
                        {formatLocalDate(req.startDate)} -{' '}
                        {formatLocalDate(req.endDate)}
                      </td>
                      <td data-label="Days" style={{ textAlign: 'center' }}>
                        {calculateDuration(req.startDate, req.endDate)}
                      </td>
                      <td
                        data-label="Reason"
                        style={{
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {req.reason}
                      </td>
                      <td data-label="Status">{getStatusBadge(req.status)}</td>
                      <td data-label="HR Response">
                        {req.remarks ? (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <strong>Remarks:</strong> {req.remarks}
                          </div>
                        ) : req.status === 'PENDING' ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-muted)',
                              fontStyle: 'italic',
                            }}
                          >
                            Awaiting review
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            No comments
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
export default LeaveRequestPage;
