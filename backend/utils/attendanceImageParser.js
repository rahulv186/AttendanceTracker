const Tesseract = require("tesseract.js");

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const DATE_REGEX = /^(\d{1,2})[-/. ]([A-Za-z]{3,})[-/. ](\d{4})$/;

const xCenter = (bbox) => (bbox.x0 + bbox.x1) / 2;
const yCenter = (bbox) => (bbox.y0 + bbox.y1) / 2;

const normalizeDateToken = (rawText) => {
  if (!rawText) return null;
  const compact = rawText
    .replace(/[|]/g, "1")
    .replace(/\s+/g, "")
    .replace(/_/g, "-")
    .replace(/—|–/g, "-");
  const match = compact.match(DATE_REGEX);
  if (!match) return null;

  const day = Number(match[1]);
  const monthRaw = match[2].toLowerCase().slice(0, 3);
  const year = Number(match[3]);
  const monthIndex = MONTH_INDEX[monthRaw];

  if (!monthIndex && monthIndex !== 0) return null;
  if (day < 1 || day > 31 || year < 2000 || year > 2100) return null;

  const date = new Date(Date.UTC(year, monthIndex, day));
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
};

const normalizeStatusToken = (rawText) => {
  if (!rawText) return null;
  const t = rawText.trim().toUpperCase();
  if (!t) return null;

  if (/^[-–—_]+$/.test(t)) return "-";
  if (t === "P" || t === "PP") return "P";
  if (t === "A" || t === "AA") return "A";
  if (/^[P][A]$/.test(t)) return null;
  if (t.includes("P")) return "P";
  if (t.includes("A")) return "A";

  return null;
};

const buildPeriodColumns = (words, dateRows) => {
  if (!dateRows.length) return [];
  const firstDateY = Math.min(...dateRows.map((r) => r.bbox.y0));

  const headerCandidates = words
    .filter((w) => /^[1-8]$/.test(w.text.trim()))
    .filter((w) => w.bbox.y0 < firstDateY - 8 && w.bbox.y0 > firstDateY - 190)
    .map((w) => ({
      period: Number(w.text.trim()),
      x: xCenter(w.bbox),
      confidence: w.confidence,
    }))
    .sort((a, b) => a.x - b.x);

  const seenPeriods = new Set();
  const deduped = [];
  for (const item of headerCandidates) {
    if (seenPeriods.has(item.period)) continue;
    seenPeriods.add(item.period);
    deduped.push(item);
  }
  if (deduped.length >= 4) return deduped;

  const statusTokens = words
    .map((w) => ({
      x: xCenter(w.bbox),
      status: normalizeStatusToken(w.text),
      confidence: w.confidence,
    }))
    .filter((w) => w.status !== null && w.confidence >= 30)
    .sort((a, b) => a.x - b.x);

  const clusters = [];
  for (const token of statusTokens) {
    const last = clusters[clusters.length - 1];
    if (!last || Math.abs(last.x - token.x) > 28) {
      clusters.push({ x: token.x, count: 1 });
    } else {
      last.x = (last.x * last.count + token.x) / (last.count + 1);
      last.count += 1;
    }
  }

  return clusters.slice(0, 8).map((c, index) => ({
    period: index + 1,
    x: c.x,
    confidence: 100,
  }));
};

const pickClosestPeriod = (periodColumns, tokenX) => {
  if (!periodColumns.length) return null;
  let best = null;
  for (const col of periodColumns) {
    const dist = Math.abs(col.x - tokenX);
    if (!best || dist < best.dist) best = { period: col.period, dist };
  }
  return best && best.dist <= 35 ? best.period : null;
};

const parseAttendanceScreenshot = async (imageBuffer) => {
  const { data } = await Tesseract.recognize(imageBuffer, "eng", {
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: "11",
  });

  const words = (data.words || [])
    .map((w) => ({
      text: (w.text || "").trim(),
      confidence: Number(w.confidence || 0),
      bbox: w.bbox,
    }))
    .filter((w) => w.text);

  const dateRows = words
    .map((w) => ({
      ...w,
      date: normalizeDateToken(w.text),
    }))
    .filter((w) => w.date)
    .sort((a, b) => yCenter(a.bbox) - yCenter(b.bbox));

  if (dateRows.length === 0) {
    return {
      entries: [],
      diagnostics: { message: "No date rows detected in image." },
    };
  }

  const periodColumns = buildPeriodColumns(words, dateRows);
  const statusTokens = words
    .map((w) => ({
      ...w,
      status: normalizeStatusToken(w.text),
      x: xCenter(w.bbox),
      y: yCenter(w.bbox),
    }))
    .filter((w) => w.status !== null);

  const entries = [];
  for (const row of dateRows) {
    const rowY = yCenter(row.bbox);
    const dateText = row.date;
    const byPeriod = {};

    const rowStatuses = statusTokens.filter(
      (w) => Math.abs(w.y - rowY) <= 20 && w.bbox.x0 > row.bbox.x1 + 8,
    );

    for (const token of rowStatuses) {
      const period = pickClosestPeriod(periodColumns, token.x);
      if (!period) continue;

      const current = byPeriod[period];
      if (!current || token.confidence > current.confidence) {
        byPeriod[period] = {
          date: dateText,
          period,
          status: token.status,
          confidence: token.confidence,
          rawText: token.text,
        };
      }
    }

    Object.values(byPeriod).forEach((entry) => entries.push(entry));
  }

  return {
    entries,
    diagnostics: {
      ocrText: data.text || "",
      periodColumns: periodColumns.map((p) => p.period),
      dateRowsDetected: dateRows.length,
    },
  };
};

module.exports = {
  parseAttendanceScreenshot,
};
