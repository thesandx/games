import { type Ref, useId } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Always visible. Placeholder text is never a label. */
  label: string;
  hint?: string;
  /** Says what went wrong and how to fix it: "Keys are 6 letters or numbers". */
  error?: string;
  /** Large, spaced, uppercase entry for room keys and codes. */
  code?: boolean;
  /**
   * Lets a form move focus to the field it rejected. React 19 passes `ref` to
   * a function component as an ordinary prop, so no `forwardRef` is needed.
   */
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, hint, error, code = false, className, ref, ...rest }: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'bg-surface text-ink rounded-input min-h-13 w-full border-2 px-4',
          // The wobble plays once, when the error appears. See design-language.md > Recipes.
          error ? 'border-danger animate-wobble' : 'border-line',
          'placeholder:text-ink-soft/70 focus-visible:outline-brand',
          code && 'font-display text-key min-h-18 text-center tracking-[0.3em] uppercase',
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-small text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-small text-ink flex items-center gap-1.5 font-medium"
        >
          <span aria-hidden="true" className="bg-danger inline-block size-2.5 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
}
