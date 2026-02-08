// API service for team data fetching

export interface ApiPlayer {
    name: string;
    kit_number: number;
    position: string;
    team: string;
    overall: number;
    image: string;
    // Generate a unique ID from name since new API doesn't provide one
    id?: string;
}

const API_BASE_URL = 'http://localhost:3000';

/**
 * Fetch list of all team names for autocomplete (Big 5 leagues only)
 */
export async function fetchTeamsList(): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/teams-list`);

        if (!response.ok) {
            console.error('Failed to fetch teams list:', response.statusText);
            return [];
        }

        const data = await response.json();

        // Ensure we have an array
        if (!Array.isArray(data)) {
            console.error('Teams list is not an array:', data);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Error fetching teams list:', error);
        return [];
    }
}

/**
 * Fetch squad for a specific team
 */
export async function fetchTeamSquad(teamName: string): Promise<ApiPlayer[]> {
    const response = await fetch(`${API_BASE_URL}/api/team?name=${encodeURIComponent(teamName)}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch team: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
        throw new Error(data.error || 'Invalid response from server');
    }

    if (data.length === 0) {
        throw new Error(`No players found for team "${teamName}"`);
    }

    // Add unique IDs to players
    return data.map((player: ApiPlayer, index: number) => ({
        ...player,
        id: `${player.name.replace(/\s+/g, '-')}-${index}`,
    }));
}
