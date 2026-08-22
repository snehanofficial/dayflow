import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import {
  Card,
  Button,
  Badge,
  Dialog,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import { CreditCard, FileText, Printer, Eye, ShieldAlert } from 'lucide-react';

interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  department: string;
  designation: string;
}

interface SalarySlip {
  id: string;
  employeeId: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  department: string;
  designation: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
}

export function SalarySlipsPage() {
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);

  // 1. Fetch own Salary Structure
  const {
    data: structure,
    isLoading: isStructureLoading,
    error: structureError,
    refetch: refetchStructure,
  } = useQuery<SalaryStructure>({
    queryKey: ['payroll', 'salary-structure'],
    queryFn: () => apiClient<SalaryStructure>('/api/payroll/salary-structure'),
    retry: false, // Don't spam retry if HR hasn't configured it yet
  });

  // 2. Fetch own Salary Slips
  const {
    data: slipsData,
    isLoading: isSlipsLoading,
    error: slipsError,
    refetch: refetchSlips,
  } = useQuery<{ slips: SalarySlip[] }>({
    queryKey: ['payroll', 'slips'],
    queryFn: () => apiClient<{ slips: SalarySlip[] }>('/api/payroll/slips'),
  });

  // 3. Fetch Selected Slip Details for Modal
  const { data: activeSlip, isLoading: isActiveSlipLoading } =
    useQuery<SalarySlip>({
      queryKey: ['payroll', 'slip', selectedSlipId],
      queryFn: () =>
        apiClient<SalarySlip>(`/api/payroll/slip/${selectedSlipId}`),
      enabled: !!selectedSlipId,
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-salary-slip');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    // Restore page
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (slipsError) {
    return (
      <section style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Error Loading Payroll Details"
          message="An error occurred while fetching your payroll data."
          onRetry={() => {
            refetchStructure();
            refetchSlips();
          }}
        />
      </section>
    );
  }

  return (
    <section>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="main-title">My Pay & Benefits</h1>
        <p className="subtitle">
          View your monthly earnings breakdown, deductions, and salary slips.
        </p>
      </div>

      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'minmax(300px, 1fr) 2fr',
          alignItems: 'start',
          gap: 'var(--space-6)',
        }}
      >
        {/* Left Column: Salary Structure Info */}
        <Card style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              right: -15,
              top: -15,
              opacity: 0.05,
              color: 'var(--color-primary)',
            }}
          >
            <CreditCard size={130} />
          </div>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Compensation Summary
          </h3>

          {isStructureLoading ? (
            <LoadingState message="Loading salary components..." />
          ) : structureError || !structure ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: 'var(--space-4) 0',
                color: 'var(--color-text-muted)',
              }}
            >
              <ShieldAlert
                size={28}
                style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}
              />
              <p style={{ fontSize: '0.8125rem' }}>
                Salary structure is not configured yet.
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: 4 }}>
                Contact People Operations if you believe this is an error.
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Designation
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {structure.designation}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                  }}
                >
                  {structure.department}
                </div>
              </div>

              <div
                className="kv-row"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                <span className="kv-label">Basic Salary</span>
                <span className="kv-value">
                  {formatCurrency(structure.basicSalary)}
                </span>
              </div>
              <div
                className="kv-row"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                <span className="kv-label">Allowances</span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-success-dark)' }}
                >
                  + {formatCurrency(structure.allowances)}
                </span>
              </div>
              <div
                className="kv-row"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                <span className="kv-label">Deductions</span>
                <span
                  className="kv-value"
                  style={{ color: 'var(--color-error)' }}
                >
                  - {formatCurrency(structure.deductions)}
                </span>
              </div>

              <div
                className="kv-row"
                style={{
                  borderTop: '1px dashed var(--color-border)',
                  paddingTop: 'var(--space-3)',
                  marginTop: 'var(--space-3)',
                }}
              >
                <span className="kv-label" style={{ fontWeight: 600 }}>
                  Estimated Monthly Net
                </span>
                <span
                  className="kv-value"
                  style={{
                    color: 'var(--color-success)',
                    fontWeight: 600,
                    fontSize: '1.0625rem',
                  }}
                >
                  {formatCurrency(structure.netSalary)}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Right Column: Salary Slips List */}
        <Card style={{ minHeight: 350 }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Payslips History
          </h3>

          {isSlipsLoading ? (
            <LoadingState message="Loading slips history..." />
          ) : !slipsData?.slips || slipsData.slips.length === 0 ? (
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
              <FileText
                size={32}
                style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}
              />
              <p style={{ fontSize: '0.875rem' }}>No payslips generated yet.</p>
            </div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="adaptive-table">
                <thead>
                  <tr>
                    <th>Pay Period</th>
                    <th>Basic</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slipsData.slips.map((slip) => (
                    <tr key={slip.id}>
                      <td data-label="Pay Period" style={{ fontWeight: 600 }}>
                        {formatMonth(slip.month)}
                      </td>
                      <td data-label="Basic">
                        {formatCurrency(slip.basicSalary)}
                      </td>
                      <td
                        data-label="Allowances"
                        style={{ color: 'var(--color-success-dark)' }}
                      >
                        +{formatCurrency(slip.allowances)}
                      </td>
                      <td
                        data-label="Deductions"
                        style={{ color: 'var(--color-error)' }}
                      >
                        -{formatCurrency(slip.deductions)}
                      </td>
                      <td
                        data-label="Net Salary"
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-success)',
                        }}
                      >
                        {formatCurrency(slip.netSalary)}
                      </td>
                      <td data-label="Status">
                        <Badge variant="success">PAID</Badge>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedSlipId(slip.id)}
                          style={{
                            height: 28,
                            padding: '0 var(--space-2)',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Eye size={12} /> View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Payslip View Modal */}
      <Dialog
        isOpen={!!selectedSlipId}
        onClose={() => setSelectedSlipId(null)}
        title="Payslip Details"
      >
        {isActiveSlipLoading || !activeSlip ? (
          <LoadingState message="Loading payslip structure..." />
        ) : (
          <div>
            {/* Printable Area Wrapper */}
            <div
              id="printable-salary-slip"
              style={{
                padding: 'var(--space-4)',
                color: '#000',
                backgroundColor: '#fff',
                borderRadius: 4,
                fontFamily: 'sans-serif',
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                @media print {
                  body { background: white; color: black; }
                  .no-print { display: none !important; }
                }
              `,
                }}
              />

              {/* Invoice-like Slip Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid #333',
                  paddingBottom: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.375rem',
                      fontWeight: 700,
                      color: '#111',
                    }}
                  >
                    DAYFLOW INC.
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '0.75rem',
                      color: '#666',
                    }}
                  >
                    100 Pine Street, San Francisco, CA
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#333',
                    }}
                  >
                    SALARY SLIP
                  </h3>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '0.75rem',
                      color: '#666',
                    }}
                  >
                    <strong>Month:</strong> {formatMonth(activeSlip.month)}
                  </p>
                </div>
              </div>

              {/* Employee & Job details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-5)',
                  fontSize: '0.8125rem',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Employee Name:</strong>{' '}
                    {activeSlip.user.email.split('@')[0]}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Employee ID:</strong> {activeSlip.employeeId}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Email:</strong> {activeSlip.user.email}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Department:</strong> {activeSlip.department}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Designation:</strong> {activeSlip.designation}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Payment Status:</strong>{' '}
                    <span style={{ color: 'green', fontWeight: 600 }}>
                      PAID
                    </span>
                  </p>
                </div>
              </div>

              {/* Salary Breakdown Table */}
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8125rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#f5f5f5',
                        borderBottom: '1px solid #ccc',
                      }}
                    >
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontWeight: 600,
                        }}
                      >
                        Earnings Component
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '8px 12px',
                          fontWeight: 600,
                        }}
                      >
                        Amount
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontWeight: 600,
                          borderLeft: '1px solid #ddd',
                        }}
                      >
                        Deductions Component
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '8px 12px',
                          fontWeight: 600,
                        }}
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px' }}>Basic Salary</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {formatCurrency(activeSlip.basicSalary)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderLeft: '1px solid #ddd',
                        }}
                      >
                        General Deductions
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          color: '#c53030',
                        }}
                      >
                        {formatCurrency(activeSlip.deductions)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px' }}>Allowances</td>
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          color: 'green',
                        }}
                      >
                        {formatCurrency(activeSlip.allowances)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderLeft: '1px solid #ddd',
                        }}
                      >
                        -
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        $0.00
                      </td>
                    </tr>
                    <tr
                      style={{
                        backgroundColor: '#fafafa',
                        borderTop: '2px solid #ccc',
                        borderBottom: '2px solid #ccc',
                        fontWeight: 700,
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>Gross Earnings</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {formatCurrency(
                          activeSlip.basicSalary + activeSlip.allowances,
                        )}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderLeft: '1px solid #ddd',
                        }}
                      >
                        Total Deductions
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          color: '#c53030',
                        }}
                      >
                        {formatCurrency(activeSlip.deductions)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Salary Summary */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    textAlign: 'right',
                    backgroundColor: '#f0fff4',
                    border: '1px solid #c6f6d5',
                    padding: '12px 24px',
                    borderRadius: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      color: '#276749',
                      display: 'block',
                      fontWeight: 500,
                    }}
                  >
                    Net Take-Home Pay
                  </span>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      color: '#22543d',
                      fontWeight: 700,
                    }}
                  >
                    {formatCurrency(activeSlip.netSalary)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 60,
                  fontSize: '0.75rem',
                  color: '#555',
                }}
              >
                <div style={{ textAlign: 'center', width: 160 }}>
                  <div
                    style={{
                      borderBottom: '1px solid #aaa',
                      height: 20,
                      marginBottom: 4,
                    }}
                  ></div>
                  <span>Employee Signature</span>
                </div>
                <div style={{ textAlign: 'center', width: 160 }}>
                  <div
                    style={{
                      borderBottom: '1px solid #aaa',
                      height: 20,
                      marginBottom: 4,
                    }}
                  ></div>
                  <span>Authorized HR Signatory</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-3)',
              }}
            >
              <Button onClick={() => setSelectedSlipId(null)}>Close</Button>
              <Button
                variant="primary"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={14} /> Print payslip
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
export default SalarySlipsPage;
