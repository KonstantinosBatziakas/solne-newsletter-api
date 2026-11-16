import { welcomeHtml } from "./welcome-template.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Publicly hosted hero image URL (replace with your own if different)
const HERO_URL =
  "https://raw.githubusercontent.com/KonstantinosBatziakas/solne-clothes-web/main/images/newsletter-hero.jpg";

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
        const { email } = await request.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return new Response(JSON.stringify({ error: "Valid email is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const normalizedEmail = email.toLowerCase();
        const key = `subscriber:${normalizedEmail}`;

        // Store subscriber in KV
        await env.SOLNE_SUBSCRIBERS.put(
          key,
          JSON.stringify({ email: normalizedEmail, subscribedAt: new Date().toISOString() })
        );

        // Build unsubscribe URL
        const token = await sign(normalizedEmail, env.UNSUBSCRIBE_SECRET);
        const unsubUrl = `${url.origin}/api/newsletter/unsubscribe?email=${encodeURIComponent(
          normalizedEmail
        )}&token=${token}`;

        // Send confirmation email via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.SENDER_EMAIL,
            to: normalizedEmail,
            subject: "Καλώς ήρθες στη Solne!",
            html: welcomeHtml({ heroUrl: HERO_URL, unsubUrl }),
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

        return new Response(JSON.stringify({ success: true, message: "Subscribed successfully" }), {
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
        return new Response("Μη έγκυρος σύνδεσμος.", { status: 400 });
      }

      if (request.method === "POST") {
        await env.SOLNE_SUBSCRIBERS.delete(`subscriber:${email}`);
        return new Response("Διαγράφηκες από τη λίστα.", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return new Response(
        `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Διαγραφή από το newsletter της Solne</title>
<style>
body{margin:0;background:#d9d7d2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}
.box{background:#f2f0ec;padding:40px;max-width:420px;text-align:center;border-radius:8px}
button{background:#1a1a1a;color:#f2f0ec;border:0;padding:14px 28px;font-size:16px;cursor:pointer;border-radius:4px}
</style>
</head>
<body>
<div class="box">
<h1>Διαγραφή από τη λίστα</h1>
<p>Επιβεβαίωσε ότι θέλεις να διαγραφείς <strong>${email}</strong> από το newsletter της Solne.</p>
<form method="POST"><button>Επιβεβαίωση διαγραφής</button></form>
</div>
</body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
};
