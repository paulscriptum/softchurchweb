import 'server-only';
import { SITE_URL } from '@/config/site';

// Letters keep the site's voice: lowercase, quiet, nothing else.

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const URL_RE = /(https?:\/\/[^\s]+)/g;

// The blurred dot on its own light ground (192px for a 64px slot), so dark-mode clients
// that recolour the page still show it as a soft light tile instead of losing it.
const MARK_URL = 'https://giud0betrfdsyc5d.public.blob.vercel-storage.com/email/mark.png';

export interface LetterImage {
  /** absolute https url, or a site path like /objects/x.jpg */
  src: string;
  alt: string;
}

const absolute = (src: string) => (src.startsWith('/') ? `${SITE_URL}${src}` : src);

function paragraph(text: string): string {
  const html = escape(text)
    .replace(URL_RE, (url) => `<a href="${url}" style="color:#121010">${url.replace(/^https?:\/\//, '')}</a>`)
    .replace(/\n/g, '<br>');
  return `<p style="margin:0 0 18px">${html}</p>`;
}

function frame(body: string, footer: string): string {
  // A table keeps the dot and the wordmark on one row in Gmail and Outlook; the own <a>
  // stops Gmail from auto-linking "soft.church" in blue.
  return `<!doctype html><html><head><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"></head><body style="margin:0;background:#fafaf8">
<div style="max-width:520px;margin:0 auto;padding:48px 24px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#2e2b2a">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 36px"><tr>
<td valign="middle" style="padding:0 12px 0 0;line-height:0"><a href="${SITE_URL}"><img src="${MARK_URL}" width="40" height="40" alt="a soft blurred dot" style="display:block;width:40px;height:40px;border:0;border-radius:10px"></a></td>
<td valign="middle" style="font-size:15px;line-height:20px;letter-spacing:-0.01em"><a href="${SITE_URL}" style="color:#121010;text-decoration:none">soft.church</a></td>
</tr></table>
${body}
<p style="margin:40px 0 0;font-size:13px;color:#6b6872">${footer}</p>
</div></body></html>`;
}

export function confirmLetter(link: string) {
  const lines = [
    'someone, maybe you, asked to become a witness.',
    'one letter every seventh day. nothing else.',
  ];
  return {
    subject: 'are you a witness?',
    text: `${lines.join('\n\n')}\n\nconfirm: ${link}\n\nif it was not you, do nothing. nothing will come.`,
    html: frame(
      lines.map(paragraph).join('') +
        `<p style="margin:28px 0"><a href="${escape(link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#121010;color:#fafaf8;text-decoration:none;font-size:14px">i am a witness</a></p>`,
      'if it was not you, do nothing. nothing will come.',
    ),
  };
}

/** A letter to all witnesses. Resend fills the unsubscribe link per contact. */
export function broadcastLetter(subject: string, body: string, image?: LetterImage) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const unsubscribe = '{{{RESEND_UNSUBSCRIBE_URL}}}';
  return {
    subject,
    text: `${paragraphs.join('\n\n')}\n\n${SITE_URL}\n\nto stop witnessing: ${unsubscribe}`,
    html: frame(
      (image
        ? `<img src="${escape(absolute(image.src))}" width="240" alt="${escape(image.alt)}" style="display:block;width:240px;max-width:100%;height:auto;border:0;margin:0 0 28px">`
        : '') + paragraphs.map(paragraph).join(''),
      `<a href="${SITE_URL}" style="color:#6b6872">soft.church</a> · <a href="${unsubscribe}" style="color:#6b6872">stop witnessing</a>`,
    ),
  };
}
