import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  User,
  Phone,
  Briefcase,
  Calendar,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import {
  Card,
  Button,
  LoadingState,
  ErrorState,
  Badge,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import type { paths } from '../../types/api.js';

type EmployeeProfile =
  paths['/api/employees/{id}']['get']['responses']['200']['content']['application/json'];

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorText(null);
      const data = await apiClient<EmployeeProfile>(`/api/employees/${id}`);
      setProfile(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load employee details.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <LoadingState message="Loading employee details..." />
      </div>
    );
  }

  if (errorText) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Access Denied or Error"
          message={`Unable to load employee information: ${errorText}`}
          onRetry={fetchProfile}
        />
        <div
          style={{
            marginTop: 'var(--space-4)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <ErrorState
          title="Not Found"
          message="No employee record was found matching this ID."
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  const fullName =
    `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
    'New Employee';
  const isOwnProfile = profile.userId === currentUser?.id;
  const isHR = currentUser?.role === 'HR';

  return (
    <section
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--space-4) 0',
      }}
    >
      {/* Navigation and Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Button
          variant="secondary"
          onClick={() => {
            if (isHR) {
              navigate('/employees');
            } else {
              navigate('/');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <ArrowLeft size={16} />
          {isHR ? 'Back to Directory' : 'Back to Dashboard'}
        </Button>

        {isOwnProfile && (
          <Button variant="primary" onClick={() => navigate('/profile')}>
            Edit Profile
          </Button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Profile Identity Card */}
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-bg)',
                color: 'var(--color-primary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={36} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  flexWrap: 'wrap',
                }}
              >
                <h2
                  className="card-title"
                  style={{ margin: 0, fontSize: '1.5rem' }}
                >
                  {fullName}
                </h2>
                {profile.employmentStatus && (
                  <Badge
                    variant={
                      profile.employmentStatus.toUpperCase() === 'ACTIVE'
                        ? 'success'
                        : 'default'
                    }
                  >
                    {profile.employmentStatus}
                  </Badge>
                )}
              </div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  margin: '4px 0 0 0',
                }}
              >
                {profile.designation || 'Position not assigned'} •{' '}
                {profile.department || 'Department not assigned'}
              </p>
            </div>
          </div>
        </Card>

        {/* Detailed Panels */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Personal Details */}
          <Card>
            <h3
              className="card-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <User size={18} />
              Personal Details
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div
                className="kv-row"
                style={{
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="kv-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Phone size={14} /> Phone Number
                </span>
                <span className="kv-value">
                  {profile.phone || 'Not Provided'}
                </span>
              </div>
              {profile.address && (
                <div
                  className="kv-row"
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    className="kv-label"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <MapPin size={14} /> Address
                  </span>
                  <span className="kv-value">{profile.address}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Employment Details */}
          <Card>
            <h3
              className="card-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <Briefcase size={18} />
              Employment Details
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div
                className="kv-row"
                style={{
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span className="kv-label">Employee Code</span>
                <span className="kv-value" style={{ fontFamily: 'monospace' }}>
                  {profile.employeeCode}
                </span>
              </div>
              <div
                className="kv-row"
                style={{
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span className="kv-label">Department</span>
                <span className="kv-value">
                  {profile.department || 'Not Assigned'}
                </span>
              </div>
              <div
                className="kv-row"
                style={{
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span className="kv-label">Designation</span>
                <span className="kv-value">
                  {profile.designation || 'Not Assigned'}
                </span>
              </div>
              <div className="kv-row" style={{ padding: 'var(--space-2) 0' }}>
                <span
                  className="kv-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Calendar size={14} /> Joining Date
                </span>
                <span className="kv-value">
                  {profile.joiningDate
                    ? new Date(profile.joiningDate).toLocaleDateString(
                        undefined,
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )
                    : 'Not Assigned'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
export default EmployeeDetailPage;
