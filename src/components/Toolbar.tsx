import { useState } from 'react';
import { MousePointer, Pencil, Trash2, Eraser, ChevronDown, ChevronUp, Undo2, Redo2 } from 'lucide-react';
import { useTacticalStore, PEN_COLORS } from '../store/useTacticalStore';
import type { Tool, PenColor } from '../store/useTacticalStore';

interface ToolButtonProps {
    icon: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
    title: string;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

const ToolButton = ({ icon, isActive, onClick, title, variant = 'default', disabled }: ToolButtonProps) => {
    const baseClasses = 'w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200';
    const variantClasses = disabled
        ? 'text-white/20 cursor-not-allowed'
        : variant === 'danger'
            ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer'
            : isActive
                ? 'bg-white/20 text-white shadow-lg cursor-pointer'
                : 'text-white/60 hover:bg-white/10 hover:text-white cursor-pointer';

    return (
        <button
            className={`${baseClasses} ${variantClasses}`}
            onClick={disabled ? undefined : onClick}
            title={title}
            disabled={disabled}
        >
            {icon}
        </button>
    );
};

interface ColorSwatchProps {
    color: PenColor;
    isActive: boolean;
    onClick: () => void;
    name: string;
}

const ColorSwatch = ({ color, isActive, onClick, name }: ColorSwatchProps) => (
    <button
        onClick={onClick}
        title={name}
        className={`w-8 h-8 rounded-full transition-all duration-200 ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
            }`}
        style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}88`
        }}
    />
);

export const Toolbar = () => {
    const activeTool = useTacticalStore((state) => state.activeTool);
    const setActiveTool = useTacticalStore((state) => state.setActiveTool);
    const penColor = useTacticalStore((state) => state.penColor);
    const setPenColor = useTacticalStore((state) => state.setPenColor);
    const eraserSize = useTacticalStore((state) => state.eraserSize);
    const setEraserSize = useTacticalStore((state) => state.setEraserSize);
    const clearLines = useTacticalStore((state) => state.clearLines);
    const undoLastLine = useTacticalStore((state) => state.undoLastLine);
    const redoLine = useTacticalStore((state) => state.redoLine);
    const lines = useTacticalStore((state) => state.lines);
    const lineHistory = useTacticalStore((state) => state.lineHistory);

    const [showColors, setShowColors] = useState(false);

    const handleToolSelect = (tool: Tool) => {
        setActiveTool(tool);
        if (tool === 'pen') {
            setShowColors(true);
        }
    };

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
            <div className="flex flex-col gap-2 p-2 backdrop-blur-md bg-slate-900/70 border border-white/10 rounded-xl shadow-2xl">
                {/* Select Tool */}
                <ToolButton
                    icon={<MousePointer size={20} />}
                    isActive={activeTool === 'select'}
                    onClick={() => handleToolSelect('select')}
                    title="Select Tool (Move Players)"
                />

                {/* Pen Tool */}
                <div className="relative">
                    <ToolButton
                        icon={
                            <div className="relative">
                                <Pencil size={20} />
                                <div
                                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white/50"
                                    style={{ backgroundColor: penColor, boxShadow: `0 0 6px ${penColor}` }}
                                />
                            </div>
                        }
                        isActive={activeTool === 'pen'}
                        onClick={() => handleToolSelect('pen')}
                        title="Pen Tool (Draw Tactics)"
                    />
                </div>

                {/* Eraser Tool */}
                <ToolButton
                    icon={<Eraser size={20} />}
                    isActive={activeTool === 'eraser'}
                    onClick={() => handleToolSelect('eraser')}
                    title="Eraser (Click Lines to Remove)"
                />

                {/* Eraser Size Slider - Only visible when eraser is active */}
                {activeTool === 'eraser' && (
                    <div className="flex flex-col gap-1 p-2 bg-slate-800/50 rounded-lg">
                        <span className="text-white/60 text-xs text-center">{eraserSize}px</span>
                        <input
                            type="range"
                            min={10}
                            max={100}
                            value={eraserSize}
                            onChange={(e) => setEraserSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                            style={{ width: '48px' }}
                        />
                    </div>
                )}

                {/* Divider */}
                <div className="w-full h-px bg-white/10 my-1" />

                {/* Color Picker Toggle */}
                <button
                    onClick={() => setShowColors(!showColors)}
                    className="w-12 h-8 flex items-center justify-center gap-1 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    title="Color Palette"
                >
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: penColor, boxShadow: `0 0 6px ${penColor}` }}
                    />
                    {showColors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* Color Palette */}
                {showColors && (
                    <div className="flex flex-col gap-2 p-2 bg-slate-800/50 rounded-lg">
                        {PEN_COLORS.map(({ color, name }) => (
                            <ColorSwatch
                                key={color}
                                color={color}
                                name={name}
                                isActive={penColor === color}
                                onClick={() => setPenColor(color)}
                            />
                        ))}
                    </div>
                )}

                {/* Divider */}
                <div className="w-full h-px bg-white/10 my-1" />

                {/* Undo/Redo */}
                <div className="flex gap-1">
                    <button
                        onClick={undoLastLine}
                        disabled={lines.length === 0}
                        className={`w-6 h-10 flex items-center justify-center rounded transition-colors ${lines.length === 0
                                ? 'text-white/20 cursor-not-allowed'
                                : 'text-white/60 hover:bg-white/10 hover:text-white cursor-pointer'
                            }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={redoLine}
                        disabled={lineHistory.length === 0}
                        className={`w-6 h-10 flex items-center justify-center rounded transition-colors ${lineHistory.length === 0
                                ? 'text-white/20 cursor-not-allowed'
                                : 'text-white/60 hover:bg-white/10 hover:text-white cursor-pointer'
                            }`}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>

                {/* Clear All */}
                <ToolButton
                    icon={<Trash2 size={20} />}
                    onClick={clearLines}
                    title="Clear All Drawings"
                    variant="danger"
                />
            </div>
        </div>
    );
};
