// ============================================================
// AccordionGroup — acordeón colapsable reutilizable.
// Usado en TablaAnonima, TablaEvaluacion, etc.
// ============================================================

import { useState, type ReactNode } from 'react';
import { ChevronRight, Folder } from 'lucide-react';

export type AccordionGroupProps = {
  title: string;
  badge?: ReactNode;
  rightContent?: ReactNode;
  /** Lucide icon component for the title */
  iconColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function AccordionGroup({
  title,
  badge,
  rightContent,
  iconColor = 'text-purple-600',
  defaultOpen = true,
  children,
}: AccordionGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white transition-all duration-300">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 transition-colors cursor-pointer border-0 text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
            <ChevronRight size={18} className="text-gray-500" />
          </span>
          <Folder size={18} className={`${iconColor} shrink-0`} />
          <span className="font-extrabold text-sm sm:text-base text-gray-800 tracking-tight uppercase">
            {title}
          </span>
          {badge}
        </div>
        {rightContent}
      </button>

      <div className={`transition-all duration-300 ${isOpen ? 'block border-t border-gray-100' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
}
