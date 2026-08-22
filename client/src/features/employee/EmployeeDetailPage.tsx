import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Phone,
  Briefcase,
  Calendar,
  ArrowLeft,
  MapPin,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import {
  Card,
  Button,
  ErrorState,
  Badge,
  Input,
  Label,
  Select,
  Skeleton,
} from '../../components/ui/index.js';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { toast } from '../../components/Toast/toastStore.js';
import type { paths } from '../../types/api.js';

type EmployeeProfile =
  paths['/api/employees/{id}']['get']['responses']['200']['content']['application/json'];

const detailSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(30).nullable().or(z.literal('')),
  department: z.string().max(100).nullable().or(z.literal('')),
  designation: z.string().max(100).nullable().or(z.literal('')),
  joiningDate: z.string().nullable().or(z.literal('')),
  employmentStatus: z.string().max(50).nullable().or(z.literal('')),
  address: z.string().max(500).nullable().or(z.literal('')),
  profileImage: z.string().max(500).nullable().or(z.literal('')),
});

type DetailFormData = z.infer<typeof detailSchema>;

const formatDateForInput = (isoString?: string | null) => {
  if (!isoString) return '';
  return isoString.split('T')[0];
};

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DetailFormData>({
    resolver: zodResolver(detailSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      designation: '',
      joiningDate: '',
      employmentStatus: '',
      address: '',
      profileImage: '',
    },
  });

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorText(null);
      const data = await apiClient<EmployeeProfile>(`/api/employees/${id}`);
      setProfile(data);
      reset({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? '',
        department: data.department ?? '',
        designation: data.designation ?? '',
        joiningDate: formatDateForInput(data.joiningDate),
        employmentStatus: data.employmentStatus ?? 'ACTIVE',
        address: data.address ?? '',
        profileImage: data.profileImage ?? '',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load employee details.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (data: DetailFormData) => {
    try {
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone === '' ? null : data.phone,
        department: data.department === '' ? null : data.department,
        designation: data.designation === '' ? null : data.designation,
        joiningDate:
          data.joiningDate === '' || data.joiningDate == null
            ? null
            : new Date(data.joiningDate).toISOString(),
        employmentStatus:
          data.employmentStatus === '' ? null : data.employmentStatus,
        address: data.address === '' ? null : data.address,
        profileImage: data.profileImage === '' ? null : data.profileImage,
      };

      const updated = await apiClient<EmployeeProfile>(`/api/employees/${id}`, {
        method: 'PATCH',
        data: formattedData,
      });

      setProfile(updated);
      setIsEditing(false);
      toast.success('Employee details updated successfully.');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update employee details.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <section
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'var(--space-4) 0',
        }}
        aria-busy="true"
        aria-live="polite"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <Skeleton width="150px" height="38px" />
          <Skeleton width="130px" height="38px" />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Identity Card Skeleton */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <Skeleton width="60px" height="60px" borderRadius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton
                  width="200px"
                  height="24px"
                  style={{ marginBottom: 'var(--space-2)' }}
                />
                <Skeleton width="120px" height="16px" />
              </div>
            </div>
          </Card>

          {/* Personal Details Skeleton */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <Skeleton
              width="180px"
              height="20px"
              style={{ marginBottom: 'var(--space-4)' }}
            />
            <div
              className="adaptive-grid"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Skeleton width="80px" height="14px" />
                  <Skeleton width="100%" height="38px" />
                </div>
              ))}
            </div>
          </Card>

          {/* Org Details Skeleton */}
          <Card style={{ padding: 'var(--space-6)' }}>
            <Skeleton
              width="180px"
              height="20px"
              style={{ marginBottom: 'var(--space-4)' }}
            />
            <div
              className="adaptive-grid"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <Skeleton width="80px" height="14px" />
                  <Skeleton width="100%" height="38px" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
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
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
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

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {isHR && !isEditing && (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Edit3 size={16} /> Edit Employee
            </Button>
          )}
          {isOwnProfile && !isEditing && (
            <Button variant="secondary" onClick={() => navigate('/profile')}>
              My Settings
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)',
            }}
          >
            {/* Edit Identity */}
            <Card>
              <h3
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Edit Basic Info
              </h3>
              <div
                className="adaptive-grid"
                style={{
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div className="form-group">
                  <Label htmlFor="firstName" required>
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    error={errors.firstName?.message}
                    disabled={isSubmitting}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <span className="form-error-msg">
                      {errors.firstName.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <Label htmlFor="lastName" required>
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    error={errors.lastName?.message}
                    disabled={isSubmitting}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <span className="form-error-msg">
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="profileImage">Profile Image URL</Label>
                <Input
                  id="profileImage"
                  type="text"
                  placeholder="https://example.com/avatar.png"
                  error={errors.profileImage?.message}
                  disabled={isSubmitting}
                  {...register('profileImage')}
                />
              </div>
            </Card>

            {/* Edit Contact Details */}
            <Card>
              <h3
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Contact & Address
              </h3>
              <div
                className="form-group"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="text"
                  error={errors.phone?.message}
                  disabled={isSubmitting}
                  {...register('phone')}
                />
              </div>
              <div className="form-group">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  error={errors.address?.message}
                  disabled={isSubmitting}
                  {...register('address')}
                />
              </div>
            </Card>

            {/* Edit Work Details */}
            <Card>
              <h3
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Workplace Information
              </h3>
              <div
                className="adaptive-grid"
                style={{
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div className="form-group">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    error={errors.department?.message}
                    disabled={isSubmitting}
                    {...register('department')}
                  />
                </div>

                <div className="form-group">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    type="text"
                    error={errors.designation?.message}
                    disabled={isSubmitting}
                    {...register('designation')}
                  />
                </div>
              </div>

              <div
                className="adaptive-grid"
                style={{
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                <div className="form-group">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    error={errors.joiningDate?.message}
                    disabled={isSubmitting}
                    {...register('joiningDate')}
                  />
                </div>

                <div className="form-group">
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Select
                    id="employmentStatus"
                    error={errors.employmentStatus?.message}
                    disabled={isSubmitting}
                    options={[
                      { label: 'ACTIVE', value: 'ACTIVE' },
                      { label: 'INACTIVE', value: 'INACTIVE' },
                      { label: 'TERMINATED', value: 'TERMINATED' },
                      { label: 'SUSPENDED', value: 'SUSPENDED' },
                    ]}
                    {...register('employmentStatus')}
                  />
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
              }}
            >
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => {
                  setIsEditing(false);
                  if (profile) {
                    reset({
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      phone: profile.phone ?? '',
                      department: profile.department ?? '',
                      designation: profile.designation ?? '',
                      joiningDate: formatDateForInput(profile.joiningDate),
                      employmentStatus: profile.employmentStatus ?? 'ACTIVE',
                      address: profile.address ?? '',
                      profileImage: profile.profileImage ?? '',
                    });
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <X size={16} /> Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
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
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
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
                  <span className="kv-value">
                    {profile.address || 'Not Provided'}
                  </span>
                </div>
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
                  <span
                    className="kv-value"
                    style={{ fontFamily: 'monospace' }}
                  >
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
      )}
    </section>
  );
}
export default EmployeeDetailPage;
