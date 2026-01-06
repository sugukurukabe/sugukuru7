import React from 'react';
import { FilterOption } from '../../types/candidates';
import { X, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    options: {
        availabilities: FilterOption[];
        nationalities: FilterOption[];
        visaTypes: FilterOption[];
        skills: FilterOption[];
    };
    selected: {
        availability: string[];
        nationality: string[];
        visa: string[];
        skill: string[];
    };
    onToggle: (type: string, value: string) => void;
    onClose: () => void;
}

export const SearchFilters: React.FC<Props> = ({ options, selected, onToggle, onClose }) => {
    const FilterSection = ({ title, items, selectedItems, type }: any) => (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {items.map((opt: FilterOption) => {
                    const isSelected = selectedItems.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onToggle(type, opt.value)}
                            className={clsx(
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",
                                isSelected
                                    ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                            )}
                        >
                            {isSelected && <Check className="w-3 h-3" />}
                            {opt.label}
                            <span className={clsx("text-[9px]", isSelected ? "text-white/60" : "text-white/20")}>
                                {opt.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="bg-[#0f1115] rounded-t-[2.5rem] p-6 pb-12 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black">検索フィルター</h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/40">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <FilterSection
                title="空き状況"
                items={options.availabilities}
                selectedItems={selected.availability}
                type="availability"
            />

            <FilterSection
                title="国籍"
                items={options.nationalities}
                selectedItems={selected.nationality}
                type="nationality"
            />

            <FilterSection
                title="ビザ種類"
                items={options.visaTypes}
                selectedItems={selected.visa}
                type="visa"
            />

            <FilterSection
                title="スキル・資格"
                items={options.skills}
                selectedItems={selected.skill}
                type="skill"
            />

            <div className="pt-6">
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/40 active:scale-95 transition-all"
                >
                    検索結果を表示
                </button>
            </div>
        </div>
    );
};
