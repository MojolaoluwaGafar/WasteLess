import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Building blocks shared by every WasteLess email, in the app's colours
// (forest green, leaf, sprout and a warm cream). Email clients only render
// tables and inline styles reliably, so the layout is built from those, and
// the web fonts fall back to Georgia / Arial.

export const C = {
  forest: "#1F3D2B",
  leaf: "#3F7D4E",
  sprout: "#C9E265",
  cream: "#F7F5EE",
  wash: "#EEF3E4",
  white: "#FFFFFF",
  text: "#1B2A20",
  muted: "#5E6B61",
  hairline: "#E1E6DA",
  clay: "#C2562F",
};

export const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
export const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";

// Anything a person typed (names, messages, titles) goes into HTML, so escape it.
export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

// The web app's public URL (CLIENT_URL), without a trailing slash. A bare host
// gets https:// added.
export const clientUrl = () => {
  const url = process.env.CLIENT_URL?.trim().replace(/\/+$/, "");
  // Unset on the live Render service, which serves the Vercel site.
  if (!url) return "https://foodwastereduction.vercel.app";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

export const label = (text: string) =>
  `<div style="font:600 11px/16px ${SANS};letter-spacing:0.08em;text-transform:uppercase;color:${C.muted}">${text}</div>`;

export const button = (href: string, text: string) =>
  `<div style="margin-top:24px"><a href="${escapeHtml(href)}" style="display:inline-block;background:${C.forest};color:${C.white};font:600 15px/18px ${SANS};text-decoration:none;padding:14px 26px;border-radius:999px">${text}</a></div>`;

export const paragraph = (html: string) =>
  `<p style="margin:14px 0 0;font:400 15px/24px ${SANS};color:${C.text}">${html}</p>`;

export const quote = (heading: string, text: string) => `
  <div style="margin-top:18px;background:${C.wash};border-left:3px solid ${C.leaf};border-radius:0 12px 12px 0;padding:12px 16px">
    ${label(heading)}
    <div style="font:italic 500 16px/24px ${SERIF};color:${C.text};margin-top:4px">&ldquo;${escapeHtml(text)}&rdquo;</div>
  </div>`;

// The 4-digit pickup code, big and easy to read out.
export const codeBox = (code: string) => `
  <div style="margin-top:20px;background:${C.forest};border-radius:16px;padding:16px 20px;text-align:center">
    <div style="font:600 11px/16px ${SANS};letter-spacing:0.12em;text-transform:uppercase;color:${C.sprout}">Your pickup code</div>
    <div style="font:700 34px/42px 'Courier New',Courier,monospace;letter-spacing:0.3em;color:${C.white};margin-top:4px">${escapeHtml(code)}</div>
    <div style="font:400 13px/18px ${SANS};color:#D7E4D9;margin-top:4px">Show this to the donor when you collect.</div>
  </div>`;

export const detailRows = (rows: [string, string][]) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px">
    ${rows
      .map(
        ([name, value]) => `
      <tr>
        <td style="padding:6px 18px 6px 0;font:600 11px/18px ${SANS};letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};white-space:nowrap;vertical-align:top">${name}</td>
        <td style="padding:6px 0;font:400 15px/20px ${SANS};color:${C.text}">${value}</td>
      </tr>`,
      )
      .join("")}
  </table>`;

// The page around every email: a cream background, a white card with the
// heading, and a short footer. `preheader` is the grey preview line inboxes
// show after the subject.
export function emailLayout({ preheader, heading, body }: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${C.cream}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
            <tr>
              <td style="padding:0 4px 18px;font:700 22px/28px ${SERIF};color:${C.forest}">
                <span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${C.sprout};margin-right:8px;vertical-align:middle"></span>WasteLess
              </td>
            </tr>
            <tr>
              <td style="background:${C.white};border:1px solid ${C.hairline};border-radius:20px;padding:32px 28px">
                <h1 style="margin:0;font:600 26px/32px ${SERIF};color:${C.forest}">${heading}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 4px 0;font:400 12px/18px ${SANS};color:${C.muted}">
                You're getting this because you have a WasteLess account. Share surplus food, waste less.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
