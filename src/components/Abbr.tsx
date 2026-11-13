import React from 'react';
import { getAbbrTooltip } from '../constants/abbreviations';

interface AbbrProps {
  text: string;
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Инженерная интерактивная аббревиатура:
 * при наведении курсора показывает понятное всплывающее окно с расшифровкой термина
 */
export const Abbr: React.FC<AbbrProps> = ({
  text,
  tooltip,
  className = '',
  children,
}) => {
  const explanation = tooltip || getAbbrTooltip(text) || text;

  return (
    <span
      className={`group relative inline-flex items-baseline cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2 ${className}`}
    >
      <span>{children || text}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-normal rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-left font-sans text-[11px] font-normal normal-case leading-snug text-slate-100 shadow-xl group-hover:block min-w-[200px] max-w-[280px]">
        <strong className="block text-amber-300 font-semibold mb-0.5">{text}</strong>
        {explanation}
      </span>
    </span>
  );
};

export default Abbr;
