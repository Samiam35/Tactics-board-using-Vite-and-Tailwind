import React, { useCallback } from 'react';
import { Group, Circle, RegularPolygon } from 'react-konva';
import { useTacticalStore } from '../store/useTacticalStore';
import type Konva from 'konva';

export const Ball = React.memo(() => {
    const ball = useTacticalStore((state) => state.ball);
    const activeTool = useTacticalStore((state) => state.activeTool);
    const updateBallPosition = useTacticalStore((state) => state.updateBallPosition);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        updateBallPosition(node.x(), node.y());
    }, [updateBallPosition]);

    const isDraggable = activeTool === 'select';

    return (
        <Group
            x={ball.x}
            y={ball.y}
            draggable={isDraggable}
            onDragEnd={handleDragEnd}
        >
            {/* Shadow */}
            <Circle
                x={2}
                y={2}
                radius={8}
                fill="rgba(0, 0, 0, 0.3)"
                perfectDrawEnabled={false}
                listening={false}
            />

            {/* Ball base - white */}
            <Circle
                radius={8}
                fill="#ffffff"
                stroke="#333333"
                strokeWidth={1}
                shadowColor="#ffffff"
                shadowBlur={6}
                shadowOpacity={0.5}
                perfectDrawEnabled={false}
            />

            {/* Pentagon pattern - center */}
            <RegularPolygon
                sides={5}
                radius={4}
                fill="#1a1a1a"
                rotation={-18}
                perfectDrawEnabled={false}
                listening={false}
            />

            {/* Small hexagon details around */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 6;
                const y = Math.sin(rad) * 6;
                return (
                    <Circle
                        key={i}
                        x={x}
                        y={y}
                        radius={1.5}
                        fill="#1a1a1a"
                        perfectDrawEnabled={false}
                        listening={false}
                    />
                );
            })}
        </Group>
    );
});

Ball.displayName = 'Ball';
