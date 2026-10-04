const cron = require("node-cron");
const Complaint = require("../models/Complaint");
require("../models/User");
const mail = require("./mailer");

const HOUR = 60 * 60 * 1000;
const ESCALATE_AFTER_H = 24;
const REMINDER_AFTER_H = 48;
const NEXT_PRIORITY = { Low: "Medium", Medium: "High", High: "Urgent", Urgent: "Urgent" };

let running = false;

async function runEscalation() {
  if (running) return;
  running = true;
  try {
    const now = Date.now();
    const open = await Complaint.find({ status: { $in: ["not resolved", "in progress"] } })
      .populate("user", "username room_no");

    for (const c of open) {
      // reopen hui complaint ke liye ghadi reopen ke time se chalti hai
      const base = (c.reopenedAt || c.createdAt).getTime();
      const ageH = (now - base) / HOUR;

      // 24h: priority ek level upar (admin ne khud set ki ho to nahi)
      const escalatedThisCycle = c.escalatedAt && c.escalatedAt.getTime() >= base;
      if (ageH >= ESCALATE_AFTER_H && !escalatedThisCycle) {
        if (c.prioritySource !== "admin") c.priority = NEXT_PRIORITY[c.priority] || c.priority;
        c.escalatedAt = new Date();
        await c.save();
        console.log("[escalation] priority raised:", c.title, "->", c.priority);
      }

      // 48h: admin ko reminder email (ek cycle mein ek baar)
      const remindedThisCycle = c.reminderSentAt && c.reminderSentAt.getTime() >= base;
      if (ageH >= REMINDER_AFTER_H && !remindedThisCycle) {
        if (c.user) mail.escalationReminder(c.user, c, REMINDER_AFTER_H);
        c.reminderSentAt = new Date();
        await c.save();
        console.log("[escalation] reminder sent:", c.title);
      }
    }
  } catch (err) {
    console.error("[escalation] error:", err.message);
  } finally {
    running = false;
  }
}

function startEscalation() {
  cron.schedule("0 * * * *", runEscalation); // har ghante
  runEscalation(); // server start hote hi ek baar
  console.log("[escalation] job started (hourly)");
}

module.exports = { startEscalation, runEscalation };