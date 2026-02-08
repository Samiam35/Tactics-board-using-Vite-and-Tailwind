import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Users, Trash2, ToggleLeft, ToggleRight, Zap, Search, Loader2 } from 'lucide-react';
import { useTacticalStore } from '../store/useTacticalStore';
import { fetchTeamSquad, fetchTeamsList } from '../services/teamApi';

// Get stamina bar color based on value (25% each: light green > orange > yellow > red)
const getStaminaColor = (stamina: number): string => {
    if (stamina > 75) return '#10b981'; // Light Green (100-75%)
    if (stamina > 50) return '#f97316'; // Orange (75-50%)
    if (stamina > 25) return '#eab308'; // Yellow (50-25%)
    return '#ef4444'; // Red (25-0%)
};

export const InspectorPanel = () => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teamsList, setTeamsList] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const players = useTacticalStore((state) => state.players);
    const selectedPlayerId = useTacticalStore((state) => state.selectedPlayerId);
    const selectPlayer = useTacticalStore((state) => state.selectPlayer);
    const updatePlayerDetails = useTacticalStore((state) => state.updatePlayerDetails);
    const updatePlayerStamina = useTacticalStore((state) => state.updatePlayerStamina);
    const toggleBench = useTacticalStore((state) => state.toggleBench);
    const deletePlayer = useTacticalStore((state) => state.deletePlayer);
    const addPlayer = useTacticalStore((state) => state.addPlayer);
    const loadTeamFromApi = useTacticalStore((state) => state.loadTeamFromApi);
    const teamNames = useTacticalStore((state) => state.teamNames);

    const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
    const teamPlayers = players.filter((p) => p.team === activeTeam);
    const activePlayers = teamPlayers.filter((p) => !p.isOnBench);
    const benchPlayers = teamPlayers.filter((p) => p.isOnBench);

    const handleLoadTeam = async (teamName?: string) => {
        const nameToLoad = teamName || searchQuery.trim();
        if (!nameToLoad) return;

        setIsLoading(true);
        setError(null);
        setShowSuggestions(false);

        try {
            const players = await fetchTeamSquad(nameToLoad);
            loadTeamFromApi(activeTeam, players, nameToLoad);
            setSearchQuery('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load team');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch teams list on mount
    useEffect(() => {
        fetchTeamsList()
            .then((teams) => {
                console.log(`Loaded ${teams.length} teams for autocomplete`);
                setTeamsList(teams);
            })
            .catch(console.error);
    }, []);

    // Filter suggestions based on search query
    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return [];
        const query = searchQuery.toLowerCase();
        return teamsList
            .filter(team => team.toLowerCase().includes(query))
            .slice(0, 8); // Limit to 8 suggestions
    }, [searchQuery, teamsList]);

    return (
        <div className="fixed right-4 top-4 z-50 w-72">
            <div className="backdrop-blur-md bg-slate-900/70 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer hover:bg-white/5"
                    onClick={() => setIsMinimized(!isMinimized)}
                >
                    <div className="flex items-center gap-2 text-white">
                        <Users size={18} />
                        <span className="font-semibold">Squad Roster</span>
                    </div>
                    {isMinimized ? <ChevronDown size={18} className="text-white/60" /> : <ChevronUp size={18} className="text-white/60" />}
                </div>

                {!isMinimized && (
                    <>
                        {/* Team Tabs */}
                        <div className="flex border-b border-white/10">
                            <button
                                onClick={() => setActiveTeam('home')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTeam === 'home'
                                    ? 'text-blue-500 border-b-2 border-blue-600 bg-blue-600/10'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {teamNames.home} ({players.filter(p => p.team === 'home' && !p.isOnBench).length}/11)
                            </button>
                            <button
                                onClick={() => setActiveTeam('away')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTeam === 'away'
                                    ? 'text-red-500 border-b-2 border-red-600 bg-red-600/10'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {teamNames.away} ({players.filter(p => p.team === 'away' && !p.isOnBench).length}/11)
                            </button>
                        </div>

                        {/* Team Search */}
                        <div className="p-3 border-b border-white/10 relative">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => {
                                            // Delay to allow click on suggestion
                                            setTimeout(() => setShowSuggestions(false), 150);
                                        }}
                                        placeholder="Search team..."
                                        className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-white/30"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && searchQuery.trim()) {
                                                handleLoadTeam();
                                            }
                                            if (e.key === 'Escape') {
                                                setShowSuggestions(false);
                                            }
                                        }}
                                    />

                                    {/* Autocomplete Dropdown */}
                                    {showSuggestions && filteredSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                                            {filteredSuggestions.map((team) => (
                                                <button
                                                    key={team}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-blue-600/30 hover:text-white transition-colors border-b border-white/5 last:border-b-0"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setSearchQuery(team);
                                                        handleLoadTeam(team);
                                                    }}
                                                >
                                                    {team}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleLoadTeam}
                                    disabled={isLoading || !searchQuery.trim()}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-white/40 text-white text-sm rounded flex items-center gap-1 transition-colors"
                                >
                                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                    Load
                                </button>
                            </div>
                            {error && (
                                <div className="mt-2 text-xs text-red-400">{error}</div>
                            )}
                        </div>

                        {/* Selected Player Editor */}
                        {selectedPlayer && (
                            <div className="p-3 border-b border-white/10 bg-white/5">
                                <div className="text-xs text-white/40 mb-2">SELECTED PLAYER</div>

                                {/* Name Input */}
                                <input
                                    type="text"
                                    value={selectedPlayer.name}
                                    onChange={(e) => updatePlayerDetails(selectedPlayer.id, { name: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-white text-sm mb-2 focus:outline-none focus:border-white/30"
                                    title="Player name"
                                    placeholder="Enter player name"
                                />

                                {/* Number Input */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-white/60 text-xs">Number:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={selectedPlayer.number}
                                        onChange={(e) => updatePlayerDetails(selectedPlayer.id, { number: parseInt(e.target.value) || 1 })}
                                        className="w-16 bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-white/30"
                                        title="Jersey number"
                                        placeholder="#"
                                    />
                                </div>

                                {/* Stamina Slider */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white/60 text-xs flex items-center gap-1">
                                            <Zap size={12} /> Condition
                                        </span>
                                        <span
                                            className="text-xs font-bold"
                                            style={{ color: getStaminaColor(selectedPlayer.stamina) }}
                                        >
                                            {selectedPlayer.stamina}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={selectedPlayer.stamina}
                                        onChange={(e) => updatePlayerStamina(selectedPlayer.id, parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        title={`Stamina: ${selectedPlayer.stamina}%`}
                                        style={{
                                            accentColor: getStaminaColor(selectedPlayer.stamina),
                                        }}
                                    />
                                </div>

                                {/* Bench Toggle */}
                                <button
                                    onClick={() => toggleBench(selectedPlayer.id)}
                                    className={`w-full flex items-center justify-center gap-2 py-1.5 rounded text-sm transition-colors ${selectedPlayer.isOnBench
                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                        }`}
                                >
                                    {selectedPlayer.isOnBench ? (
                                        <>
                                            <ToggleRight size={16} /> Put on Field
                                        </>
                                    ) : (
                                        <>
                                            <ToggleLeft size={16} /> Send to Bench
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Active Players */}
                        <div className="max-h-48 overflow-y-auto">
                            <div className="p-2 text-xs text-white/40 border-b border-white/5">ON FIELD</div>
                            {activePlayers.map((player) => (
                                <div
                                    key={player.id}
                                    onClick={() => selectPlayer(player.id)}
                                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${selectedPlayerId === player.id
                                        ? 'bg-white/10'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: activeTeam === 'home' ? '#457B9D' : '#E63946' }}
                                    >
                                        {player.number}
                                    </div>
                                    <span className="text-white text-sm flex-1">{player.name}</span>
                                    {/* Mini stamina bar */}
                                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${player.stamina}%`,
                                                backgroundColor: getStaminaColor(player.stamina),
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bench */}
                        {benchPlayers.length > 0 && (
                            <div className="max-h-32 overflow-y-auto border-t border-white/10">
                                <div className="p-2 text-xs text-white/40">BENCH</div>
                                {benchPlayers.map((player) => (
                                    <div
                                        key={player.id}
                                        onClick={() => selectPlayer(player.id)}
                                        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors opacity-60 ${selectedPlayerId === player.id
                                            ? 'bg-white/10 opacity-100'
                                            : 'hover:bg-white/5 hover:opacity-80'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: activeTeam === 'home' ? '#457B9D' : '#E63946' }}
                                            >
                                                {player.number}
                                            </div>
                                            <span className="text-white text-sm">{player.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deletePlayer(player.id);
                                            }}
                                            className="text-red-400/60 hover:text-red-400 transition-colors"
                                            title="Remove player"
                                            aria-label="Remove player from squad"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Player Button */}
                        <div className="p-2 border-t border-white/10">
                            <button
                                onClick={() => addPlayer(activeTeam)}
                                className="w-full py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
                            >
                                + Add Substitute
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
