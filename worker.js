import {
  welcomeHtml,
  unsubPageHtml,
  getSubject,
  getUnsubDone,
  getUnsubInvalid,
} from "./welcome-template.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const HERO_URL =
  "https://pub-c419e9b2a9bf4e2ebf3a9d2011773a64.r2.dev/newsletter-hero.JPG";

async function sign(email, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Detect language from Accept-Language header, default to Greek
function detectLang(request) {
  const accept = request.headers.get("Accept-Language") || "";
  if (/^en/i.test(accept.trim()) || /en/i.test(accept)) return "en";
  return "el";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // POST /api/newsletter/subscribe
    if (request.method === "POST" && url.pathname === "/api/newsletter/subscribe") {
      try {
        const body = await request.json();
        const email = body.email;
        const lang = body.lang || detectLang(request);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return new Response(JSON.stringify({ error: "Valid email is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const normalizedEmail = email.toLowerCase();
        const key = `subscriber:${normalizedEmail}`;

        // Store subscriber in KV with language preference (remembered forever)
        await env.SOLNE_SUBSCRIBERS.put(
          key,
          JSON.stringify({
            email: normalizedEmail,
            lang,
            subscribedAt: new Date().toISOString(),
          })
        );

        // Build unsubscribe URL
        const token = await sign(normalizedEmail, env.UNSUBSCRIBE_SECRET);
        const unsubUrl = `${url.origin}/api/newsletter/unsubscribe?email=${encodeURIComponent(
          normalizedEmail
        )}&token=${token}`;

        // Send confirmation email via Resend in the detected language
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.SENDER_EMAIL,
            to: normalizedEmail,
            subject: getSubject(lang),
            html: welcomeHtml({ heroUrl: HERO_URL, unsubUrl, lang }),
            headers: {
              "List-Unsubscribe": `<${unsubUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (!emailResponse.ok) {
          const errorBody = await emailResponse.text();
          return new Response(JSON.stringify({ error: "Failed to send email", detail: errorBody }), {
            status: 502,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        return new Response(JSON.stringify({ success: true, message: "Subscribed successfully", lang }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal server error", detail: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // GET/POST /api/newsletter/unsubscribe
    if (url.pathname === "/api/newsletter/unsubscribe") {
      const email = (url.searchParams.get("email") || "").toLowerCase();
      const token = url.searchParams.get("token") || "";
      const ok = email && token === (await sign(email, env.UNSUBSCRIBE_SECRET));

      if (!ok) {
        return new Response(getUnsubInvalid(), { status: 400 });
      }

      // Look up the subscriber's stored language preference
      let lang = "el";
      try {
        const stored = await env.SOLNE_SUBSCRIBERS.get(`subscriber:${email}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.lang) lang = parsed.lang;
        }
      } catch (e) {
        // fall back to default language
      }

      if (request.method === "POST") {
        await env.SOLNE_SUBSCRIBERS.delete(`subscriber:${email}`);
        return new Response(getUnsubDone(lang), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return new Response(unsubPageHtml({ email, lang }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
};