import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import FieldError, { errorProps, Required } from './FieldError';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  hint?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  className?: string;
}

/** Labelled text input / textarea with an accessible inline error message. */
const TextField = ({ id, label, value, onChange, error, required, multiline, hint, className, ...rest }: TextFieldProps) => {
  const err = errorProps(id, error);
  const describedBy = [hint ? `${id}-hint` : '', err['aria-describedby'] ?? ''].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name: id,
    value,
    required,
    'aria-required': required || undefined,
    'aria-invalid': err['aria-invalid'],
    'aria-describedby': describedBy,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    ...rest,
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required && <Required />}</Label>
      {hint && <p id={`${id}-hint`} className="text-sm text-gray-600">{hint}</p>}
      {multiline
        ? <Textarea {...common} className={[className, err.className].filter(Boolean).join(' ')} />
        : <Input {...common} className={[className, err.className].filter(Boolean).join(' ')} />}
      <FieldError id={id} message={error} />
    </div>
  );
};

export default TextField;
