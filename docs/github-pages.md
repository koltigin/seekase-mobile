# Seekase website and GitHub Pages

The publishable static website lives in the separate `Seekase-Site` sibling repository. It contains no application source, credentials, wallet data, Supabase keys or build-time dependency. Its own GitHub Pages workflow uploads that repository only.

## Repository choice

The Seekase application repository remains private.

- GitHub Pages from a private repository requires GitHub Pro, Team or Enterprise.
- With GitHub Free, publish the separate website repository that contains only the website files and the Pages workflow. Do not make the mobile application repository public merely to obtain free Pages hosting.
- A GitHub Pages website is publicly accessible even when its source repository is private and the plan supports private-repository Pages.

## Before DNS changes

1. Buy and verify control of `seekase.app`.
2. In the selected website repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. Add `seekase.app` as the custom domain in GitHub before pointing DNS. This reduces domain-takeover risk.
4. Confirm that the Pages deployment succeeds at its temporary `github.io` address.

## DNS for the apex domain

Create four `A` records for `@`:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Create a `CNAME` record for `www` pointing directly to the account's `<owner>.github.io` hostname. Do not include the repository name. Do not use wildcard DNS records.

DNS changes may take up to 24 hours. After GitHub validates the domain and provisions the certificate, enable **Enforce HTTPS**. The public site, support route and legal URLs are:

- `https://seekase.app/`
- `https://seekase.app/support/`
- `https://seekase.app/privacy/`
- `https://seekase.app/terms/`
- `https://seekase.app/community/`
- `https://seekase.app/account-deletion/`

## Release blockers

- Replace the draft operator/contact placeholders with a working, monitored support channel.
- Obtain appropriate legal review of Privacy Policy and Terms of Use.
- Add final product screenshots and store/download links only after the release build exists.
- Run a broken-link and mobile-layout check on the deployed HTTPS site.

Official references: [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), and [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
