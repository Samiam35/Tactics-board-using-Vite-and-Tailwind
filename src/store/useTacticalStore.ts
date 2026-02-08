import { create } from 'zustand';
import type { ApiPlayer } from '../services/teamApi';
import { buildLineup, FORMATION_442_HOME, FORMATION_442_AWAY } from '../utils/positionMapping';

export type Tool = 'select' | 'pen' | 'eraser';

export type PenColor = '#ffff00' | '#ff0000' | '#00ffff' | '#ff00ff' | '#ffffff';

export const PEN_COLORS: { color: PenColor; name: string }[] = [
    { color: '#ffff00', name: 'Neon Yellow' },
    { color: '#ff0000', name: 'Danger Red' },
    { color: '#00ffff', name: 'Cyan' },
    { color: '#ff00ff', name: 'Magenta' },
    { color: '#ffffff', name: 'White' },
];

export interface Player {
    id: string;
    team: 'home' | 'away';
    number: number;
    name: string;
    x: number;
    y: number;
    isOnBench: boolean;
    stamina: number; // 0-100
}

export interface Line {
    id: string;
    points: number[];
    color: string;
}

export interface Ball {
    x: number;
    y: number;
}

export interface PitchDimensions {
    pitchWidth: number;
    pitchHeight: number;
    offsetX: number;
    offsetY: number;
}

interface TacticalState {
    activeTool: Tool;
    penColor: PenColor;
    eraserSize: number;
    players: Player[];
    lines: Line[];
    lineHistory: Line[][];
    selectedPlayerId: string | null;
    ball: Ball;
    pitchDimensions: PitchDimensions;
    teamNames: { home: string; away: string };

    // Tool actions
    setActiveTool: (tool: Tool) => void;
    setPenColor: (color: PenColor) => void;
    setEraserSize: (size: number) => void;

    // Player actions
    updatePlayerPosition: (id: string, x: number, y: number) => void;
    updatePlayerDetails: (id: string, details: Partial<Pick<Player, 'name' | 'number' | 'team'>>) => void;
    updatePlayerStamina: (id: string, stamina: number) => void;
    toggleBench: (id: string) => void;
    addPlayer: (team: 'home' | 'away') => void;
    deletePlayer: (id: string) => void;
    selectPlayer: (id: string | null) => void;

    // Ball actions
    updateBallPosition: (x: number, y: number) => void;

    // Drawing actions
    addLine: (id: string, points: number[], color: string) => void;
    clearLines: () => void;
    eraseLine: (lineId: string) => void;
    undoLastLine: () => void;
    redoLine: () => void;

    // Initialization
    initializePlayers: (pitchWidth: number, pitchHeight: number, offsetX: number, offsetY: number) => void;

    // Team loading from API
    loadTeamFromApi: (team: 'home' | 'away', apiPlayers: ApiPlayer[], teamName: string) => void;

    // Pitch dimensions
    setPitchDimensions: (dimensions: PitchDimensions) => void;
}

// Default player names - Chelsea vs Arsenal
const DEFAULT_NAMES = {
    home: ['Sanchez', 'James', 'Fofana', 'Colwill', 'Cucurella', 'Caicedo', 'Fernandez', 'Palmer', 'Madueke', 'Jackson', 'Neto'], // Chelsea
    away: ['Raya', 'White', 'Saliba', 'Gabriel', 'Timber', 'Rice', 'Odegaard', 'Saka', 'Havertz', 'Martinelli', 'Trossard'], // Arsenal
};

// Generate 4-4-2 formation
const generate442Formation = (
    team: 'home' | 'away',
    pitchWidth: number,
    pitchHeight: number,
    offsetX: number,
    offsetY: number
): Player[] => {
    const players: Player[] = [];
    const isHome = team === 'home';
    const names = DEFAULT_NAMES[team];

    const xPositions = isHome
        ? [0.05, 0.22, 0.38, 0.48]
        : [0.95, 0.78, 0.62, 0.52];

    const yPositions = [
        [0.5],
        [0.15, 0.38, 0.62, 0.85],
        [0.15, 0.38, 0.62, 0.85],
        [0.35, 0.65],
    ];

    let playerNumber = 1;
    let nameIndex = 0;

    xPositions.forEach((xPos, lineIndex) => {
        yPositions[lineIndex].forEach((yPos) => {
            players.push({
                id: `${team}-${playerNumber}`,
                team,
                number: playerNumber,
                name: names[nameIndex] || `Player ${playerNumber}`,
                x: offsetX + xPos * pitchWidth,
                y: offsetY + yPos * pitchHeight,
                isOnBench: false,
                stamina: 100, // Full stamina by default
            });
            playerNumber++;
            nameIndex++;
        });
    });

    return players;
};

