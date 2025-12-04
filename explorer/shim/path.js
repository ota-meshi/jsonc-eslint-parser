const path = {
  sep: "/",
};
module.exports = new Proxy(path, {
  get(_t, p) {
    if (!path[p]) {
      // eslint-disable-next-line no-console -- Log the missing path methods for debugging purposes.
      console.log(p);
    }
    return path[p];
  },
});
