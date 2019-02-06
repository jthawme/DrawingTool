import { getCubicBezier } from './JetPlotUtils.js';

export const COMMANDS = [
    'M', 'm', 
    'L', 'l', 
    'H', 'h', 
    'V', 'v', 
    'C', 'c', 
    'S', 's', 
    'Q', 'q', 
    'T', 't',
    'A', 'a',
    'Z', 'z'
];

const _fileCache = {};

class JetPlotSVG {
    _reset() {
        this._path = [];
        this._pos = {x: 0, y: 0};
        this._opposingControlPoint = false;
    }

    parse(filePath) {
        this._reset();
        
        return new Promise((resolve, reject) => {
            if (filePath in _fileCache) {
                resolve(_fileCache[filePath]);
            } else {
                const obj = document.createElement('object');
                obj.onload = () => {
                    const svgDoc = obj.getSVGDocument();
        
                    const children = svgDoc.querySelector('svg').children;
                    const shapes = [];
                    for (let i = 0; i < children.length; i++) {
                        shapes.push(this._parseEl(children[i]));
                    }
        
                    _fileCache[filePath] = shapes;
        
                    resolve(shapes);
                };
                obj.setAttribute('data', filePath);
                obj.setAttribute('type', 'image/svg+xml');
                obj.style.transform = 'scale(0)';
                obj.style.position = 'fixed';
                document.body.appendChild(obj);
            }
        });
    }

    _parseEl(el) {
        switch(el.tagName) {
            case 'path':
                return this._parsePath(el);
            default:
                console.log(el.tagName);
                return false;
        }
    }

    _parsePath(el) {
        const data = el.getAttribute('d');
        const indices = [];
        
        for (let i = 0; i < data.length; i++) {
            if (COMMANDS.indexOf(data[i]) >= 0) {
                indices.push(i);
            }
        }

        const commands = indices.map((i, index) => {
            let split;
            if (index === indices.length - 1) {
                split = data.slice(i, data.length);
            } else {
                split = data.slice(i, indices[index + 1]);
            }

            if (split.length === 1) {
                return [split];
            }

            return [
                split.substring(0, 1)
            ].concat(this._parseParams(split.substring(1)));
        });

        commands.forEach((c, index) => {
            switch(c[0]) {
                case 'M':
                case 'm':
                case 'L':
                case 'l':
                    this._move(c[0], {x: c[1], y: c[2]});
                    break;
                case 'V':
                case 'v':
                    this._move(c[0], {y:c[1]});
                    break;
                case 'H':
                case 'h':
                    this._move(c[0], {x: c[1]});
                    break;
                case 'C':
                case 'c':
                    this._cubicBezier(c[0], c.slice(1));
                    break;
                case 'S':
                case 's':
                    this._subCubicBezier(c[0], c.slice(1));
                    break;
                case 'Z':
                case 'z':
                    this._close(c[0]);
                    break;
                default:
                    console.log(c);
                    break;
            }
        });

        return this._path;
    }

    _move(c, coords) {
        let pos = Object.assign({}, this._pos);
        if (this._isUpper(c)) {
            if ('x' in coords) {
                pos.x = coords.x;
            }
            if ('y' in coords) {
                pos.y = coords.y;
            }
        } else {
            if ('x' in coords) {
                pos.x += coords.x;
            }
            if ('y' in coords) {
                pos.y += coords.y;
            }
        }

        this._pos = pos;
        this._path.push(pos);
    }

    _close(c) {
        this._pos = Object.assign({}, this._path[0]);
        this._path.push(this._pos);
    }

    _cubicBezier(c, [...args]) {
        const curr = args.slice(0, 6);

        if (curr.length === 6) {
            const nums = [
                Object.assign({}, this._pos),
                { x: args[0], y: args[1] },
                { x: args[2], y: args[3] },
                { x: args[4], y: args[5] }
            ];

            const mod = nums.map((n, index) => {
                let ret;

                if (this._isUpper(c)) {
                    ret = n;
                } else {
                    if (index === 0) {
                        ret = Object.assign({}, this._pos);
                    } else {
                        ret = {
                            x: this._pos.x + n.x,
                            y: this._pos.y + n.y,
                        };
                    }
                }

                return ret;
            });

            const path = getCubicBezier(
                mod[0].x, mod[0].y,
                mod[1].x, mod[1].y,
                mod[2].x, mod[2].y,
                mod[3].x, mod[3].y,
            );
            
            this._path = this._path.concat(path);

            this._pos = Object.assign({}, this._path[this._path.length - 1]);

            // This stores the reflected point for any subsequent calls
            this._opposingControlPoint = {
                x: (mod[3].x - mod[2].x),
                y: (mod[3].y - mod[2].y),
            };
            
            this._cubicBezier(c, args.slice(6));
        }
    }

    _subCubicBezier(c, [...args]) {
        const expLength = 4;
        const curr = args.slice(0, expLength);

        if (curr.length === expLength) {
            let _opposingX;
            let _opposingY;
            
            // This whole chunk works out the initial control point
            if (this._opposingControlPoint) {
                if (this._isUpper(c)) {
                    _opposingX = this._pos.x + this._opposingControlPoint.x;
                    _opposingY = this._pos.y + this._opposingControlPoint.y;
                } else {
                    _opposingX = this._opposingControlPoint.x;
                    _opposingY = this._opposingControlPoint.y;
                }
            } else {
                if (this._isUpper(c)) {
                    _opposingX = this._pos.x;
                    _opposingY = this._pos.y;
                } else {
                    _opposingX = 0;
                    _opposingY = 0;
                }
            }

            const lastPoint = {
                x: _opposingX,
                y: _opposingY,
            };

            this._cubicBezier(c, [lastPoint.x, lastPoint.y].concat(curr));
            this._subCubicBezier(c, args.slice(expLength));
        }
    }

    _parseParams(string) {
        const chars = [];
        for (let i = 0; i < string.length; i++) {
            if (string[i] === '-') {
                chars.push([' ', string[i]]);
            } else {
                chars.push(string[i]);
            }
        }

        return chars
            .flat() // Make all params same level
            .join('') // Join them all into a string
            .split(' ') // Split all spaces
            .filter(s => s.trim().length > 0) // Remove all empty strings
            .map(s => parseFloat(s)); // Turn into numbers
    }

    _isUpper(char) {
        return char === char.toUpperCase();
    }
}

export default JetPlotSVG;