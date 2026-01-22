import React, { useEffect, useRef } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

export const StarryBackground = React.memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width, height } = useWindowSize();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions
        canvas.width = width;
        canvas.height = height;

        // Configuration
        const starCount = Math.floor((width * height) / 3000); // 1 star per 3000px²
        const baseColor = '255, 255, 255'; // RGB for stars

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw stars
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 1.5; // Size variation 0-1.5px
            const opacity = Math.random() * 0.5 + 0.1; // Opacity 0.1-0.6

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${baseColor}, ${opacity})`;
            ctx.fill();
        }

    }, [width, height]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }} // Behind everything else content-wise, but we manage stacking in App.tsx
        />
    );
});

StarryBackground.displayName = 'StarryBackground';
