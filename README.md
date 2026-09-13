# greenflame website

The static website for [greenflame](https://github.com/greenflamehq/greenflame),
published with GitHub Pages at <https://getgreenflame.com>.

Edit `index.html` and `style.css`, then push to `main` to publish an update.
No build step is required. `greenflame.png` is the existing application logo.
The masthead uses the flame path from the application logo. `downloads.js`
refreshes the version and direct installer/portable links from the newest
published GitHub release (including pre-releases). The verified links in HTML
remain available without JavaScript or if the API fails; refresh that fallback
when updating the site. Run `node downloads.test.mjs` to check this behavior.
The green accent (`#78D600`) is sampled from that logo. The Jost regular and
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

The Bauhaus homepage is unchanged at `/`. The interactive **Afterimage**
experiment lives at `/afterimage/`, using native canvas and JavaScript modules
with no dependencies or build step. It captures only its own artwork, never
the visitor's screen. Fragments stay in the current page; only “keep it” saves
a PNG. Motion pauses when offscreen and starts paused for reduced-motion users.

Before publishing, run `node afterimage/afterimage.test.mjs`, preview both
pages at desktop and phone widths, and check the download, guide, and source
links. On Afterimage, check drag and button capture, keyboard capture (Enter
on the canvas), fragment dragging, arrow-key movement, turning, annotation,
PNG download, deletion, reset, pause/resume, and the six-fragment limit.
Test reduced motion and a touch device when available.
