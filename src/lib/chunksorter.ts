export function matcher(matches: (string | RegExp)[]) {
    function indexOf(value: string): number {
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            if ((typeof match === 'string' && match === value) ||
                (match instanceof RegExp && match.test(value))) {
                return i
            }
        }
        return -1
    }

    return function matcherWrapper (a: string, b: string): number {
        return indexOf(a) - indexOf(b)
    }
}
