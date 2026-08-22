import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  Switch,
  Label,
  Card,
  Badge,
  Tabs,
  Dropdown,
  Tooltip,
  Dialog,
  ConfirmDialog,
  Skeleton,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../components/ui/index.js';
import { toast } from '../components/Toast/toastStore.js';

// ─── Validation Schema ──────────────────────────────────────────────────────
const playgroundSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  role: z.string().min(1, 'Please select a role.'),
  bio: z.string().min(10, 'Bio must be at least 10 characters.'),
  terms: z.boolean().refine((v) => v === true, {
    message: 'You must accept the terms to proceed.',
  }),
  notifications: z.boolean(),
});

type PlaygroundFormData = z.infer<typeof playgroundSchema>;

export function Playground() {
  // Tabs state
  const [activeTab, setActiveTab] = useState('primitives');

  // Dialogs state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDestructiveOpen, setIsDestructiveOpen] = useState(false);

  // Form states
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlaygroundFormData>({
    resolver: zodResolver(playgroundSchema),
    defaultValues: {
      username: '',
      email: '',
      role: '',
      bio: '',
      terms: false,
      notifications: true,
    },
  });

  const currentRole = watch('role');
  const roles = [
    { label: 'Developer', value: 'developer' },
    { label: 'Designer', value: 'designer' },
    { label: 'Product Manager', value: 'pm' },
  ];
  const selectedRole = roles.find((r) => r.value === currentRole);
  const triggerLabel = selectedRole ? selectedRole.label : 'Select a role...';

  const onSubmit = async (data: PlaygroundFormData) => {
    // Mock API submission with delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (data.username === 'admin') {
      setError('username', { message: 'The username "admin" is reserved.' });
      setError('root', {
        message: 'Submission failed due to server rejection.',
      });
      toast.error('Server validation failed.');
    } else {
      toast.success('Form submitted successfully!');
      reset();
    }
  };

  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    toast[type](`This is a custom ${type} toast message!`);
  };

  return (
    <div className="page-container">
      {/* Page Header Component Pattern */}
      <header className="page-header">
        <div className="page-header-text">
          <h1 className="main-title" id="playground-title">
            UI Playground
          </h1>
          <p className="subtitle">
            Interactive development and testing sandbox for DayFlow reusable
            components.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={() => reset()}>
            Reset Form
          </Button>
          <Button
            variant="primary"
            onClick={() => toast.info('Action triggered.')}
          >
            Header Action
          </Button>
        </div>
      </header>

      {/* Tabs Control */}
      <Tabs
        tabs={[
          { id: 'primitives', label: 'Basic Primitives' },
          { id: 'forms', label: 'Forms & Validation' },
          { id: 'feedback', label: 'Overlays & Feedback' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="page-content">
        {/* TAB 1: BASIC PRIMITIVES */}
        {activeTab === 'primitives' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)',
            }}
          >
            {/* Buttons Section */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Buttons
              </h2>
              <div className="action-row" style={{ gap: 'var(--space-4)' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Variants
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    States
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button disabled>Disabled</Button>
                    <Button isLoading variant="primary">
                      Loading
                    </Button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    With Icons
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="secondary">
                      <Plus size={14} aria-hidden="true" />
                      Add Item
                    </Button>
                    <Button variant="danger">
                      <Trash2 size={14} aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Badges Section */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Badges
              </h2>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                }}
              >
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </Card>

            {/* Tooltips Section */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Tooltips
              </h2>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-8)',
                  flexWrap: 'wrap',
                  padding: 'var(--space-4) 0',
                }}
              >
                <Tooltip content="Tooltip on top" position="top">
                  <Button variant="secondary">Top Position</Button>
                </Tooltip>
                <Tooltip content="Tooltip on right" position="right">
                  <Button variant="secondary">Right Position</Button>
                </Tooltip>
                <Tooltip content="Tooltip on bottom" position="bottom">
                  <Button variant="secondary">Bottom Position</Button>
                </Tooltip>
                <Tooltip content="Tooltip on left" position="left">
                  <Button variant="secondary">Left Position</Button>
                </Tooltip>
              </div>
            </Card>

            {/* Dropdowns Section */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Dropdowns
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <Dropdown
                  trigger={
                    <Button variant="secondary">Right Aligned Menu</Button>
                  }
                  align="right"
                  items={[
                    {
                      label: 'Action One',
                      onClick: () => toast.info('Action One clicked'),
                    },
                    {
                      label: 'Action Two',
                      onClick: () => toast.info('Action Two clicked'),
                    },
                  ]}
                />
                <Dropdown
                  trigger={
                    <Button variant="secondary">Left Aligned Menu</Button>
                  }
                  align="left"
                  items={[
                    {
                      label: 'Settings',
                      onClick: () => toast.info('Settings clicked'),
                    },
                    {
                      label: 'View Profile',
                      onClick: () => toast.info('Profile clicked'),
                    },
                  ]}
                />
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: FORMS & VALIDATION */}
        {activeTab === 'forms' && (
          <div style={{ maxWidth: '640px' }}>
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Form Validation Sandbox (RHF + Zod)
              </h2>

              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Submit the form to check validation states. Submit username{' '}
                <strong>"admin"</strong> to trigger a mock API server validation
                failure.
              </p>

              {errors.root && (
                <div
                  className="form-error-summary"
                  role="alert"
                  style={{ marginBottom: 'var(--space-4)' }}
                >
                  {errors.root.message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                  }}
                >
                  {/* Text Input */}
                  <div className="form-group">
                    <Label htmlFor="username" required>
                      Username
                    </Label>
                    <Input
                      id="username"
                      placeholder="e.g. janesmith"
                      error={errors.username?.message}
                      {...register('username')}
                    />
                    {errors.username && (
                      <span className="form-error-msg" role="alert">
                        {errors.username.message}
                      </span>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="form-group">
                    <Label htmlFor="email" required>
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@domain.com"
                      error={errors.email?.message}
                      {...register('email')}
                    />
                    {errors.email && (
                      <span className="form-error-msg" role="alert">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Select Dropdown */}
                  <div className="form-group">
                    <Label htmlFor="role" required>
                      Workspace Role
                    </Label>
                    <input type="hidden" {...register('role')} />
                    <Dropdown
                      style={{ width: '100%' }}
                      trigger={
                        <button
                          type="button"
                          id="role"
                          className={`form-select ${errors.role ? 'border-error' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            width: '100%',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{triggerLabel}</span>
                          <svg
                            className="select-chevron"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      }
                      align="left"
                      items={roles.map((r) => ({
                        label: r.label,
                        onClick: () => {
                          setValue('role', r.value, { shouldValidate: true });
                        },
                      }))}
                    />
                    {errors.role && (
                      <span className="form-error-msg" role="alert">
                        {errors.role.message}
                      </span>
                    )}
                  </div>

                  {/* Textarea */}
                  <div className="form-group">
                    <Label htmlFor="bio" required>
                      User Bio
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a little bit about yourself..."
                      error={errors.bio?.message}
                      {...register('bio')}
                    />
                    {errors.bio && (
                      <span className="form-error-msg" role="alert">
                        {errors.bio.message}
                      </span>
                    )}
                  </div>

                  {/* Switch */}
                  <div className="form-group">
                    <Switch
                      label="Receive marketing notifications via email"
                      {...register('notifications')}
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="form-group">
                    <Checkbox
                      label="I accept the Terms and Conditions of service"
                      {...register('terms')}
                    />
                    {errors.terms && (
                      <span className="form-error-msg" role="alert">
                        {errors.terms.message}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      style={{ width: '100%' }}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* TAB 3: OVERLAYS & FEEDBACK */}
        {activeTab === 'feedback' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-6)',
            }}
          >
            {/* Dialogs and Modals */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Dialogs & Overlays
              </h2>
              <div className="action-row">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Standard Dialog
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmOpen(true)}
                >
                  Standard Confirmation
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setIsDestructiveOpen(true)}
                >
                  Destructive Danger Confirm
                </Button>
              </div>

              {/* Standard Dialog */}
              <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Workspace Settings"
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Adjust settings for this localized environment context.
                    Press <strong>Esc</strong> key or click the close button to
                    exit.
                  </p>
                  <div className="form-group">
                    <Label htmlFor="dlg-input">Config Scope</Label>
                    <Input id="dlg-input" placeholder="e.g. Local" />
                  </div>
                  <div className="dialog-actions">
                    <Button
                      variant="secondary"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        toast.success('Settings updated');
                        setIsDialogOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </Dialog>

              {/* Standard Confirm Dialog */}
              <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Apply Updates"
                message="Are you sure you want to apply these system configurations?"
                onConfirm={() => toast.success('Updates applied successfully.')}
                onCancel={() => setIsConfirmOpen(false)}
              />

              {/* Dangerous Destructive Confirm Dialog */}
              <ConfirmDialog
                isOpen={isDestructiveOpen}
                title="Wipe Local Cached Session?"
                message="This will completely clear your local authentication details. Overlay click close is disabled."
                confirmLabel="Confirm Wipe"
                isDanger
                onConfirm={() => toast.success('Cached credentials purged.')}
                onCancel={() => setIsDestructiveOpen(false)}
              />
            </Card>

            {/* Toasts */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Toasts (Sonner Wrappers)
              </h2>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Trigger toast types. Rapid clicks will deduplicate alerts
                carrying identical messages.
              </p>
              <div className="action-row">
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('success')}
                >
                  Success Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('error')}
                >
                  Error Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('warning')}
                >
                  Warning Toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('info')}
                >
                  Info Toast
                </Button>
              </div>
            </Card>

            {/* Skeletons and Loading States */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                Loading & Skeletons
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Action Loading
                  </span>
                  <LoadingState message="Connecting to remote API clusters..." />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Skeleton States
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-4)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--space-3)',
                        alignItems: 'center',
                      }}
                    >
                      <Skeleton width={32} height={32} borderRadius="50%" />
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <Skeleton width="40%" height={12} />
                        <Skeleton width="20%" height={8} />
                      </div>
                    </div>
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <Skeleton width="100%" height={10} />
                      <Skeleton
                        width="90%"
                        height={10}
                        style={{ marginTop: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Empty & Error States */}
            <Card>
              <h2
                className="card-title"
                style={{ marginBottom: 'var(--space-4)' }}
              >
                System Feedback Layouts
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Empty State
                  </span>
                  <EmptyState
                    title="No Data Matches"
                    description="We couldn't find any resources in this active workspace scope. Clear filters to start fresh."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => toast.info('Filter cleared')}
                      >
                        Reset Filters
                      </Button>
                    }
                  />
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Error State
                  </span>
                  <ErrorState
                    title="Cluster Offline"
                    message="Connection to postgresql-prod-cluster timed out after 3000ms. Check local networking stack."
                    onRetry={() => toast.info('Retrying connection...')}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
export default Playground;
