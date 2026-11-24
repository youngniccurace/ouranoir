import React from 'react';

/** Inline error message linked to its field via aria-describedby="<id>-error". */
const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={`${id}-error`} className="text-sm font-semibold text-[#B02A37]" role="alert">
      {message}
    </p>
  ) : null;

/** Props that connect an input to its FieldError for screen readers. */
export const errorProps = (id: string, message?: string) => ({
  'aria-invalid': message ? (true as const) : undefined,
  'aria-describedby': message ? `${id}-error` : undefined,
  className: message ? 'border-[#B02A37] focus-visible:ring-[#B02A37]' : undefined,
});

export const Required = () => (
  <span className="text-[#B02A37]" aria-hidden="true"> *</span>
);

export default FieldError;
