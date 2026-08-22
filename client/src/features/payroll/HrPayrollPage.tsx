import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import {
  Card,
  Button,
  Badge,
  Dialog,
  Input,
  Label,
  LoadingState,
} from '../../components/ui/index.js';
import { toast } from '../../components/Toast/toastStore.js';
import { Printer, FileText, Search, PlusCircle, Eye } from 'lucide-react';

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

export function HrPayrollPage() {
  const queryClient = useQueryClient();

  // Search & Form State
  const [searchEmpId, setSearchEmpId] = useState('');
  const [, setActiveStructure] = useState<SalaryStructure | null>(null);
  const [formEmpId, setFormEmpId] = useState('');
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');

  // Slip Generation State
  const [slipEmpId, setSlipEmpId] = useState('');
  const [slipMonth, setSlipMonth] = useState('');

  // Selected Slip Modal State
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);

  // 1. Fetch All Slips (HR view)
  const { data: slipsData, isLoading: isSlipsLoading } = useQuery<{
    slips: SalarySlip[];
  }>({
    queryKey: ['payroll', 'admin-slips'],
    queryFn: () => apiClient<{ slips: SalarySlip[] }>('/api/payroll/slips'),
  });

  // 2. Fetch Active Slip Details for Modal
  const { data: activeSlip, isLoading: isActiveSlipLoading } =
    useQuery<SalarySlip>({
      queryKey: ['payroll', 'admin-slip-detail', selectedSlipId],
      queryFn: () =>
        apiClient<SalarySlip>(`/api/payroll/slip/${selectedSlipId}`),
      enabled: !!selectedSlipId,
    });

  // 3. Load Salary Structure Mutation
  const loadStructureMutation = useMutation({
    mutationFn: (empId: string) =>
      apiClient<SalaryStructure>(
        `/api/payroll/salary-structure?employeeId=${empId}`,
      ),
    onSuccess: (data) => {
      setActiveStructure(data);
      setFormEmpId(data.employeeId);
      setBasicSalary(data.basicSalary);
      setAllowances(data.allowances);
      setDeductions(data.deductions);
      setDepartment(data.department);
      setDesignation(data.designation);
      toast.success(`Salary structure loaded for ${data.employeeId}`);
    },
    onError: () => {
      setActiveStructure(null);
      setFormEmpId(searchEmpId);
      setBasicSalary(0);
      setAllowances(0);
      setDeductions(0);
      setDepartment('Engineering');
      setDesignation('Software Engineer');
      toast.error('Structure not configured yet. Fill details to create.');
    },
  });

  // 4. Save Salary Structure Mutation
  const saveStructureMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient<SalaryStructure>('/api/payroll/salary-structure', {
        method: 'PUT',
        data: payload,
      }),
    onSuccess: (data) => {
      toast.success('Salary structure configured successfully.');
      setActiveStructure(data);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save salary structure.');
    },
  });

  // 5. Generate Slip Mutation
  const generateSlipMutation = useMutation({
    mutationFn: (payload: { employeeId: string; month: string }) =>
      apiClient<SalarySlip>('/api/payroll/slip/generate', {
        method: 'POST',
        data: payload,
      }),
    onSuccess: () => {
      toast.success('Salary slip generated successfully.');
      queryClient.invalidateQueries({ queryKey: ['payroll', 'admin-slips'] });
      setSlipMonth('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate salary slip.');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmpId.trim()) return;
    loadStructureMutation.mutate(searchEmpId);
  };

  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formEmpId.trim() ||
      basicSalary < 0 ||
      allowances < 0 ||
      deductions < 0
    ) {
      toast.error('Please verify form inputs.');
      return;
    }

    saveStructureMutation.mutate({
      employeeId: formEmpId,
      basicSalary,
      allowances,
      deductions,
      department,
      designation,
    });
  };

  const handleGenerateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipEmpId.trim() || !slipMonth.trim()) {
      toast.error('Employee ID and Month are required.');
      return;
    }

    generateSlipMutation.mutate({
      employeeId: slipEmpId,
      month: slipMonth,
    });
  };

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
    const printContent = document.getElementById('printable-salary-slip-admin');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <section>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="main-title">Payroll Configuration</h1>
        <p className="subtitle">
          Configure employee salary structures and generate monthly payslips.
        </p>
      </div>

      {/* Grid: Config Forms and History Table */}
      <div
        className="adaptive-grid"
        style={{
          gridTemplateColumns: 'minmax(320px, 1fr) 2fr',
          alignItems: 'start',
          gap: 'var(--space-6)',
        }}
      >
        {/* Left Column Forms */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Load / Config Salary Structure */}
          <Card>
            <h3
              className="card-title"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Salary Structure Configuration
            </h3>

            {/* Load Search Input */}
            <form
              onSubmit={handleSearch}
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ flex: 1 }}>
                <Input
                  placeholder="Enter Employee ID (e.g. EMP-001)"
                  value={searchEmpId}
                  onChange={(e) => setSearchEmpId(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" isLoading={loadStructureMutation.isPending}>
                <Search size={14} /> Load
              </Button>
            </form>

            {/* Structure Form */}
            {formEmpId && (
              <form
                onSubmit={handleSaveStructure}
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--space-4)',
                }}
              >
                <div
                  className="form-group"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <Label htmlFor="formEmpId">Configuring Employee ID</Label>
                  <Input id="formEmpId" value={formEmpId} disabled />
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <Label htmlFor="basicSalary">Basic Monthly Salary ($)</Label>
                  <Input
                    id="basicSalary"
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    required
                  />
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <Label htmlFor="allowances">Allowances ($)</Label>
                  <Input
                    id="allowances"
                    type="number"
                    value={allowances}
                    onChange={(e) => setAllowances(Number(e.target.value))}
                    required
                  />
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <Label htmlFor="deductions">Deductions ($)</Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    required
                  />
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: 'var(--space-4)' }}
                >
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    padding: 'var(--space-3)',
                    borderRadius: 4,
                    marginBottom: 'var(--space-4)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Computed Net Salary
                  </div>
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--color-success)',
                    }}
                  >
                    {formatCurrency(basicSalary + allowances - deductions)}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saveStructureMutation.isPending}
                  style={{ width: '100%' }}
                >
                  Save Salary Structure
                </Button>
              </form>
            )}
          </Card>

          {/* Generate Slip Form */}
          <Card>
            <h3
              className="card-title"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Generate Payslip
            </h3>
            <form onSubmit={handleGenerateSlip}>
              <div
                className="form-group"
                style={{ marginBottom: 'var(--space-3)' }}
              >
                <Label htmlFor="slipEmpId">Employee ID</Label>
                <Input
                  id="slipEmpId"
                  placeholder="e.g. EMP-001"
                  value={slipEmpId}
                  onChange={(e) => setSlipEmpId(e.target.value)}
                  required
                />
              </div>

              <div
                className="form-group"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                <Label htmlFor="slipMonth">Select Month</Label>
                <Input
                  id="slipMonth"
                  type="month"
                  value={slipMonth}
                  onChange={(e) => setSlipMonth(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={generateSlipMutation.isPending}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <PlusCircle size={16} /> Generate Monthly Slip
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Payslips History */}
        <Card style={{ minHeight: 500 }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Company Payslips History
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
                    <th>Emp ID</th>
                    <th>Email</th>
                    <th>Pay Period</th>
                    <th>Gross Pay</th>
                    <th>Deductions</th>
                    <th>Net Take-home</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slipsData.slips.map((slip) => (
                    <tr key={slip.id}>
                      <td data-label="Emp ID" style={{ fontWeight: 600 }}>
                        {slip.employeeId}
                      </td>
                      <td data-label="Email" style={{ fontSize: '0.8125rem' }}>
                        {slip.user.email}
                      </td>
                      <td
                        data-label="Pay Period"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {formatMonth(slip.month)}
                      </td>
                      <td data-label="Gross Pay">
                        {formatCurrency(slip.basicSalary + slip.allowances)}
                      </td>
                      <td
                        data-label="Deductions"
                        style={{ color: 'var(--color-error)' }}
                      >
                        -{formatCurrency(slip.deductions)}
                      </td>
                      <td
                        data-label="Net Take-home"
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
        title="Employee Payslip Details"
      >
        {isActiveSlipLoading || !activeSlip ? (
          <LoadingState message="Loading payslip details..." />
        ) : (
          <div>
            {/* Printable Area Wrapper */}
            <div
              id="printable-salary-slip-admin"
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
export default HrPayrollPage;
