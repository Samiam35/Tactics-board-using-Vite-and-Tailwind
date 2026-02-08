// Utility functions for mapping player positions to pitch locations

import type { ApiPlayer } from '../services/teamApi';

// Position categories based on FIFA position codes
type PositionCategory = 'GK' | 'DEF' | 'MID' | 'ATT';

// Map FIFA position codes to categories
const POSITION_CATEGORY_MAP: Record<string, PositionCategory> = {
    // Goalkeepers
    'GK': 'GK',

    // Defenders
    'CB': 'DEF',
    'RB': 'DEF',
    'LB': 'DEF',
    'RWB': 'DEF',
    'LWB': 'DEF',
    'SW': 'DEF',

    // Midfielders
    'CM': 'MID',
    'CDM': 'MID',
    'CAM': 'MID',
    'RM': 'MID',
    'LM': 'MID',
    'RW': 'MID',  // Sometimes classified as MID
    'LW': 'MID',

    // Attackers
    'ST': 'ATT',
    'CF': 'ATT',
    'RF': 'ATT',
    'LF': 'ATT',
};

// Formation slots with their pitch positions (relative 0-1)
export interface FormationSlot {
    category: PositionCategory;
    x: number;
    y: number;
}

// 4-4-2 formation slot definitions
export const FORMATION_442_HOME: FormationSlot[] = [
    { category: 'GK', x: 0.06, y: 0.5 },
    { category: 'DEF', x: 0.22, y: 0.15 },  // RB
    { category: 'DEF', x: 0.22, y: 0.38 },  // CB
    { category: 'DEF', x: 0.22, y: 0.62 },  // CB
    { category: 'DEF', x: 0.22, y: 0.85 },  // LB
    { category: 'MID', x: 0.40, y: 0.15 },  // RM
    { category: 'MID', x: 0.40, y: 0.38 },  // CM
    { category: 'MID', x: 0.40, y: 0.62 },  // CM
    { category: 'MID', x: 0.40, y: 0.85 },  // LM
    { category: 'ATT', x: 0.48, y: 0.35 },  // ST
    { category: 'ATT', x: 0.48, y: 0.65 },  // ST
];

export const FORMATION_442_AWAY: FormationSlot[] = [
    { category: 'GK', x: 0.94, y: 0.5 },
    { category: 'DEF', x: 0.78, y: 0.15 },  // RB
    { category: 'DEF', x: 0.78, y: 0.38 },  // CB
    { category: 'DEF', x: 0.78, y: 0.62 },  // CB
    { category: 'DEF', x: 0.78, y: 0.85 },  // LB
    { category: 'MID', x: 0.60, y: 0.15 },  // RM
    { category: 'MID', x: 0.60, y: 0.38 },  // CM
    { category: 'MID', x: 0.60, y: 0.62 },  // CM
    { category: 'MID', x: 0.60, y: 0.85 },  // LM
    { category: 'ATT', x: 0.52, y: 0.35 },  // ST
    { category: 'ATT', x: 0.52, y: 0.65 },  // ST
];

function getPositionCategory(position: string): PositionCategory {
    return POSITION_CATEGORY_MAP[position.toUpperCase()] || 'MID';
}

/**
 * Builds a starting XI by matching players to formation slots based on position
 * Returns: [startingXI in correct order, remaining players for bench]
 */
export function buildLineup(
    apiPlayers: ApiPlayer[],
    isHome: boolean
): { startingXI: ApiPlayer[]; substitutes: ApiPlayer[] } {
    const formation = isHome ? FORMATION_442_HOME : FORMATION_442_AWAY;

    // Group players by category
    const playersByCategory: Record<PositionCategory, ApiPlayer[]> = {
        GK: [],
        DEF: [],
        MID: [],
        ATT: [],
    };

    apiPlayers.forEach(player => {
        const category = getPositionCategory(player.position);
        playersByCategory[category].push(player);
    });

    // Sort each category by overall rating (best first)
    Object.keys(playersByCategory).forEach(cat => {
        playersByCategory[cat as PositionCategory].sort((a, b) => b.overall - a.overall);
    });

    // Fill formation slots
    const startingXI: ApiPlayer[] = [];
    const usedPlayerIds = new Set<string>();

    formation.forEach(slot => {
        const candidates = playersByCategory[slot.category];
        const available = candidates.find(p => !usedPlayerIds.has(p.id));

        if (available) {
            startingXI.push(available);
            usedPlayerIds.add(available.id);
        } else {
            // Fallback: pick any unused player with best rating
            const fallback = apiPlayers.find(p => !usedPlayerIds.has(p.id));
            if (fallback) {
                startingXI.push(fallback);
                usedPlayerIds.add(fallback.id);
            }
        }
    });

    // Remaining players go to bench
    const substitutes = apiPlayers.filter(p => !usedPlayerIds.has(p.id));

    return { startingXI, substitutes };
}
