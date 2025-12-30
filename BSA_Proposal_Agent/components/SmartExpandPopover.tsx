import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Maximize2, X, Send, AlignLeft, AlignCenter, AlignJustify } from 'lucide-react';
import { ExpandDensity, ExpandConfig } from '../types';

interface SmartExpandPopoverProps {
    title?: string;
    onExpand: (config: ExpandConfig) => void;
    isLoading: boolean;
    buttonLabel?: string;
}

const SmartExpandPopover: React.FC<SmartExpandPopoverProps> = ({ 
    title = "Expand with AI", 
    onExpand, 
    isLoading,
    buttonLabel = "Expand with AI"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [density, setDensity] = useState<ExpandDensity>('Medium');
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSubmit = () => {
        onExpand({ instruction, density });
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="relative inline-block" ref={popoverRef}>
            {/* Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                onMouseEnter={() => !isOpen && !isLoading} // Pre-warm or simple tooltip logic could go here
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all border
                    ${isOpen 
                        ? 'bg-blue-100 text-blue-700 border-blue-300 ring-2 ring-blue-200' 
                        : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200'
                    }
                    ${isLoading ? 'opacity-70 cursor-wait' : ''}
                `}
                title="Expand this section with AI"
            >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isLoading ? 'Expanding...' : buttonLabel}
            </button>

            {/* Popover Content */}
            {isOpen && !isLoading && (
                <div className="absolute z-50 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-fade-in origin-top-left left-0 sm:left-auto sm:right-0">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Maximize2 className="w-4 h-4 text-blue-500" />
                            {title}
                        </h4>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Custom Instruction */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                Custom Instructions (Optional)
                            </label>
                            <textarea
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="E.g., Focus on financial risks, convert to table, use formal tone..."
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50"
                                rows={2}
                                autoFocus
                            />
                        </div>

                        {/* Density Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                Output Length & Detail
                            </label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {(['Low', 'Medium', 'High'] as ExpandDensity[]).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDensity(d)}
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-all
                                            ${density === d 
                                                ? 'bg-white text-blue-700 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700'
                                            }
                                        `}
                                        title={`${d} Detail Level`}
                                    >
                                        {d === 'Low' && <AlignLeft className="w-3 h-3" />}
                                        {d === 'Medium' && <AlignCenter className="w-3 h-3" />}
                                        {d === 'High' && <AlignJustify className="w-3 h-3" />}
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Send className="w-4 h-4" />
                            Generate Expansion
                        </button>
                    </div>
                    
                    {/* Arrow/Tail */}
                    <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45 sm:left-auto sm:right-4"></div>
                </div>
            )}
        </div>
    );
};

export default SmartExpandPopover;
