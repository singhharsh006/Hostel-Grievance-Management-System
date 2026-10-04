// Email notifications. If SMTP is not configured, it just logs and skips (app keeps working).
const nodemailer = require("nodemailer");

const enabled = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter =
  enabled &&
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: +(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_PORT || "465") === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

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
    await transporter.sendMail({ from: `"Hostel Portal" <${process.env.SMTP_USER}>`, to, subject, html });
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