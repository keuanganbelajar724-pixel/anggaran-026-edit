import React, { useState, useEffect, useRef } from 'react';

export interface RupiahInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string; // e.g. "Rp. " or "Rp "
  allowZeroBlankOnFocus?: boolean;
  id?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  title?: string;
}

export const formatRupiah = (num: number, prefix: string = 'Rp. '): string => {
  if (num === null || num === undefined || isNaN(num)) return `${prefix}0`;
  const formatted = new Intl.NumberFormat('id-ID').format(Math.round(num));
  return `${prefix}${formatted}`;
};

/**
 * Komponen Input Nominal Rupiah Interaktif:
 * - Otomatis memformat angka menjadi format Rupiah (contoh: Rp. 25.000.000) saat diketik
 * - Mendukung input digit langsung, paste teks bermata uang, backspace, dan seleksi
 * - Mengembalikan nilai integer murni (number) ke state via onChange
 */
export const RupiahInput: React.FC<RupiahInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Rp. 0',
  disabled = false,
  prefix = 'Rp. ',
  allowZeroBlankOnFocus = true,
  id,
  onFocus,
  onBlur,
  title,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rawDisplay, setRawDisplay] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sinkronisasi dengan props value saat tidak sedang fokus atau nilai diubah dari luar
  useEffect(() => {
    if (!isFocused) {
      if (value === 0) {
        setRawDisplay(`${prefix}0`);
      } else {
        setRawDisplay(formatRupiah(value, prefix));
      }
    }
  }, [value, isFocused, prefix]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const currentCursor = input.selectionEnd ?? input.value.length;
    const prevValue = input.value;

    // Hitung berapa banyak digit angka sebelum posisi kursor saat ini
    const digitsBeforeCursor = prevValue.slice(0, currentCursor).replace(/[^0-9]/g, '').length;

    // Ambil seluruh digit numerik bersih
    const allDigits = prevValue.replace(/[^0-9]/g, '');

    if (!allDigits) {
      setRawDisplay(prefix ? `${prefix}0` : '0');
      onChange(0);
      return;
    }

    const numValue = parseInt(allDigits, 10);
    const newFormatted = formatRupiah(numValue, prefix);
    setRawDisplay(newFormatted);
    onChange(numValue);

    // Pertahankan posisi kursor relatif terhadap jumlah digit
    requestAnimationFrame(() => {
      if (inputRef.current) {
        let foundDigits = 0;
        let newCursorPos = newFormatted.length;
        for (let i = 0; i < newFormatted.length; i++) {
          if (/[0-9]/.test(newFormatted[i])) {
            foundDigits++;
            if (foundDigits === digitsBeforeCursor) {
              newCursorPos = i + 1;
              break;
            }
          }
        }
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (allowZeroBlankOnFocus && value === 0) {
      setRawDisplay('');
    } else {
      setRawDisplay(formatRupiah(value, prefix));
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 10);
    }
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (value === 0) {
      setRawDisplay(`${prefix}0`);
    } else {
      setRawDisplay(formatRupiah(value, prefix));
    }
    if (onBlur) onBlur(e);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={rawDisplay}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      title={title || `Nilai: ${formatRupiah(value, prefix)}`}
    />
  );
};
