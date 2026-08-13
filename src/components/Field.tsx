type Props = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  autoFocus?: boolean;
  autoComplete?: string;
};

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  min,
  max,
  autoFocus,
  autoComplete,
}: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-fairway uppercase">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 text-ink outline-none transition focus:border-gold"
      />
    </label>
  );
}
