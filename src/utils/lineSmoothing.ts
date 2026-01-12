/**
 * Line Smoothing Utilities
 * 
 * Implements Ramer-Douglas-Peucker simplification + Catmull-Rom spline interpolation
 * for smooth Bezier-like curve fitting on freehand drawings.
 */

/**
 * Ramer-Douglas-Peucker algorithm for point reduction
 * Reduces the number of points while maintaining the overall shape
 */
function perpendicularDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
): number {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

function rdpSimplify(points: number[], epsilon: number): number[] {
    if (points.length < 6) return points; // Need at least 3 points (6 values)

    let maxDist = 0;
    let maxIndex = 0;

    const startX = points[0];
    const startY = points[1];
    const endX = points[points.length - 2];
    const endY = points[points.length - 1];

    // Find the point with maximum distance from the line
    for (let i = 2; i < points.length - 2; i += 2) {
        const dist = perpendicularDistance(
            points[i], points[i + 1],
            startX, startY,
            endX, endY
        );
        if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
        }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDist > epsilon) {
        const left = rdpSimplify(points.slice(0, maxIndex + 2), epsilon);
        const right = rdpSimplify(points.slice(maxIndex), epsilon);

        // Combine results (remove duplicate point at junction)
        return [...left.slice(0, -2), ...right];
    }

    // Return start and end points only
    return [startX, startY, endX, endY];
}

/**
 * Catmull-Rom spline interpolation
 * Creates smooth curves through control points
 */
function catmullRomSpline(points: number[], segments: number = 10): number[] {
    if (points.length < 8) return points; // Need at least 4 points (8 values)

    const result: number[] = [];
    const numPoints = points.length / 2;

    for (let i = 0; i < numPoints - 1; i++) {
        // Get 4 control points (with clamping at edges)
        const p0x = points[Math.max(0, i - 1) * 2];
        const p0y = points[Math.max(0, i - 1) * 2 + 1];
        const p1x = points[i * 2];
        const p1y = points[i * 2 + 1];
        const p2x = points[Math.min(numPoints - 1, i + 1) * 2];
        const p2y = points[Math.min(numPoints - 1, i + 1) * 2 + 1];
        const p3x = points[Math.min(numPoints - 1, i + 2) * 2];
        const p3y = points[Math.min(numPoints - 1, i + 2) * 2 + 1];

        // Generate interpolated points
        for (let t = 0; t < segments; t++) {
            const tt = t / segments;
            const tt2 = tt * tt;
            const tt3 = tt2 * tt;

            // Catmull-Rom basis functions
            const b0 = 0.5 * (-tt3 + 2 * tt2 - tt);
            const b1 = 0.5 * (3 * tt3 - 5 * tt2 + 2);
            const b2 = 0.5 * (-3 * tt3 + 4 * tt2 + tt);
            const b3 = 0.5 * (tt3 - tt2);

            const x = b0 * p0x + b1 * p1x + b2 * p2x + b3 * p3x;
            const y = b0 * p0y + b1 * p1y + b2 * p2y + b3 * p3y;

            result.push(x, y);
        }
    }

    // Add the final point
    result.push(points[points.length - 2], points[points.length - 1]);

    return result;
}

/**
 * Main smoothing function
 * Applies RDP simplification followed by Catmull-Rom interpolation
 */
export function smoothLine(rawPoints: number[], options?: {
    simplifyEpsilon?: number;  // Higher = more aggressive simplification (default: 3)
    splineSegments?: number;   // Segments per control point (default: 8)
}): number[] {
    const { simplifyEpsilon = 3, splineSegments = 8 } = options || {};

    if (rawPoints.length < 6) return rawPoints;

    // Step 1: Simplify the raw points to reduce noise
    const simplified = rdpSimplify(rawPoints, simplifyEpsilon);

    // Step 2: If we have enough points, apply spline interpolation
    if (simplified.length >= 8) {
        return catmullRomSpline(simplified, splineSegments);
    }

    return simplified;
}
