import React, { useCallback, useRef } from 'react';
import { Group, Circle, Text, Arc } from 'react-konva';
import { useTacticalStore } from '../store/useTacticalStore';
import type { Player as PlayerType } from '../store/useTacticalStore';
import type Konva from 'konva';

interface PlayerProps {
    player: PlayerType;
}

const TEAM_COLORS = {
    home: '#457B9D', // Steel Blue (Chelsea)
    away: '#E63946', // Crimson (Arsenal)
};

// Get stamina ring color based on value (25% each: light green > orange > yellow > red)
const getStaminaColor = (stamina: number): string => {
    if (stamina > 75) return '#10b981'; // Light Green (100-75%)
    if (stamina > 50) return '#f97316'; // Orange (75-50%)
    if (stamina > 25) return '#eab308'; // Yellow (50-25%)
    return '#ef4444'; // Red (25-0%)
};

export const Player = React.memo(({ player }: PlayerProps) => {
    const groupRef = useRef<Konva.Group>(null);

    const activeTool = useTacticalStore((state) => state.activeTool);
    const selectedPlayerId = useTacticalStore((state) => state.selectedPlayerId);
    const updatePlayerPosition = useTacticalStore((state) => state.updatePlayerPosition);
    const selectPlayer = useTacticalStore((state) => state.selectPlayer);

    const isSelected = selectedPlayerId === player.id;
    const isDraggable = activeTool === 'select';

    // Stamina ring calculation
    const playerRadius = 20;
    const ringRadius = playerRadius + 4; // Ring sits just outside player circle
    const ringStrokeWidth = 3;
    const staminaAngle = (player.stamina / 100) * 360; // Convert to degrees
    const staminaColor = getStaminaColor(player.stamina);

    const handleDragStart = useCallback(() => {
        selectPlayer(player.id);
    }, [player.id, selectPlayer]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        updatePlayerPosition(player.id, node.x(), node.y());
    }, [player.id, updatePlayerPosition]);

    const handleClick = useCallback(() => {
        if (activeTool === 'select') {
            selectPlayer(player.id);
        }
    }, [activeTool, player.id, selectPlayer]);

    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
    }, []);

    const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
        e.cancelBubble = true;
    }, []);

    return (
        <Group
            ref={groupRef}
            x={Math.round(player.x)}
            y={Math.round(player.y)}
            visible={!player.isOnBench}
            draggable={isDraggable && !player.isOnBench}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            onTap={handleClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Stamina ring background (gray track) */}
            <Circle
                radius={ringRadius}
                stroke="rgba(50, 50, 50, 0.6)"
                strokeWidth={ringStrokeWidth}
                listening={false}
            />

            {/* Stamina ring fill (colored arc that depletes) */}
            {player.stamina > 0 && (
                <Arc
                    innerRadius={ringRadius - ringStrokeWidth / 2}
                    outerRadius={ringRadius + ringStrokeWidth / 2}
                    angle={staminaAngle}
                    rotation={-90} // Start from top
                    fill={staminaColor}
                    shadowColor={staminaColor}
                    shadowBlur={4}
                    shadowOpacity={0.5}
                    listening={false}
                />
            )}

            {/* Selection ring */}
            {isSelected && (
                <Circle
                    radius={ringRadius + 5}
                    stroke="#facc15"
                    strokeWidth={2}
                    dash={[5, 3]}
                    shadowForStrokeEnabled={false}
                />
            )}

            {/* Player circle */}
            <Circle
                radius={playerRadius}
                fill={TEAM_COLORS[player.team]}
                stroke="#ffffff"
                strokeWidth={2}
            />

            {/* Jersey number */}
            <Text
                text={String(player.number)}
                fontSize={14}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#ffffff"
                align="center"
                verticalAlign="middle"
                offsetX={player.number >= 10 ? 8 : 4}
                offsetY={7}
            />

            {/* Player name below icon */}
            <Text
                text={player.name}
                y={32}
                fontSize={12}
                fontFamily="Arial"
                fill="#ffffff"
                shadowColor="#000000"
                shadowBlur={2}
                shadowOpacity={0.9}
                align="center"
                offsetX={player.name.length * 3.2}
            />

            {/* Stamina percentage text (right of icon) */}
            <Text
                text={String(player.stamina)}
                x={ringRadius + 8}
                y={-6}
                fontSize={11}
                fontFamily="Arial"
                fontStyle="bold"
                fill={staminaColor}
                shadowColor="#000000"
                shadowBlur={3}
                shadowOpacity={0.8}
            />
        </Group>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.player.id === nextProps.player.id &&
        prevProps.player.x === nextProps.player.x &&
        prevProps.player.y === nextProps.player.y &&
        prevProps.player.number === nextProps.player.number &&
        prevProps.player.name === nextProps.player.name &&
        prevProps.player.team === nextProps.player.team &&
        prevProps.player.isOnBench === nextProps.player.isOnBench &&
        prevProps.player.stamina === nextProps.player.stamina
    );
});

Player.displayName = 'Player';
