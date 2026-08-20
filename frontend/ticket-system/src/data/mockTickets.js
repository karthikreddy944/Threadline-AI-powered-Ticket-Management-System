// Mock data for the Threadline prototype. No backend/LLM calls yet.

export const CATEGORIES = ["Network", "Hardware", "Software", "Account/Login", "Other"];
export const PRIORITIES = ["Low", "Medium", "High", "Critical"];
export const STATUSES = ["New", "AI Analysis", "Assigned", "In Progress", "Pending", "Resolved", "Closed"];

export const currentUser = {
  name: "Ananya Rao",
  email: "ananya.rao@bmsce.ac.in",
  role: "Student",
  department: "Computer Science, 3rd Year",
  initials: "AR",
};

export const currentAdmin = {
  name: "Farhan Sheikh",
  email: "farhan.sheikh@bmsce.ac.in",
  role: "IT Support Admin",
  initials: "FS",
};

export const admins = [
  { id: "adm-1", name: "Farhan Sheikh", team: "Network & Infra" },
  { id: "adm-2", name: "Divya Menon", team: "Hardware Desk" },
  { id: "adm-3", name: "Rohit Bhandari", team: "Software & Access" },
];

export const tickets = [
  {
    id: "INC-1048",
    title: "Wi-Fi disconnecting repeatedly in the library block",
    category: "Network",
    priority: "High",
    status: "In Progress",
    requester: "Ananya Rao",
    assignedTo: "Farhan Sheikh",
    created: "2026-08-15T09:12:00",
    updated: "2026-08-17T14:20:00",
    description:
      "Since Wednesday, my laptop drops the campus Wi-Fi every 4–5 minutes while I'm in the 2nd floor library block. Reconnecting works but it's disrupting an online lab submission. Other students nearby seem to have the same issue.",
    aiAnalysis: {
      summary: "User reports frequent Wi-Fi disconnections, roughly every 4–5 minutes, localized to the library block. Likely affects multiple users in the same area.",
      category: "Network",
      priority: "High",
      recommendedAction: "Check access point load and channel congestion on the library block AP. Verify firmware version and review recent DHCP lease failures for that subnet.",
      confidence: 0.91,
    },
    attachments: [{ name: "wifi-signal-screenshot.png", size: "412 KB" }],
    timeline: [
      { type: "created", actor: "Ananya Rao", at: "2026-08-15T09:12:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-15T09:12:04", text: "Classified as Network · High priority." },
      { type: "assigned", actor: "System", at: "2026-08-15T09:40:00", text: "Assigned to Farhan Sheikh (Network & Infra)." },
      { type: "comment", actor: "Farhan Sheikh", at: "2026-08-16T11:05:00", text: "Checked AP-LIB-02, seeing high client count during peak hours. Investigating channel overlap." },
      { type: "status", actor: "Farhan Sheikh", at: "2026-08-17T14:20:00", text: "Moved to In Progress — firmware update scheduled tonight." },
    ],
  },
  {
    id: "INC-1047",
    title: "Unable to access student portal after password reset",
    category: "Account/Login",
    priority: "Medium",
    status: "Assigned",
    requester: "Karthik Iyer",
    assignedTo: "Rohit Bhandari",
    created: "2026-08-15T08:03:00",
    updated: "2026-08-16T10:00:00",
    description:
      "I reset my password yesterday through the 'forgot password' link but I still can't log into the student portal. It says 'invalid credentials' even right after resetting.",
    aiAnalysis: {
      summary: "User cannot log into the student portal following a password reset; receives an invalid-credentials error immediately after reset.",
      category: "Account/Login",
      priority: "Medium",
      recommendedAction: "Verify the reset token was consumed correctly and check for a caching or session issue on the portal's auth service.",
      confidence: 0.86,
    },
    attachments: [],
    timeline: [
      { type: "created", actor: "Karthik Iyer", at: "2026-08-15T08:03:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-15T08:03:03", text: "Classified as Account/Login · Medium priority." },
      { type: "assigned", actor: "System", at: "2026-08-16T10:00:00", text: "Assigned to Rohit Bhandari (Software & Access)." },
    ],
  },
  {
    id: "INC-1046",
    title: "Laptop display flickering intermittently",
    category: "Hardware",
    priority: "Low",
    status: "New",
    requester: "Sneha Pillai",
    assignedTo: null,
    created: "2026-08-14T16:45:00",
    updated: "2026-08-14T16:45:00",
    description:
      "My laptop screen flickers for a few seconds every hour or so, mostly when running on battery. Started two days ago. Not urgent but would like it looked at.",
    aiAnalysis: {
      summary: "Intermittent display flicker, more frequent on battery power, started two days ago. Non-blocking issue.",
      category: "Hardware",
      priority: "Low",
      recommendedAction: "Check display cable seating and GPU driver version. Test on AC power to isolate a power-management cause.",
      confidence: 0.78,
    },
    attachments: [],
    timeline: [
      { type: "created", actor: "Sneha Pillai", at: "2026-08-14T16:45:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-14T16:45:05", text: "Classified as Hardware · Low priority." },
    ],
  },
  {
    id: "INC-1045",
    title: "Unable to reset password — reset email never arrives",
    category: "Account/Login",
    priority: "Medium",
    status: "Resolved",
    requester: "Ananya Rao",
    assignedTo: "Rohit Bhandari",
    created: "2026-08-11T12:20:00",
    updated: "2026-08-12T09:15:00",
    description:
      "Requested a password reset three times over the last hour and the email never shows up, even in spam. Locked out of the portal.",
    aiAnalysis: {
      summary: "Password reset emails are not being delivered after multiple attempts, blocking portal access.",
      category: "Account/Login",
      priority: "Medium",
      recommendedAction: "Check mail queue for the campus SMTP relay and confirm the student's email alias is correctly mapped.",
      confidence: 0.83,
    },
    attachments: [],
    timeline: [
      { type: "created", actor: "Ananya Rao", at: "2026-08-11T12:20:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-11T12:20:04", text: "Classified as Account/Login · Medium priority." },
      { type: "assigned", actor: "System", at: "2026-08-11T13:00:00", text: "Assigned to Rohit Bhandari (Software & Access)." },
      { type: "comment", actor: "Rohit Bhandari", at: "2026-08-12T08:40:00", text: "Found the alias mismatch on the mail relay, corrected and resent." },
      { type: "status", actor: "Rohit Bhandari", at: "2026-08-12T09:15:00", text: "Marked as Resolved — reset email confirmed received." },
    ],
  },
  {
    id: "INC-1044",
    title: "Projector not detecting laptop in Seminar Hall 3",
    category: "Hardware",
    priority: "High",
    status: "Resolved",
    requester: "Manoj Deshpande",
    assignedTo: "Divya Menon",
    created: "2026-08-10T09:00:00",
    updated: "2026-08-10T09:50:00",
    description:
      "HDMI output isn't being picked up by the projector in Seminar Hall 3, needed for a 10am presentation.",
    aiAnalysis: {
      summary: "Projector fails to detect HDMI input ahead of a scheduled presentation. Time-sensitive.",
      category: "Hardware",
      priority: "High",
      recommendedAction: "Dispatch on-site technician immediately; check HDMI cable and projector input source setting.",
      confidence: 0.94,
    },
    attachments: [],
    timeline: [
      { type: "created", actor: "Manoj Deshpande", at: "2026-08-10T09:00:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-10T09:00:02", text: "Classified as Hardware · High priority." },
      { type: "assigned", actor: "System", at: "2026-08-10T09:05:00", text: "Assigned to Divya Menon (Hardware Desk)." },
      { type: "status", actor: "Divya Menon", at: "2026-08-10T09:50:00", text: "Resolved on-site — swapped faulty HDMI cable." },
    ],
  },
  {
    id: "INC-1043",
    title: "Excel macro throwing 'compile error' after Office update",
    category: "Software",
    priority: "Low",
    status: "Resolved",
    requester: "Priya Nair",
    assignedTo: "Rohit Bhandari",
    created: "2026-08-08T14:10:00",
    updated: "2026-08-09T11:30:00",
    description:
      "A macro I use for the lab attendance sheet throws a compile error since the Office update last week.",
    aiAnalysis: {
      summary: "A previously working Excel macro fails to compile after a recent Office update.",
      category: "Software",
      priority: "Low",
      recommendedAction: "Check for a missing VBA reference caused by the update; re-link the reference library.",
      confidence: 0.8,
    },
    attachments: [],
    timeline: [
      { type: "created", actor: "Priya Nair", at: "2026-08-08T14:10:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-08T14:10:03", text: "Classified as Software · Low priority." },
      { type: "assigned", actor: "System", at: "2026-08-08T15:00:00", text: "Assigned to Rohit Bhandari (Software & Access)." },
      { type: "status", actor: "Rohit Bhandari", at: "2026-08-09T11:30:00", text: "Resolved — re-linked missing VBA reference." },
    ],
  },
  {
    id: "INC-1042",
    title: "Printer in CS block queues jobs but never prints",
    category: "Hardware",
    priority: "Medium",
    status: "New",
    requester: "Vikram Suresh",
    assignedTo: null,
    created: "2026-08-17T10:30:00",
    updated: "2026-08-17T10:30:00",
    description:
      "Jobs sit in the print queue for the shared printer near the CS block staff room and never actually print. Queue shows 'processing' indefinitely.",
    aiAnalysis: {
      summary: "Print jobs remain stuck in 'processing' state on a shared printer and never complete.",
      category: "Hardware",
      priority: "Medium",
      recommendedAction: "Restart the print spooler service and check the printer's network connection and toner/paper status.",
      confidence: 0.75,
    },
    attachments: [],
    timeline: [
      { type: "created", actor: "Vikram Suresh", at: "2026-08-17T10:30:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-17T10:30:04", text: "Classified as Hardware · Medium priority." },
    ],
  },
  {
    id: "INC-1041",
    title: "Campus VPN drops when switching between hostel and lab Wi-Fi",
    category: "Network",
    priority: "Critical",
    status: "AI Analysis",
    requester: "Ishaan Malhotra",
    assignedTo: null,
    created: "2026-08-17T18:05:00",
    updated: "2026-08-17T18:05:00",
    description:
      "VPN connection drops every time I move from the hostel network to the CS lab network and I lose access to the research server mid-transfer. This is blocking a dataset upload due tonight.",
    aiAnalysis: {
      summary: "VPN session terminates when the client roams between two campus networks, interrupting an in-progress file transfer with a hard deadline tonight.",
      category: "Network",
      priority: "Critical",
      recommendedAction: "Escalate immediately — check VPN concentrator session persistence across subnets and consider a temporary static route for the user.",
      confidence: 0.89,
    },
    attachments: [{ name: "vpn-error-log.txt", size: "18 KB" }],
    timeline: [
      { type: "created", actor: "Ishaan Malhotra", at: "2026-08-17T18:05:00", text: "Ticket submitted." },
      { type: "ai", actor: "Threadline AI", at: "2026-08-17T18:05:03", text: "Classified as Network · Critical priority. Flagged for immediate review." },
    ],
  },
];

export const getTicketById = (id) => tickets.find((t) => t.id === id);

export const statusMeta = {
  "New": { tone: "neutral" },
  "AI Analysis": { tone: "accent" },
  "Assigned": { tone: "info" },
  "In Progress": { tone: "warning" },
  "Resolved": { tone: "success" },
};

export const priorityMeta = {
  "Low": { tone: "low" },
  "Medium": { tone: "medium" },
  "High": { tone: "high" },
  "Critical": { tone: "critical" },
};
