import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Icon, type IconName } from './Icon';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  counter?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean; className: string }) => ReactNode;
}

const controlClass =
  'block w-full rounded border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-500';

function FieldShell({ label, error, hint, counter, children }: FieldShellProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-800">
        {label}
      </label>
      {children({
        id,
        describedBy: error || hint ? messageId : undefined,
        invalid: !!error,
        className: cn(controlClass, error ? 'border-accent-600 focus:ring-accent-600/30' : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500/25'),
      })}
      {(error || hint || counter) && (
        <div className="mt-1 flex justify-between gap-3 text-xs">
          <p id={messageId} className={error ? 'text-accent-700' : 'text-gray-500'} role={error ? 'alert' : undefined}>
            {error ?? hint}
          </p>
          {counter && <span className="ml-auto tabular-nums text-gray-400">{counter}</span>}
        </div>
      )}
    </div>
  );
}

interface CommonProps {
  label: string;
  error?: string;
  hint?: string;
  counter?: string;
}

function LeadingIcon({ name }: { name: IconName }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
      <Icon name={name} className="h-4 w-4" />
    </span>
  );
}

export function TextField({ label, error, hint, counter, icon, ...rest }: CommonProps & ComponentProps<'input'> & { icon?: IconName }) {
  return (
    <FieldShell label={label} error={error} hint={hint} counter={counter}>
      {({ id, describedBy, invalid, className }) => (
        <div className="relative">
          {icon && <LeadingIcon name={icon} />}
          <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(className, icon && 'pl-9')} {...rest} />
        </div>
      )}
    </FieldShell>
  );
}

export function TextareaField({ label, error, hint, counter, ...rest }: CommonProps & ComponentProps<'textarea'>) {
  return (
    <FieldShell label={label} error={error} hint={hint} counter={counter}>
      {({ id, describedBy, invalid, className }) => (
        <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={className} {...rest} />
      )}
    </FieldShell>
  );
}

interface SelectFieldProps extends CommonProps, ComponentProps<'select'> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, error, hint, options, placeholder, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid, className }) => (
        <select id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={className} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function PasswordField({ label, error, hint, icon, ...rest }: CommonProps & Omit<ComponentProps<'input'>, 'type'> & { icon?: IconName }) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid, className }) => (
        <div className="relative">
          {icon && <LeadingIcon name={icon} />}
          <input id={id} type={visible ? 'text' : 'password'} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(className, 'pr-16', icon && 'pl-9')} {...rest} />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-500 hover:text-gray-900 focus:outline-none focus-visible:text-gray-900 focus-visible:underline"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      )}
    </FieldShell>
  );
}
