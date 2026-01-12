import React from 'react';
import { Rect, Line, Circle, Arc, Group } from 'react-konva';

interface PitchProps {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Memoized static pitch component - never re-renders during gameplay
export const Pitch = React.memo(({ x, y, width, height }: PitchProps) => {
    const lineColor = 'rgba(255, 255, 255, 0.5)';
    const lineWidth = 2;
    const pitchColor = '#1B4D3E'; // Deep slate-green base
    const lightStripe = '#1F5743'; // Lighter mown stripe
    const darkStripe = '#174537'; // Darker mown stripe

    // All measurements relative to pitch dimensions
    const penaltyAreaWidth = width * 0.165;
    const penaltyAreaHeight = height * 0.44;
    const goalAreaWidth = width * 0.055;
    const goalAreaHeight = height * 0.19;
    const centerCircleRadius = Math.min(width, height) * 0.1;
    const penaltySpotDistance = width * 0.11;
    const penaltyArcRadius = Math.min(width, height) * 0.1;
    const cornerArcRadius = Math.min(width, height) * 0.02;

    // Grass stripe width
    const stripeCount = 12;
    const stripeWidth = width / stripeCount;

    return (
        <Group x={x} y={y}>
            {/* Base pitch color */}
            <Rect
                width={width}
                height={height}
                fill={pitchColor}
                cornerRadius={4}
            />

            {/* Mown grass stripes (alternating light/dark) */}
            {Array.from({ length: stripeCount }).map((_, i) => (
                <Rect
                    key={`stripe-${i}`}
                    x={i * stripeWidth}
                    y={0}
                    width={stripeWidth}
                    height={height}
                    fill={i % 2 === 0 ? lightStripe : darkStripe}
                    opacity={0.6}
                    listening={false}
                />
            ))}

            {/* Outer boundary */}
            <Rect
                width={width}
                height={height}
                stroke={lineColor}
                strokeWidth={lineWidth}
                cornerRadius={4}
            />

            {/* Center line (vertical) */}
            <Line
                points={[width / 2, 0, width / 2, height]}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Center circle */}
            <Circle
                x={width / 2}
                y={height / 2}
                radius={centerCircleRadius}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Center spot */}
            <Circle
                x={width / 2}
                y={height / 2}
                radius={4}
                fill={lineColor}
            />

            {/* Left penalty area */}
            <Rect
                x={0}
                y={(height - penaltyAreaHeight) / 2}
                width={penaltyAreaWidth}
                height={penaltyAreaHeight}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Left goal area */}
            <Rect
                x={0}
                y={(height - goalAreaHeight) / 2}
                width={goalAreaWidth}
                height={goalAreaHeight}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Left penalty spot */}
            <Circle
                x={penaltySpotDistance}
                y={height / 2}
                radius={3}
                fill={lineColor}
            />

            {/* Left penalty arc */}
            <Arc
                x={penaltySpotDistance}
                y={height / 2}
                innerRadius={penaltyArcRadius}
                outerRadius={penaltyArcRadius}
                angle={106}
                rotation={-53}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Right penalty area */}
            <Rect
                x={width - penaltyAreaWidth}
                y={(height - penaltyAreaHeight) / 2}
                width={penaltyAreaWidth}
                height={penaltyAreaHeight}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Right goal area */}
            <Rect
                x={width - goalAreaWidth}
                y={(height - goalAreaHeight) / 2}
                width={goalAreaWidth}
                height={goalAreaHeight}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Right penalty spot */}
            <Circle
                x={width - penaltySpotDistance}
                y={height / 2}
                radius={3}
                fill={lineColor}
            />

            {/* Right penalty arc */}
            <Arc
                x={width - penaltySpotDistance}
                y={height / 2}
                innerRadius={penaltyArcRadius}
                outerRadius={penaltyArcRadius}
                angle={106}
                rotation={127}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />

            {/* Corner arcs */}
            <Arc
                x={0}
                y={0}
                innerRadius={cornerArcRadius}
                outerRadius={cornerArcRadius}
                angle={90}
                rotation={0}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />
            <Arc
                x={width}
                y={0}
                innerRadius={cornerArcRadius}
                outerRadius={cornerArcRadius}
                angle={90}
                rotation={90}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />
            <Arc
                x={0}
                y={height}
                innerRadius={cornerArcRadius}
                outerRadius={cornerArcRadius}
                angle={90}
                rotation={-90}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />
            <Arc
                x={width}
                y={height}
                innerRadius={cornerArcRadius}
                outerRadius={cornerArcRadius}
                angle={90}
                rotation={180}
                stroke={lineColor}
                strokeWidth={lineWidth}
            />
        </Group>
    );
});

Pitch.displayName = 'Pitch';
