# JSON5 test vectors

These unchanged test inputs are from [json5-tests](https://github.com/json5/json5-tests/tree/ceb24d4080137d70833f86c25659c1331b80a387), pinned at commit `ceb24d4080137d70833f86c25659c1331b80a387`. They are MIT licensed; see [LICENSE.md](LICENSE.md).

`expected.json` contains committed outputs generated once with `json5@2.2.3` by parsing each must-accept input. Number values use tagged IEEE-754 bits to preserve `NaN`, infinities, and negative zero. The tests do not need a runtime reference-parser dependency.
