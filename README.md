# greenflame website

The static website for [greenflame](https://github.com/greenflamehq/greenflame),
published with GitHub Pages at <https://getgreenflame.com>.

Edit `index.html` and `style.css`, then push to `main` to publish an update.
No build step is required. `greenflame.png` is the existing application logo.
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

Before publishing changes, preview the page at desktop and phone widths and
check the download, guide, and source links. The website has no JavaScript or
build dependencies.
