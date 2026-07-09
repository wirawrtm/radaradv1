import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

async function run() {
  if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
    console.log("Missing config");
    return;
  }
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Employee groups
  const empRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "employee" });
  const empData = empRes.data.values || [];
  const empHeaders = empData[0];
  const empGroupIdx = empHeaders.findIndex((h: any) => /group|tim|divisi|division/i.test(String(h).trim()));
  const empGroups = new Set<string>();
  empData.slice(1).forEach(row => {
    if (empGroupIdx !== -1 && row[empGroupIdx]) {
      empGroups.add(String(row[empGroupIdx]).trim());
    }
  });

  // 2. Channel groups
  const chanRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "channel" });
  const chanData = chanRes.data.values || [];
  const chanHeaders = chanData[0];
  const chanGroupIdx = chanHeaders.findIndex((h: any) => /group|tim|divisi|division/i.test(String(h).trim()));
  const chanGroups = new Set<string>();
  const groupCounts: Record<string, number> = {};
  chanData.slice(1).forEach(row => {
    if (chanGroupIdx !== -1 && row[chanGroupIdx]) {
      const g = String(row[chanGroupIdx]).trim();
      chanGroups.add(g);
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    }
  });

  console.log("Employee Sheet Unique Groups:", Array.from(empGroups));
  console.log("Channel Sheet Unique Groups and Counts:", groupCounts);
}
run().catch(console.error);
