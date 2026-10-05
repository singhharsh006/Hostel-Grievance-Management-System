// Email notifications via Brevo HTTP API (Render free plan blocks SMTP ports).
// If BREVO_API_KEY / MAIL_FROM are not set, it just logs and skips (app keeps working).
const enabled = !!(process.env.BREVO_API_KEY && process.env.MAIL_FROM);

const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const row = (k, v) => `<p style="margin:4px 0"><b>${k}:</b> ${esc(v)}</p>`;
const wrap = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#1d4ed8;color:#fff;padding:16px 20px;font-weight:bold">GLBITM Hostel Complaint Portal</div>
  <div style="padding:20px"><h2 style="margin-top:0">${title}</h2>${body}</div>
  <div style="background:#f3f4f6;padding:10px 20px;font-size:12px;color:#6b7280">Automated message - please do not reply.</div>
</div>`;

async function send(to, subject, html) {
  if (!enabled || !to) return console.log("[mail skipped]", subject, "->", to);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "GLBITM Hostel Portal", email: process.env.MAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[mail error]", res.status, text.slice(0, 200));
      return;
    }
    console.log("[mail sent]", subject, "->", to);
  } catch (e) {
    console.error("[mail error]", e.message);
  }
}

// user = { username, email, hostel_no, room_no }
exports.complaintRegistered = (user, c) =>
  send(user.email, `Complaint received: ${c.title}`,
    wrap("We received your complaint",
      `<p>Hi ${esc(user.username)}, your complaint has been registered.</p>
       ${row("Title", c.title)}${row("Category", c.category)}${row("Priority", c.priority)}${row("Status", c.status)}`));

exports.adminAlert = (c, user) =>
  send(process.env.ADMIN_EMAIL, `[${c.priority}] New complaint: ${c.title}`,
    wrap("New complaint",
      `${row("From", `${user.username} (${user.hostel_no}, Room ${user.room_no})`)}
       ${row("Category", c.category)}${row("Priority", c.priority)}<p>${esc(c.description)}</p>`));

exports.statusChanged = (user, c) =>
  send(user.email, `Update on your complaint: ${c.title}`,
    wrap(`Status: ${esc(c.status)}`,
      `<p>Hi ${esc(user.username)}, your complaint is now <b>${esc(c.status)}</b>.</p>
       ${c.adminNote ? row("Admin note", c.adminNote) : ""}`));
// Resolved hone par student AUR admin dono ko email
exports.resolvedNotify = (user, c, resolvedBy) => {
  const by = resolvedBy === "admin" ? "the hostel admin" : "the student";

  // student ko
  send(user.email, `Your complaint is resolved: ${c.title}`,
    wrap("Complaint resolved ✅",
      `<p>Hi ${esc(user.username)}, your complaint has been marked <b>resolved</b> by ${by}.</p>
       ${row("Title", c.title)}${row("Category", c.category)}
       ${c.adminNote ? row("Admin note", c.adminNote) : ""}`));

  // admin ko
  send(process.env.ADMIN_EMAIL, `Resolved: ${c.title}`,
    wrap("Complaint resolved",
      `${row("Student", `${user.username} (${user.hostel_no || c.hostel_no}, Room ${user.room_no || "-"})`)}
       ${row("Title", c.title)}${row("Category", c.category)}${row("Resolved by", by)}`));
};

// Complaint reopen hone par student AUR admin dono ko email
exports.reopenedNotify = (user, c) => {
  // student ko
  send(user.email, `Your complaint was reopened: ${c.title}`,
    wrap("Complaint reopened 🔁",
      `<p>Hi ${esc(user.username)}, your complaint has been reopened and the warden has been notified.</p>
       ${row("Title", c.title)}${row("Category", c.category)}
       ${row("Your reason", c.reopenReason)}${row("Priority", c.priority)}`));

  // admin ko
  send(process.env.ADMIN_EMAIL, `[${c.priority}] Reopened (${c.reopenCount}x): ${c.title}`,
    wrap("Complaint reopened",
      `${row("Student", `${user.username} (${user.hostel_no || c.hostel_no}, Room ${user.room_no || "-"})`)}
       ${row("Title", c.title)}${row("Category", c.category)}
       ${row("Times reopened", c.reopenCount)}${row("Priority", c.priority)}
       ${row("Student says", c.reopenReason)}`));
};
  // Complaint bahut der se pending ho to sirf admin ko reminder
  exports.escalationReminder = (user, c, hours) =>
  send(process.env.ADMIN_EMAIL, `[${c.priority}] Pending ${hours}h+: ${c.title}`,
    wrap("Complaint still unresolved",
      `<p>This complaint has been pending for more than ${hours} hours.</p>
       ${row("Student", `${user.username} (${c.hostel_no}, Room ${user.room_no || "-"})`)}
       ${row("Title", c.title)}${row("Category", c.category)}
       ${row("Priority", c.priority)}${row("Status", c.status)}`));