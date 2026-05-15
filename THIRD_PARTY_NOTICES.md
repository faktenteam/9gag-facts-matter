# Third-Party Notices

This project is licensed under GPL-3.0-or-later. The extension also bundles the following third-party runtime assets so it can run without external CDN requests.

## Bundled runtime assets

| Library              | Bundled file               | Version / artifact identity                                                                                                                | License | Source                                                    | Notes                                                                                                  |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Cash.js (`cash-dom`) | `assets/js/cash.js`        | Vendored artifact without an embedded upstream version banner. SHA-256: `CB2F4D7A99BD21831CE31584BB7E81473B889F698AA682E1B1DAB96E361362F2` | MIT     | <https://github.com/fabiospampinato/cash>                 | Local DOM helper. No external requests. Latest package checked during documentation: `cash-dom@8.1.5`. |
| Pico CSS             | `assets/css/pico.jade.css` | `2.1.1`; SHA-256: `62E12CC57B1CC16ED9F47A0CA0F5B06CBBE1823972890F88E9AE380779E4F0D9`                                                       | MIT     | <https://github.com/picocss/pico> / <https://picocss.com> | Popup UI styling. The bundled file contains its upstream version/license banner.                       |

## Vendor maintenance rules

- Vendored files are intentionally committed to avoid runtime CDN dependencies.
- Do not reformat vendored files.
- Prefer official upstream release artifacts when refreshing vendored files.
- Preserve upstream license/version comments when present.
- Update this file whenever a vendored file changes, including version, source, license, and SHA-256 hash.

## Cash.js license notice

The MIT License (MIT)

Copyright (c) 2014-2020 Ken Wheeler, 2020-present Fabio Spampinato

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Pico CSS license notice

MIT License

Copyright (c) 2019-2024 Pico

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
