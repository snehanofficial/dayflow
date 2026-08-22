import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import {
  Card,
  Button,
  Select,
  Badge,
  Dialog,
  Label,
  Textarea,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import { toast } from '../../components/Toast/toastStore.js';
import { ShieldAlert, Clock, CheckCircle, XCircle } from 'lucide-react';

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
  user: {
    email: string;
  };
}

export function HrLeavePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(
    null,
  );
  const [remarks, setRemarks] = useState('');

  // 1. Fetch All Requests
  const {
    data: allRequestsData,
    isLoading,
    error,
    refetch,
  } = useQuery<{ requests: LeaveRequest[] }>({
    queryKey: ['leave', 'all'],
    queryFn: () => apiClient<{ requests: LeaveRequest[] }>('/api/leave/all'),
  });

  // 2. Action Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      apiClient(`/api/leave/${id}/approve`, {
        method: 'PATCH',
        data: { remarks },
      }),
    onSuccess: () => {
      toast.success('Leave request approved.');
      queryClient.invalidateQueries({ queryKey: ['leave', 'all'] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve leave request.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      apiClient(`/api/leave/${id}/reject`, {
        method: 'PATCH',
        data: { remarks },
      }),
    onSuccess: () => {
      toast.success('Leave request rejected.');
      queryClient.invalidateQueries({ queryKey: ['leave', 'all'] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject leave request.');
    },
  });

  const openActionDialog = (
    req: LeaveRequest,
    action: 'APPROVE' | 'REJECT',
  ) => {
    setSelectedRequest(req);
    setActionType(action);
    setRemarks('');
    setIsDialogOpen(true);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;

    if (actionType === 'APPROVE') {
      approveMutation.mutate({ id: selectedRequest.id, remarks });
    } else {
      rejectMutation.mutate({ id: selectedRequest.id, remarks });
    }
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

  // Filter requests
  const filteredRequests = allRequestsData?.requests.filter((req) => {
    const matchesStatus =
      statusFilter === 'ALL' || req.status.toUpperCase() === statusFilter;
    const matchesType =
      typeFilter === 'ALL' || req.leaveType.toUpperCase() === typeFilter;
    return matchesStatus && matchesType;
  });

  if (error) {
    return (
      <section style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Error Loading Requests"
          message="An error occurred while fetching company-wide leave requests."
          onRetry={refetch}
        />
      </section>
    );
  }

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  return (
    <section>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="main-title">Manage Employee Leaves</h1>
        <p className="subtitle">
          Review, approve, and reject leave requests across all departments.
        </p>
      </div>

      {/* Filters and List */}
      <Card>
        {/* Filters Panel */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <div className="form-group" style={{ minWidth: 200 }}>
            <Label htmlFor="statusFilter" style={{ marginBottom: 4 }}>
              Filter by Status
            </Label>
            <Select
              id="statusFilter"
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Pending Only', value: 'PENDING' },
                { label: 'Approved Only', value: 'APPROVED' },
                { label: 'Rejected Only', value: 'REJECTED' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ minWidth: 200 }}>
            <Label htmlFor="typeFilter" style={{ marginBottom: 4 }}>
              Filter by Leave Type
            </Label>
            <Select
              id="typeFilter"
              options={[
                { label: 'All Leave Types', value: 'ALL' },
                { label: 'Paid Leave', value: 'PAID' },
                { label: 'Sick Leave', value: 'SICK' },
                { label: 'Unpaid Leave', value: 'UNPAID' },
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <LoadingState message="Loading employee requests..." />
        ) : !filteredRequests || filteredRequests.length === 0 ? (
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
            <ShieldAlert
              size={36}
              style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}
            />
            <p style={{ fontSize: '0.875rem' }}>
              No leave requests match the selected filters.
            </p>
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="adaptive-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Email</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td data-label="Employee ID" style={{ fontWeight: 600 }}>
                      {req.employeeId}
                    </td>
                    <td data-label="Email" style={{ fontSize: '0.8125rem' }}>
                      {req.user.email}
                    </td>
                    <td data-label="Leave Type">{req.leaveType}</td>
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
                        maxWidth: 260,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {req.reason}
                    </td>
                    <td data-label="Status">{getStatusBadge(req.status)}</td>
                    <td
                      data-label="Actions"
                      style={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                    >
                      {req.status === 'PENDING' ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <Button
                            variant="primary"
                            onClick={() => openActionDialog(req, 'APPROVE')}
                            style={{
                              height: 28,
                              padding: '0 var(--space-2)',
                              fontSize: '0.75rem',
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => openActionDialog(req, 'REJECT')}
                            style={{
                              height: 28,
                              padding: '0 var(--space-2)',
                              fontSize: '0.75rem',
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          Processed by {req.approvedBy}
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

      {/* Review Remarks Dialog */}
      {selectedRequest && actionType && (
        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title={
            actionType === 'APPROVE'
              ? 'Approve Leave Request'
              : 'Reject Leave Request'
          }
        >
          <form onSubmit={handleConfirmAction}>
            <div
              style={{
                marginBottom: 'var(--space-4)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <p>
                <strong>Employee:</strong> {selectedRequest.user.email} (
                {selectedRequest.employeeId})
              </p>
              <p>
                <strong>Leave:</strong> {selectedRequest.leaveType} (
                {formatLocalDate(selectedRequest.startDate)} -{' '}
                {formatLocalDate(selectedRequest.endDate)})
              </p>
            </div>

            <div
              className="form-group"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              <Label htmlFor="actionRemarks">
                Add Comments / Remarks (Optional)
              </Label>
              <Textarea
                id="actionRemarks"
                placeholder={
                  actionType === 'APPROVE'
                    ? 'Enter approval comments...'
                    : 'Please provide a reason for rejection...'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-2)',
              }}
            >
              <Button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={actionType === 'APPROVE' ? 'primary' : 'danger'}
                isLoading={isMutating}
              >
                {actionType === 'APPROVE'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
export default HrLeavePage;
