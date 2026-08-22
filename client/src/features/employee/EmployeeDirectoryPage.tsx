import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, User, Users, RefreshCw } from 'lucide-react';
import {
  Card,
  Input,
  ErrorState,
  Button,
  Skeleton,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import type { paths } from '../../types/api.js';

type EmployeesResponse =
  paths['/api/employees']['get']['responses']['200']['content']['application/json'];
type EmployeeItem = EmployeesResponse['employees'][number];

export function EmployeeDirectoryPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setErrorText(null);
      const data = await apiClient<EmployeesResponse>('/api/employees');
      setEmployees(data.employees || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load employees.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const fullName =
      `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const des = (emp.designation || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      fullName.includes(query) ||
      code.includes(query) ||
      dept.includes(query) ||
      des.includes(query)
    );
  });

  if (isLoading) {
    return (
      <section aria-busy="true" aria-live="polite">
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <h1 className="main-title">Employee Directory</h1>
              <p className="subtitle">
                Discover and manage employee information across the
                organization.
              </p>
            </div>
            <Button
              variant="secondary"
              disabled
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <Input
            type="text"
            placeholder="Search by name, employee code, department, or designation..."
            disabled
            startIcon={<Search size={18} />}
          />
        </Card>

        {/* Skeleton Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="responsive-table-wrapper">
            <table className="adaptive-table" style={{ pointerEvents: 'none' }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <Skeleton
                          width="32px"
                          height="32px"
                          borderRadius="50%"
                        />
                        <Skeleton width="120px" height="16px" />
                      </div>
                    </td>
                    <td>
                      <Skeleton width="80px" height="16px" />
                    </td>
                    <td>
                      <Skeleton width="100px" height="16px" />
                    </td>
                    <td>
                      <Skeleton width="100px" height="16px" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <Skeleton width="60px" height="28px" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    );
  }

  if (errorText) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Connection Error"
          message={`Unable to load employees: ${errorText}`}
          onRetry={fetchEmployees}
        />
      </div>
    );
  }

  return (
    <section>
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <h1 className="main-title">Employee Directory</h1>
            <p className="subtitle">
              Discover and manage employee information across the organization.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={fetchEmployees}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <Input
          type="text"
          placeholder="Search by name, employee code, department, or designation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startIcon={<Search size={18} />}
        />
      </Card>

      {/* Directory Table / Card Container */}
      {filteredEmployees.length === 0 ? (
        <Card style={{ padding: 'var(--space-8)' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-muted)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={24} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 600 }}>No employees found</h3>
            <p className="subtitle" style={{ margin: 0 }}>
              Try adjusting your search criteria or query keywords.
            </p>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="responsive-table-wrapper">
            <table className="adaptive-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const fullName =
                    `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
                    'Unassigned Name';
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      style={{ cursor: 'pointer' }}
                      className="directory-row"
                    >
                      <td data-label="Employee">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-bg)',
                              color: 'var(--color-primary-text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {emp.profileImage ? (
                              <img
                                src={emp.profileImage}
                                alt={fullName}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <User size={16} />
                            )}
                          </div>
                          <div>
                            <span
                              style={{
                                fontWeight: 500,
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {fullName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Employee Code">
                        <span
                          style={{
                            fontFamily: 'monospace',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {emp.employeeCode}
                        </span>
                      </td>
                      <td data-label="Department">
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {emp.department || 'Not Assigned'}
                        </span>
                      </td>
                      <td data-label="Designation">
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {emp.designation || 'Not Assigned'}
                        </span>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employees/${emp.id}`);
                          }}
                        >
                          View Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
export default EmployeeDirectoryPage;