export const useTacticalStore = create<TacticalState>((set, get) => ({
    activeTool: 'select',
    penColor: '#ffff00',
    eraserSize: 20,
    players: [],
    lines: [],
    lineHistory: [],
    selectedPlayerId: null,
    ball: { x: 0, y: 0 }, // Will be set to center on init
    pitchDimensions: { pitchWidth: 0, pitchHeight: 0, offsetX: 0, offsetY: 0 },
    teamNames: { home: 'Chelsea', away: 'Arsenal' },

    setActiveTool: (tool) => set({ activeTool: tool }),

    setPenColor: (color) => set({ penColor: color, activeTool: 'pen' }),

    setEraserSize: (size) => set({ eraserSize: size }),

    updatePlayerPosition: (id, x, y) =>
        set((state) => ({
            players: state.players.map((player) =>
                player.id === id ? { ...player, x, y } : player
            ),
        })),

    updatePlayerDetails: (id, details) =>
        set((state) => ({
            players: state.players.map((player) =>
                player.id === id ? { ...player, ...details } : player
            ),
        })),

    updatePlayerStamina: (id, stamina) =>
        set((state) => ({
            players: state.players.map((player) =>
                player.id === id ? { ...player, stamina: Math.max(0, Math.min(100, stamina)) } : player
            ),
        })),

    toggleBench: (id) =>
        set((state) => ({
            players: state.players.map((player) =>
                player.id === id ? { ...player, isOnBench: !player.isOnBench } : player
            ),
        })),

    addPlayer: (team) => {
        const state = get();
        const teamPlayers = state.players.filter((p) => p.team === team);
        const maxNumber = teamPlayers.length > 0
            ? Math.max(...teamPlayers.map((p) => p.number))
            : 0;

        const newPlayer: Player = {
            id: `${team}-${Date.now()}`,
            team,
            number: maxNumber + 1,
            name: `New Player`,
            x: 100,
            y: 100,
            isOnBench: true,
            stamina: 100,
        };

        set((state) => ({
            players: [...state.players, newPlayer],
            selectedPlayerId: newPlayer.id,
        }));
    },

    deletePlayer: (id) =>
        set((state) => ({
            players: state.players.filter((player) => player.id !== id),
            selectedPlayerId: state.selectedPlayerId === id ? null : state.selectedPlayerId,
        })),

    selectPlayer: (id) => set({ selectedPlayerId: id }),

    // Ball position
    updateBallPosition: (x, y) => set({ ball: { x, y } }),

    // Drawing actions
    addLine: (id, points, color) =>
        set((state) => ({
            lines: [...state.lines, { id, points, color }],
            lineHistory: [],
        })),

    clearLines: () => set((state) => ({
        lineHistory: state.lines.length > 0 ? [state.lines] : state.lineHistory,
        lines: [],
    })),

    eraseLine: (lineId) =>
        set((state) => ({
            lines: state.lines.filter((line) => line.id !== lineId),
        })),

    undoLastLine: () =>
        set((state) => {
            if (state.lines.length === 0) return state;
            const newLines = state.lines.slice(0, -1);
            const removedLine = state.lines[state.lines.length - 1];
            return {
                lines: newLines,
                lineHistory: [[removedLine], ...state.lineHistory],
            };
        }),

    redoLine: () =>
        set((state) => {
            if (state.lineHistory.length === 0) return state;
            const [linesToRestore, ...remainingHistory] = state.lineHistory;
            return {
                lines: [...state.lines, ...linesToRestore],
                lineHistory: remainingHistory,
            };
        }),

    initializePlayers: (pitchWidth, pitchHeight, offsetX, offsetY) =>
        set({
            players: [
                ...generate442Formation('home', pitchWidth, pitchHeight, offsetX, offsetY),
                ...generate442Formation('away', pitchWidth, pitchHeight, offsetX, offsetY),
            ],
            // Set ball to center of pitch
            ball: {
                x: offsetX + pitchWidth / 2,
                y: offsetY + pitchHeight / 2,
            },
        }),

    loadTeamFromApi: (team, apiPlayers, teamName) => {
        const { pitchDimensions } = get();
        const { pitchWidth, pitchHeight, offsetX, offsetY } = pitchDimensions;
        const isHome = team === 'home';

        // Use position-based lineup building
        const { startingXI, substitutes } = buildLineup(apiPlayers, isHome);
        const formation = isHome ? FORMATION_442_HOME : FORMATION_442_AWAY;

        const newPlayers: Player[] = startingXI.map((apiPlayer, index) => ({
            id: `${team}-${apiPlayer.id}`,
            team,
            number: index + 1,
            name: apiPlayer.name,
            x: offsetX + formation[index].x * pitchWidth,
            y: offsetY + formation[index].y * pitchHeight,
            isOnBench: false,
            stamina: 100,
        }));

        // Add substitutes to bench
        substitutes.forEach((apiPlayer, index) => {
            newPlayers.push({
                id: `${team}-${apiPlayer.id}`,
                team,
                number: 12 + index,
                name: apiPlayer.name,
                x: 50,
                y: 50,
                isOnBench: true,
                stamina: 100,
            });
        });

        set((state) => ({
            players: [
                ...state.players.filter((p) => p.team !== team), // Keep other team
                ...newPlayers,
            ],
            teamNames: {
                ...state.teamNames,
                [team]: teamName,
            },
        }));
    },

    setPitchDimensions: (dimensions) => set({ pitchDimensions: dimensions }),
}));
