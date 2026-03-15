import { REPORT_TYPE_MAP } from './reportConstants';

/* ─────────── API helpers (server-side via user-templates) ─────────── */
export const SUBJECT_TEMPLATE = 'report_template';
export const SUBJECT_GENERATED = 'report_generated';

const parseUserTemplate = (t, subject) => ({
  ...t.attributes,
  id: t.id,
  name: t.name,
  _serverId: t.id,
  _subject: subject,
});

export const fetchBySubject = async (subject) => {
  try {
    const response = await fetch('/api/user-templates', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      return data.filter((t) => t.subject === subject).map((t) => parseUserTemplate(t, subject));
    }
  } catch (e) {
    console.error(`Failed to fetch ${subject}:`, e);
  }
  return [];
};

export const fetchReportTemplates = () => fetchBySubject(SUBJECT_TEMPLATE);
export const fetchGeneratedReports = () => fetchBySubject(SUBJECT_GENERATED);

export const saveUserTemplate = async (tpl, subject) => {
  const attrs = { ...tpl };
  delete attrs._serverId;
  delete attrs._subject;
  const payload = {
    name: tpl.name || 'Untitled Report',
    subject,
    description: tpl.type || 'general',
    message: tpl.dateTime || tpl.name || subject,
    attributes: attrs,
  };

  try {
    if (tpl._serverId) {
      payload.id = tpl._serverId;
      const response = await fetch(`/api/user-templates/${tpl._serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const saved = await response.json();
        return parseUserTemplate(saved, subject);
      }
    } else {
      const response = await fetch('/api/user-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const saved = await response.json();
        return parseUserTemplate(saved, subject);
      }
    }
  } catch (e) {
    console.error(`Failed to save ${subject}:`, e);
  }
  return null;
};

export const saveReportTemplate = (tpl) => saveUserTemplate(tpl, SUBJECT_TEMPLATE);
export const saveGeneratedReport = (tpl) => saveUserTemplate(tpl, SUBJECT_GENERATED);

export const deleteUserTemplate = async (serverId) => {
  try {
    await fetch(`/api/user-templates/${serverId}`, { method: 'DELETE' });
  } catch (e) {
    console.error('Failed to delete user-template:', e);
  }
};

/** Re-fetch report data from Traccar API using stored params */
export const refetchReportData = async (gen) => {
  const rt = REPORT_TYPE_MAP[gen.type];
  if (!rt || !gen.deviceIds?.length || !gen.dateFrom || !gen.dateTo) return [];
  const from = new Date(gen.dateFrom).toISOString();
  const to = new Date(gen.dateTo).toISOString();

  // RAG reports need route data to compute scores
  if (gen.type === 'rag' || gen.type === 'rag_driver') {
    return computeRagReport(gen.deviceIds, from, to);
  }

  const allData = [];
  for (const devId of gen.deviceIds) {
    const url = `${rt.endpoint}?deviceId=${devId}&from=${from}&to=${to}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const json = await resp.json();
      allData.push(...json);
    }
  }
  return allData;
};

/** Compute RAG (Red/Amber/Green) driver behavior scores from route + event data */
export const computeRagReport = async (deviceIds, from, to) => {
  const results = [];

  for (const devId of deviceIds) {
    // Fetch summary for distance
    const summaryUrl = `/api/reports/summary?deviceId=${devId}&from=${from}&to=${to}`;
    const summaryResp = await fetch(summaryUrl, { headers: { Accept: 'application/json' } });
    const summaryData = summaryResp.ok ? await summaryResp.json() : [];

    // Fetch route data for overspeed analysis
    const routeUrl = `/api/reports/route?deviceId=${devId}&from=${from}&to=${to}`;
    const routeResp = await fetch(routeUrl, { headers: { Accept: 'application/json' } });
    const routeData = routeResp.ok ? await routeResp.json() : [];

    // Fetch events for harsh acceleration/braking/cornering
    const eventsUrl = `/api/reports/events?deviceId=${devId}&from=${from}&to=${to}`;
    const eventsResp = await fetch(eventsUrl, { headers: { Accept: 'application/json' } });
    const eventsData = eventsResp.ok ? await eventsResp.json() : [];

    const summary = summaryData[0] || {};
    const distanceKm = (summary.distance || 0) / 1000; // meters to km

    // Compute overspeed duration (seconds where speed > speedLimit)
    let overspeedMs = 0;
    for (let i = 0; i < routeData.length - 1; i += 1) {
      const pos = routeData[i];
      const nextPos = routeData[i + 1];
      const speedLimit = pos.attributes?.speedLimit || 0;
      if (speedLimit > 0 && pos.speed > speedLimit) {
        overspeedMs += new Date(nextPos.fixTime).getTime() - new Date(pos.fixTime).getTime();
      }
    }

    // Count harsh events from alarms
    let haccelCount = 0;
    let hbrakeCount = 0;
    let hcornCount = 0;
    eventsData.forEach((ev) => {
      const alarm = ev.attributes?.alarm || ev.type || '';
      if (alarm.includes('hardAcceleration') || alarm.includes('haccel')) haccelCount += 1;
      if (alarm.includes('hardBraking') || alarm.includes('hbrake')) hbrakeCount += 1;
      if (alarm.includes('hardCornering') || alarm.includes('hcorn')) hcornCount += 1;
    });

    // Compute scores (V1 formula)
    const overspeedScore = distanceKm > 0 ? ((overspeedMs / 10000) / distanceKm) * 100 : 0;
    const haccelScore = distanceKm > 0 ? (haccelCount / distanceKm) * 100 : 0;
    const hbrakeScore = distanceKm > 0 ? (hbrakeCount / distanceKm) * 100 : 0;
    const hcornScore = distanceKm > 0 ? (hcornCount / distanceKm) * 100 : 0;
    const ragScore = overspeedScore + haccelScore + hbrakeScore + hcornScore;

    results.push({
      deviceId: devId,
      deviceName: summary.deviceName || `Device ${devId}`,
      distance: summary.distance || 0,
      _overspeedDuration: overspeedMs,
      _overspeedScore: overspeedScore,
      _haccelCount: haccelCount,
      _haccelScore: haccelScore,
      _hbrakeCount: hbrakeCount,
      _hbrakeScore: hbrakeScore,
      _hcornCount: hcornCount,
      _hcornScore: hcornScore,
      _ragScore: ragScore,
    });
  }

  return results;
};
