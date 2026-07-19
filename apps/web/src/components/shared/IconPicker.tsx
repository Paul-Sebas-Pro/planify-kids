interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  options: string[];
}

export function IconPicker({ value, onChange, options }: IconPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className="w-9 h-9 rounded-xl text-xl flex items-center justify-center border-2 transition-all"
          style={{
            borderColor: value === icon ? "#6C63FF" : "transparent",
            backgroundColor: value === icon ? "#ede9fe" : "#f8f8f8",
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
