export const getArc = (cx, cy, radius, angle, segments = 50, startingAngle = 0) => {
    const angleSegment = angle / segments;
    const angleOffset = startingAngle ? (Math.PI * 2) * ((startingAngle % 360) / 360) : 0;
    const path = [];
    
    for (let i = 0; i <= segments; i++) {
        const x = cx + (Math.cos(angleOffset + (angleSegment * i)) * radius);
        const y = cy + (Math.sin(angleOffset + (angleSegment * i)) * radius);

        path.push({ x, y });
    }

    return path;
}

export const getRect = (tlx, tly, width, height) => {
    const path = [
        { x: tlx, y: tly },
        { x: tlx + width, y: tly },
        { x: tlx + width, y: tly + height },
        { x: tlx, y: tly + height },
    ];

    path.push({ x: path[0].x, y: path[0].y });

    return path;
};

export const getCubicBezier = (p1x, p1y, cp1x, cp1y, cp2x, cp2y, p2x, p2y, segments = 50) => {
    const angleSegment = 1 / segments;

    const path = [];
    for (let i = 1; i < segments; i++) {
        const t = angleSegment * i;
        
        const { x, y } = getPointOnCubicBezier(
            t,
            { x: p1x, y: p1y },
            { x: cp1x, y: cp1y },
            { x: cp2x, y: cp2y },
            { x: p2x, y: p2y },
        );

        path.push({ x, y });
    }
    
    path.push({ x: p2x, y: p2y });

    return path;
};

export const getPointOnCubicBezier = (t, p0, p1, p2, p3) => {
    const ret = {};
    const coords = ['x', 'y'];

    coords.forEach(k => {
        ret[k] = Math.pow(1 - t, 3) * p0[k] + 3 * Math.pow(1 - t, 2) * t * p1[k] + 3 * (1 - t) * Math.pow(t, 2) * p2[k] + Math.pow(t, 3) * p3[k];
    });

    return ret;
}

export const getQuadraticBezier = (p1x, p1y, cp1x, cp1y, p2x, p2y, segments = 50) => {
    const angleSegment = 1 / segments;
    const path = [];
        
    for (let i = 1; i < segments; i++) {
        const t = angleSegment * i;
        
        const { x, y } = getPointOnQuadraticBezier(
            t,
            { x: p1x, y: p1y },
            { x: cp1x, y: cp1y },
            { x: p2x, y: p2y },
        );

        path.push({x, y});
    }

    path.push({ x: p2x, y: p2y });
    return path;
};

export const getPointonQuadraticBezier = (t, p0, p1, p2) => {
    let invT = 1 - t;
    return {
        x: invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x,
        y: invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y
    };
};