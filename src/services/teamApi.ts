// API service for team data fetching

export interface ApiPlayer {
    id: string;
    name: string;
    position: string;
    team: string;
    league: string;
    overall: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    image: string;
}

export interface TeamResponse {
    team: string;
    count: number;
    players: ApiPlayer[];
}

const API_BASE_URL = 'http://localhost:3000';

export async function fetchTeamSquad(teamName: string): Promise<TeamResponse> {
    const response = await fetch(`${API_BASE_URL}/api/team?name=${encodeURIComponent(teamName)}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch team: ${response.statusText}`);
    }

    const data: TeamResponse = await response.json();

    if (data.count === 0) {
        throw new Error(`No players found for team "${teamName}"`);
    }

    return data;
}
