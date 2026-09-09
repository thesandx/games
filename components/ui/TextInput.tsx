'use client';

import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  /** Rendered below the field and wired up via `aria-describedby`. */
  hint?: string;
  /** Announced assertively and given a red-free, ink-toned treatment. */
  error?: string;
  className?: string;
}

/**
 * Labelled text field.
 *
 * The label is always rendered — never a placeholder standing in for one, which
 * disappears the moment someone types and leaves screen-reader users with an
 * unnamed input.
 */
export function TextInput({ label, hint, error, className, id, ...props }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="text-ink-1 text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'text-ink-1 placeholder:text-neutral-500 min-h-[52px] w-full rounded-input border-2 bg-white px-4 text-base',
          error ? 'border-coral' : 'border-ink-1',
        )}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-ink-3 text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-coral text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
