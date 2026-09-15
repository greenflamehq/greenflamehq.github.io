# greenflame website

The static website for [greenflame](https://github.com/greenflamehq/greenflame),
published with GitHub Pages at <https://getgreenflame.com>.

The user guide lives in `guide.html` and shares `style.css` with the homepage;
`guide.css` contains the reference-page layout. It adapts the former guide without
its unfinished screenshot placeholders. Check behavior against the application's
README and annotation schema when updating it. Run `node guide.test.mjs` and
preview the contents navigation, tables, and code examples at desktop and phone
widths before publishing. The guide needs no JavaScript.

Edit `index.html` and `style.css`, then push to `main` to publish an update.
No build step is required. `greenflame.png` is the existing application logo.
The masthead uses the flame path from the application logo. `downloads.js`
refreshes the version and direct installer/portable links from the newest
published GitHub release (including pre-releases). The verified links in HTML
remain available without JavaScript or if the API fails; refresh that fallback
when updating the site. Run `node downloads.test.mjs` to check this behavior.
The approved brand accent is `#77ca00`. The Jost regular and
bold fonts are self-hosted; their license is in `OFL-Jost.txt`.

GitHub Pages serves the root of `main`. The custom domain is configured in the
repository's Pages settings. Rebel manages the domain and its DNS.

Keep `CNAME` set to `getgreenflame.com`. The Rebel DNS configuration is:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | greenflamehq.github.io |

The GitHub domain-verification TXT record must also remain in place. GitHub
manages the HTTPS certificate; no separate certificate purchase is needed.

Design studies, icon explorations, and the Afterimage experiment are preserved on the `codex/design-studies` branch. They are not deployed from `main`.
