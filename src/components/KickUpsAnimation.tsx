import React, { useRef, useEffect } from 'react';
import { Group, Circle, RegularPolygon } from 'react-konva';
import Konva from 'konva';

interface KickUpsAnimationProps {
    x: number;
    y: number;
}

export const KickUpsAnimation = React.memo(({ x, y }: KickUpsAnimationProps) => {
    const ballRef = useRef<Konva.Group>(null);
    const animRef = useRef<Konva.Animation | null>(null);

    useEffect(() => {
        if (!ballRef.current) return;

        const ball = ballRef.current;
        let time = 0;

        // Create bouncing animation
        animRef.current = new Konva.Animation((frame) => {
            if (!frame) return;
            time += frame.timeDiff / 1000;

            // Bouncing motion (sine wave for smooth up/down)
            const bounceHeight = 15;
            const bounceSpeed = 3; // bounces per second
            const yOffset = Math.abs(Math.sin(time * bounceSpeed * Math.PI)) * bounceHeight;

            // Slight rotation for realism
            const rotation = Math.sin(time * 2) * 15;

            ball.y(-yOffset);
            ball.rotation(rotation);
        }, ball.getLayer());

        animRef.current.start();

        return () => {
            if (animRef.current) {
                animRef.current.stop();
            }
        };
    }, []);

    return (
        <Group x={x} y={y}>
            {/* Ball group (animated) */}
            <Group ref={ballRef}>
                {/* Ball shadow */}
                <Circle
                    x={1}
                    y={2}
                    radius={6}
                    fill="rgba(0, 0, 0, 0.2)"
                    listening={false}
                />

                {/* Ball base - white */}
                <Circle
                    radius={6}
                    fill="#ffffff"
                    stroke="#333333"
                    strokeWidth={0.5}
                    listening={false}
                />

                {/* Pentagon pattern - center */}
                <RegularPolygon
                    sides={5}
                    radius={3}
                    fill="#1a1a1a"
                    rotation={-18}
                    listening={false}
                />

                {/* Small dots around */}
                {[0, 72, 144, 216, 288].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const dotX = Math.cos(rad) * 4.5;
                    const dotY = Math.sin(rad) * 4.5;
                    return (
                        <Circle
                            key={i}
                            x={dotX}
                            y={dotY}
                            radius={1}
                            fill="#1a1a1a"
                            listening={false}
                        />
                    );
                })}
            </Group>
        </Group>
    );
});

KickUpsAnimation.displayName = 'KickUpsAnimation';
