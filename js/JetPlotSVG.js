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

class JetPlotSVG {
    parse(filePath) {
        let res;
        const p = new Promise((resolve, reject) => {
            res = resolve;
        });

        const obj = document.createElement('object');
        obj.onload = () => {
            const svgDoc = obj.getSVGDocument();

            const children = svgDoc.querySelector('svg').children;
            const shapes = [];
            for (let i = 0; i < children.length; i++) {
                shapes.push(this._parseEl(children[i]));
            }

            res(shapes);
        };
        obj.setAttribute('data', filePath);
        obj.setAttribute('type', 'image/svg+xml');
        obj.style.transform = 'scale(0)';
        obj.style.position = 'fixed';
        document.body.appendChild(obj);

        return p;
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

        return commands;
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
            .map(s => parseInt(s, 10)); // Turn into numbers
    }
}

export default JetPlotSVG;