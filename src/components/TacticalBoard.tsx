import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';
import { useWindowSize } from '../hooks/useWindowSize';
import { useTacticalStore } from '../store/useTacticalStore';
import { smoothLine } from '../utils/lineSmoothing';
import { Pitch } from './Pitch';
import { Player } from './Player';
import { Ball } from './Ball';
import { KickUpsAnimation } from './KickUpsAnimation';
import type Konva from 'konva';

const PITCH_ASPECT_RATIO = 1.5;
const PITCH_MARGIN = 20;

export const TacticalBoard = () => {
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const ghostLineRef = useRef<Konva.Line>(null);
    const isInitialized = useRef(false);
    const isDrawing = useRef(false);
    const currentPointsRef = useRef<number[]>([]);

    // Eraser cursor position
    const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

    // Store subscriptions
    const players = useTacticalStore((state) => state.players);
    const lines = useTacticalStore((state) => state.lines);
    const activeTool = useTacticalStore((state) => state.activeTool);
    const penColor = useTacticalStore((state) => state.penColor);
    const eraserSize = useTacticalStore((state) => state.eraserSize);
    const initializePlayers = useTacticalStore((state) => state.initializePlayers);
    const addLine = useTacticalStore((state) => state.addLine);
    const selectPlayer = useTacticalStore((state) => state.selectPlayer);
    const eraseLine = useTacticalStore((state) => state.eraseLine);
    const undoLastLine = useTacticalStore((state) => state.undoLastLine);
    const redoLine = useTacticalStore((state) => state.redoLine);

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redoLine();
                } else {
                    undoLastLine();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redoLine();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undoLastLine, redoLine]);

    // Calculate scaled pitch dimensions
    const pitchDimensions = useMemo(() => {
        const availableWidth = windowWidth - PITCH_MARGIN * 2;
        const availableHeight = windowHeight - PITCH_MARGIN * 2;

        let pitchWidth: number;
        let pitchHeight: number;

        if (availableWidth / PITCH_ASPECT_RATIO <= availableHeight) {
            pitchWidth = availableWidth;
            pitchHeight = pitchWidth / PITCH_ASPECT_RATIO;
        } else {
            pitchHeight = availableHeight;
            pitchWidth = pitchHeight * PITCH_ASPECT_RATIO;
        }

        const offsetX = (windowWidth - pitchWidth) / 2;
        const offsetY = (windowHeight - pitchHeight) / 2;

        return { pitchWidth, pitchHeight, offsetX, offsetY };
    }, [windowWidth, windowHeight]);

    // Sync pitch dimensions to store
    const setPitchDimensions = useTacticalStore((state) => state.setPitchDimensions);

    useEffect(() => {
        if (pitchDimensions.pitchWidth > 0) {
            setPitchDimensions(pitchDimensions);
        }
    }, [pitchDimensions, setPitchDimensions]);

    // Initialize players
    useEffect(() => {
        if (!isInitialized.current && pitchDimensions.pitchWidth > 0) {
            initializePlayers(
                pitchDimensions.pitchWidth,
                pitchDimensions.pitchHeight,
                pitchDimensions.offsetX,
                pitchDimensions.offsetY
            );
            isInitialized.current = true;
        }
    }, [pitchDimensions, initializePlayers]);

    // Mouse handlers
    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) {
            selectPlayer(null);
        }

        if (activeTool !== 'pen') return;

        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;

        isDrawing.current = true;
        currentPointsRef.current = [pos.x, pos.y];

        if (ghostLineRef.current) {
            ghostLineRef.current.points([pos.x, pos.y]);
            ghostLineRef.current.stroke(penColor);
            ghostLineRef.current.shadowColor(penColor);
            ghostLineRef.current.visible(true);
        }
    }, [activeTool, penColor, selectPlayer]);

    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Update eraser cursor position
        if (activeTool === 'eraser') {
            setEraserPos({ x: pos.x, y: pos.y });
        } else {
            setEraserPos(null);
        }

        // Drawing logic
        if (!isDrawing.current || activeTool !== 'pen') return;

        currentPointsRef.current.push(pos.x, pos.y);

        if (ghostLineRef.current && layerRef.current) {
            ghostLineRef.current.points(currentPointsRef.current);
            layerRef.current.batchDraw();
        }
    }, [activeTool]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing.current) return;
        isDrawing.current = false;

        if (currentPointsRef.current.length >= 4) {
            const lineId = `line-${Date.now()}`;
            // Apply smoothing algorithm on mouse release
            const smoothedPoints = smoothLine(currentPointsRef.current, {
                simplifyEpsilon: 3,  // Reduce noise while keeping shape
                splineSegments: 8,   // Smooth interpolation
            });
            addLine(lineId, smoothedPoints, penColor);
        }

        currentPointsRef.current = [];
        if (ghostLineRef.current) {
            ghostLineRef.current.points([]);
            ghostLineRef.current.visible(false);
        }
    }, [addLine, penColor]);

    // Eraser click handler
    const handleLineClick = useCallback((lineId: string) => {
        if (activeTool === 'eraser') {
            eraseLine(lineId);
        }
    }, [activeTool, eraseLine]);

    const handleMouseLeave = useCallback(() => {
        handleMouseUp();
        setEraserPos(null);
    }, [handleMouseUp]);

    const { pitchWidth, pitchHeight, offsetX, offsetY } = pitchDimensions;

    return (
        <Stage
            ref={stageRef}
            width={windowWidth}
            height={windowHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: activeTool === 'eraser' ? 'none' : activeTool === 'pen' ? 'crosshair' : 'default' }}
        >
            {/* Layer 1: Static Pitch */}
            <Layer id="static-pitch" listening={false}>
                <Pitch x={offsetX} y={offsetY} width={pitchWidth} height={pitchHeight} />
            </Layer>

            {/* Layer 2: Dynamic Gameplay */}
            <Layer id="dynamic-gameplay" ref={layerRef}>
                {/* Committed Lines with Neon Glow */}
                {lines.map((line) => (
                    <Line
                        key={line.id}
                        points={line.points}
                        stroke={line.color}
                        strokeWidth={3}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.5}
                        shadowColor={line.color}
                        shadowBlur={8}
                        shadowOpacity={0.8}
                        perfectDrawEnabled={false}
                        hitStrokeWidth={activeTool === 'eraser' ? eraserSize : 0}
                        listening={activeTool === 'eraser'}
                        onClick={() => handleLineClick(line.id)}
                        onTap={() => handleLineClick(line.id)}
                    />
                ))}

                {/* Ghost Line with Neon Glow */}
                <Line
                    ref={ghostLineRef}
                    points={[]}
                    stroke={penColor}
                    strokeWidth={3}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                    shadowColor={penColor}
                    shadowBlur={8}
                    shadowOpacity={0.8}
                    perfectDrawEnabled={false}
                    hitStrokeWidth={0}
                    listening={false}
                    visible={false}
                />

                {/* Eraser Cursor Circle */}
                {activeTool === 'eraser' && eraserPos && (
                    <Circle
                        x={eraserPos.x}
                        y={eraserPos.y}
                        radius={eraserSize / 2}
                        stroke="rgba(255, 255, 255, 0.8)"
                        strokeWidth={2}
                        fill="rgba(255, 255, 255, 0.1)"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                )}

                {/* Players */}
                {players.map((player) => (
                    <Player key={player.id} player={player} />
                ))}

                {/* Ball - on top of players */}
                <Ball />

                {/* Kick-ups animation in bottom left */}
                <KickUpsAnimation x={50} y={windowHeight - 50} />
            </Layer>
        </Stage>
    );
};
