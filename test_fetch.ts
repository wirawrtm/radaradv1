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
  
  // 1. Fetch employee
  const empRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "employee",
  });
  const empData = empRes.data.values || [];
  
  // 2. Find Noveni
  const user = "Noveni Budi Rahayuningsih";
  const lowerUser = user.toLowerCase();
  const headers = empData[0];
  const emailIdx = headers.findIndex((h: any) => /email/i.test(String(h).trim()));
  const userIdx = headers.findIndex((h: any) => /^user$|^username$|^user\s*name$/i.test(String(h).trim().toLowerCase()));
  const nameIdx = headers.findIndex((h: any) => /nama|name|pic/i.test(String(h).trim()));
  const posIdx = headers.findIndex((h: any) => /position|jabatan/i.test(String(h).trim()));
  const levelIdx = headers.findIndex((h: any) => /level|grade/i.test(String(h).trim()));
  const groupIdx = headers.findIndex((h: any) => /group|tim|divisi|division/i.test(String(h).trim()));
  
  let matchedRow: any = null;
  for (let i = 1; i < empData.length; i++) {
    const row = empData[i];
    const rowName = nameIdx !== -1 ? String(row[nameIdx] || "").trim().toLowerCase() : "";
    const rowEmail = emailIdx !== -1 ? String(row[emailIdx] || "").trim().toLowerCase() : "";
    const rowUser = userIdx !== -1 ? String(row[userIdx] || "").trim().toLowerCase() : "";
    if (rowUser === lowerUser || rowName === lowerUser || rowEmail === lowerUser) {
      matchedRow = row;
      break;
    }
  }
  
  console.log("Matched Row for", user, ":", matchedRow);
  
  let isBusinessAnalyst = false;
  const userAliases = new Set([lowerUser]);
  if (matchedRow) {
    const rowName = nameIdx !== -1 ? String(matchedRow[nameIdx] || "").trim().toLowerCase() : "";
    const rowEmail = emailIdx !== -1 ? String(matchedRow[emailIdx] || "").trim().toLowerCase() : "";
    const rowUser = userIdx !== -1 ? String(matchedRow[userIdx] || "").trim().toLowerCase() : "";
    const rowPos = posIdx !== -1 ? String(matchedRow[posIdx] || "").trim().toLowerCase() : "";
    
    if (rowName !== "") userAliases.add(rowName);
    if (rowEmail !== "") userAliases.add(rowEmail);
    if (rowUser !== "") userAliases.add(rowUser);
    
    const cleanRowPos = rowPos.replace(/\s+/g, "");
    const rowLevel = levelIdx !== -1 ? String(matchedRow[levelIdx] || "").trim().toLowerCase() : "";
    if (cleanRowPos === "businessanalyst" || cleanRowPos === "analyst" || rowLevel === "admin") {
      isBusinessAnalyst = true;
    }
  }
  
  console.log("isBusinessAnalyst:", isBusinessAnalyst);
  
  let authorizedPICs: string[] = [lowerUser];
  if (isBusinessAnalyst) {
    let adminGroup = "";
    if (matchedRow && levelIdx !== -1 && groupIdx !== -1) {
      const rowLevel = String(matchedRow[levelIdx] || "").trim().toLowerCase();
      if (rowLevel === "admin") {
        adminGroup = String(matchedRow[groupIdx] || "").trim().toLowerCase();
      }
    }
    console.log("adminGroup:", adminGroup);
    
    empData.slice(1).forEach((row) => {
      const rowGroup = groupIdx !== -1 ? String(row[groupIdx] || "").trim().toLowerCase() : "";
      const rowName = nameIdx !== -1 ? String(row[nameIdx] || "").trim().toLowerCase() : "";
      const rowEmail = emailIdx !== -1 ? String(row[emailIdx] || "").trim().toLowerCase() : "";
      const rowUser = userIdx !== -1 ? String(row[userIdx] || "").trim().toLowerCase() : "";
      
      if (adminGroup && adminGroup !== "all" && adminGroup !== "") {
        if (rowGroup !== adminGroup && rowName !== lowerUser && rowEmail !== lowerUser && rowUser !== lowerUser) {
          return;
        }
      }
      if (rowName !== "") userAliases.add(rowName);
      if (rowEmail !== "") userAliases.add(rowEmail);
      if (rowUser !== "") userAliases.add(rowUser);
    });
  }
  
  const queue = Array.from(userAliases);
  const visited = new Set(queue);
  userAliases.forEach((alias) => {
    if (!authorizedPICs.includes(alias)) authorizedPICs.push(alias);
  });
  
  console.log("authorizedPICs length:", authorizedPICs.length);
  
  // 3. Fetch channels
  const chanRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "channel",
  });
  const chanData = chanRes.data.values || [];
  console.log("Channels in sheet:", chanData.length);
  const chanHeaders = chanData[0];
  const idxChan = {
    pic: chanHeaders.findIndex((h: any) => /pic|user|nama|analyst|solution/i.test(String(h).trim())),
    channel: chanHeaders.findIndex((h: any) => /channel|kiosk|nama toko|toko/i.test(String(h).trim())),
    group: chanHeaders.findIndex((h: any) => /group|tim|divisi|division/i.test(String(h).trim())),
  };
  console.log("idxChan:", idxChan);
  
  let authorizedChannelsCount = 0;
  chanData.slice(1).forEach((row, i) => {
    if (row[0] === "" || row[0] === undefined) return;
    const picLower = idxChan.pic !== -1 ? String(row[idxChan.pic] || "").trim().toLowerCase() : "";
    const isAuth = picLower === lowerUser || authorizedPICs.some(auth => picLower === auth || (auth !== "" && picLower.includes(auth)));
    if (isAuth) {
      authorizedChannelsCount++;
    }
  });
  console.log("authorizedChannelsCount:", authorizedChannelsCount);
}
run().catch(console.error);
