// ============================================================
// TabSwitcher — selector de pestañas reutilizable (Power BI style).
// Duplicado en ReportesV2Page y EvaluacionesPage.
// ============================================================

export type TabItem<T extends string = string> = {
  key: T;
  label: string;
};

export type TabSwitcherProps<T extends string = string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  accentColor?: string;
};

export function TabSwitcher<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  accentColor = 'purple',
}: TabSwitcherProps<T>) {
  const activeClasses: Record<string, string> = {
    purple: 'border-purple-600 text-purple-600 bg-purple-50/30',
    blue: 'border-blue-600 text-blue-600 bg-blue-50/30',
  };

  const activeClass = activeClasses[accentColor] ?? activeClasses.purple;

  return (
    <div className="flex border-b border-gray-100 mb-6 gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === tab.key
              ? activeClass
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
