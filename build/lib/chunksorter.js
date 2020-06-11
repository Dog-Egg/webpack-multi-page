"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matcher = void 0;
function matcher(matches) {
    function indexOf(value) {
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            if ((typeof match === 'string' && match === value) ||
                (match instanceof RegExp && match.test(value))) {
                return i;
            }
        }
        return -1;
    }
    return function matcherWrapper(a, b) {
        return indexOf(a) - indexOf(b);
    };
}
exports.matcher = matcher;
