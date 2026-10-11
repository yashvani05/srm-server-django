import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

interface SegmentedRadioProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'children'> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function SegmentedRadio({ label, options, error, className, ...inputProps }: SegmentedRadioProps) {
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-gray-800">{label}</legend>
      <div className={cn('grid gap-1 rounded-md bg-gray-100 p-0.5', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label key={o.value} className="relative cursor-pointer">
            <input type="radio" value={o.value} className="peer sr-only" {...inputProps} />
            <span className="block rounded px-3 py-2 text-center text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 peer-checked:bg-white peer-checked:text-gray-900 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500">
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-xs text-accent-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
