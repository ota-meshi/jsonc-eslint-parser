const path = {
    sep: "/",
}
module.exports = new Proxy(path, {
    get(_t, p) {
        if (!path[p]) {
            console.log(p)
        }
        return path[p]
    },
})
