export const sep = "/";

export default new Proxy(
    { sep },
    {
        get(_t, p) {
            if (p === "default") return _t;
            if (!_t[p]) {
                // eslint-disable-next-line no-console -- Log the missing path methods for debugging purposes.
                console.log(p);
            }
            return _t[p];
        },
    },
);
