export class PatternMatcher {
    public constructor(pattern: RegExp, options?: { escaped?: boolean })

    public execAll(str: string): IterableIterator<RegExpExecArray>

    public test(str: string): boolean

    public [Symbol.replace](
        str: string,
        replacer: string | ((...ss: string[]) => string),
    ): string
}
