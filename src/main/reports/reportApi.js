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

/* ─────────── Marker/Zone filtering helpers (V1 parity) ─────────── */

/** Calculate distance between two points (Haversine formula) */
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Check if point is inside a polygon */
const isPointInPolygon = (lat, lng, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect = ((yi > lng) !== (yj > lng))
      && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/** Check if point is inside a geofence */
const isPointInGeofence = (lat, lng, geofence) => {
  if (!geofence.area) return false;

  const areaStr = geofence.area;

  // Parse WKT polygon
  if (areaStr.startsWith('POLYGON')) {
    const coordsMatch = areaStr.match(/\(([^)]+)\)/);
    if (!coordsMatch) return false;

    const coords = coordsMatch[1].split(',').map((c) => {
      const [lngStr, latStr] = c.trim().split(' ');
      return { lat: parseFloat(latStr), lng: parseFloat(lngStr) };
    });

    return isPointInPolygon(lat, lng, coords);
  }

  // Circle geofence
  if (areaStr.startsWith('CIRCLE')) {
    const centerMatch = areaStr.match(/CIRCLE\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.]+)\s*\)/);
    if (!centerMatch) return false;

    const centerLng = parseFloat(centerMatch[1]);
    const centerLat = parseFloat(centerMatch[2]);
    const radius = parseFloat(centerMatch[3]);

    const distance = getDistance(lat, lng, centerLat, centerLng);
    return distance <= radius;
  }

  return false;
};

/** Fetch markers from API */
const fetchMarkers = async () => {
  try {
    const response = await fetch('/api/markers', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Failed to fetch markers:', e);
  }
  return [];
};

/** Fetch geofences from API */
const fetchGeofences = async () => {
  try {
    const response = await fetch('/api/geofences', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Failed to fetch geofences:', e);
  }
  return [];
};

/** Generate marker in/out events from route data (V1 parity) */
const generateMarkerInOutEvents = async (data, markerIds) => {
  if (!markerIds || markerIds.length === 0) {
    return [];
  }

  const allMarkers = await fetchMarkers();
  const selectedMarkers = allMarkers.filter((m) => markerIds.includes(m.id));

  if (selectedMarkers.length === 0 || data.length === 0) {
    return [];
  }

  const events = [];
  const sortedData = [...data].sort((a, b) => new Date(a.fixTime) - new Date(b.fixTime));

  // Track which markers we're currently inside
  const insideMarkers = new Map(); // markerId -> entryTime, entryPosition

  for (const pos of sortedData) {
    if (!pos.latitude || !pos.longitude) continue;

    for (const marker of selectedMarkers) {
      const markerLat = marker.latitude || marker.attributes?.latitude;
      const markerLng = marker.longitude || marker.attributes?.longitude;
      const radius = marker.attributes?.radius || 100;
      const markerId = marker.id;

      const distance = getDistance(pos.latitude, pos.longitude, markerLat, markerLng);
      const isInside = distance <= radius;

      const wasInside = insideMarkers.has(markerId);

      if (isInside && !wasInside) {
        // Entered marker
        insideMarkers.set(markerId, {
          entryTime: pos.fixTime,
          entryPosition: pos,
          entryOdometer: pos.attributes?.odometer || 0,
        });
      } else if (!isInside && wasInside) {
        // Exited marker
        const entry = insideMarkers.get(markerId);
        const exitTime = pos.fixTime;
        const duration = new Date(exitTime) - new Date(entry.entryTime);

        events.push({
          type: 'marker_in_out',
          markerId,
          markerName: marker.name,
          markerIn: entry.entryTime,
          markerOut: exitTime,
          duration,
          routeLength: Math.abs((pos.attributes?.odometer || 0) - entry.entryOdometer),
          position: `${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`,
          address: pos.address || '',
        });

        insideMarkers.delete(markerId);
      }
    }
  }

  // Handle markers we're still inside at the end
  for (const [markerId, entry] of insideMarkers) {
    const marker = selectedMarkers.find((m) => m.id === markerId);
    events.push({
      type: 'marker_in_out',
      markerId,
      markerName: marker?.name || `Marker ${markerId}`,
      markerIn: entry.entryTime,
      markerOut: null,
      duration: null,
      routeLength: 0,
      position: `${entry.entryPosition.latitude.toFixed(6)}, ${entry.entryPosition.longitude.toFixed(6)}`,
      address: entry.entryPosition.address || '',
    });
  }

  return events;
};

/** Generate zone in/out events from route data (V1 parity) */
const generateZoneInOutEvents = async (data, zoneIds) => {
  if (!zoneIds || zoneIds.length === 0) {
    return [];
  }

  const allGeofences = await fetchGeofences();
  const selectedZones = allGeofences.filter((g) => zoneIds.includes(g.id));

  if (selectedZones.length === 0 || data.length === 0) {
    return [];
  }

  const events = [];
  const sortedData = [...data].sort((a, b) => new Date(a.fixTime) - new Date(b.fixTime));

  // Track which zones we're currently inside
  const insideZones = new Map(); // zoneId -> entryTime, entryPosition

  for (const pos of sortedData) {
    if (!pos.latitude || !pos.longitude) continue;

    for (const zone of selectedZones) {
      const zoneId = zone.id;
      const isInside = isPointInGeofence(pos.latitude, pos.longitude, zone);
      const wasInside = insideZones.has(zoneId);

      if (isInside && !wasInside) {
        // Entered zone
        insideZones.set(zoneId, {
          entryTime: pos.fixTime,
          entryPosition: pos,
          entryOdometer: pos.attributes?.odometer || 0,
        });
      } else if (!isInside && wasInside) {
        // Exited zone
        const entry = insideZones.get(zoneId);
        const exitTime = pos.fixTime;
        const duration = new Date(exitTime) - new Date(entry.entryTime);

        events.push({
          type: 'zone_in_out',
          zoneId,
          zoneName: zone.name,
          zoneIn: entry.entryTime,
          zoneOut: exitTime,
          duration,
          routeLength: Math.abs((pos.attributes?.odometer || 0) - entry.entryOdometer),
          position: `${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`,
          address: pos.address || '',
        });

        insideZones.delete(zoneId);
      }
    }
  }

  // Handle zones we're still inside at the end
  for (const [zoneId, entry] of insideZones) {
    const zone = selectedZones.find((g) => g.id === zoneId);
    events.push({
      type: 'zone_in_out',
      zoneId,
      zoneName: zone?.name || `Zone ${zoneId}`,
      zoneIn: entry.entryTime,
      zoneOut: null,
      duration: null,
      routeLength: 0,
      position: `${entry.entryPosition.latitude.toFixed(6)}, ${entry.entryPosition.longitude.toFixed(6)}`,
      address: entry.entryPosition.address || '',
    });
  }

  return events;
};

/** Maximum records to fetch per device to prevent stack overflow */
const MAX_RECORDS_PER_DEVICE = 10000;
/** Maximum days allowed in date range */
const MAX_DATE_RANGE_DAYS = 90;

/** Re-fetch report data from Traccar API using stored params (V1 parity) */
export const refetchReportData = async (gen) => {
  console.log('[DEBUG] refetchReportData called with:', { type: gen.type, deviceIds: gen.deviceIds, dateFrom: gen.dateFrom, dateTo: gen.dateTo });

  const rt = REPORT_TYPE_MAP[gen.type];
  if (!rt) {
    console.error('[DEBUG] Report type not found in REPORT_TYPE_MAP:', gen.type);
    return [];
  }
  if (!gen.deviceIds?.length) {
    console.error('[DEBUG] No deviceIds provided');
    return [];
  }
  if (!gen.dateFrom || !gen.dateTo) {
    console.error('[DEBUG] Missing dateFrom or dateTo');
    return [];
  }

  const fromDate = new Date(gen.dateFrom);
  const toDate = new Date(gen.dateTo);
  const from = fromDate.toISOString();
  const to = toDate.toISOString();

  // Check date range - warn if too large
  const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
  if (daysDiff > MAX_DATE_RANGE_DAYS) {
    console.warn(`Date range too large: ${Math.round(daysDiff)} days. Max recommended: ${MAX_DATE_RANGE_DAYS} days.`);
    // Auto-limit the date range to prevent overflow
    const limitedFrom = new Date(toDate.getTime() - MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000);
    gen.dateFrom = limitedFrom.toISOString();
    console.warn(`Auto-limited date range to last ${MAX_DATE_RANGE_DAYS} days: ${gen.dateFrom} to ${gen.dateTo}`);
  }

  // RAG reports need route data to compute scores
  if (gen.type === 'rag' || gen.type === 'rag_driver') {
    return computeRagReport(gen.deviceIds, from, to);
  }

  // Marker in/out reports - generate events from route data
  if (gen.type === 'marker_in_out' || gen.type === 'marker_in_out_gen') {
    const allData = [];
    for (const devId of gen.deviceIds) {
      const url = `${rt.endpoint}?deviceId=${devId}&from=${from}&to=${to}`;
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      if (resp.ok) {
        const json = await resp.json();
        allData.push(...json);
      }
    }
    return generateMarkerInOutEvents(allData, gen.markerIds);
  }

  // Zone in/out reports - generate events from route data
  if (gen.type === 'zone_in_out' || gen.type === 'zone_in_out_general') {
    const allData = [];
    for (const devId of gen.deviceIds) {
      const url = `${rt.endpoint}?deviceId=${devId}&from=${from}&to=${to}`;
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      if (resp.ok) {
        const json = await resp.json();
        allData.push(...json);
      }
    }
    return generateZoneInOutEvents(allData, gen.zoneIds);
  }

  // Standard reports - fetch data from API
  const allData = [];
  for (const devId of gen.deviceIds) {
    const url = `${rt.endpoint}?deviceId=${devId}&from=${from}&to=${to}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const json = await resp.json();
      // Limit data to prevent stack overflow
      if (json.length > MAX_RECORDS_PER_DEVICE) {
        console.warn(`Device ${devId} returned ${json.length} records, limiting to ${MAX_RECORDS_PER_DEVICE}`);
        allData.push(...json.slice(-MAX_RECORDS_PER_DEVICE)); // Take most recent records
      } else {
        allData.push(...json);
      }
    }
  }

  // Apply speed limit filter for overspeed reports
  if ((gen.type === 'overspeed' || gen.type === 'overspeed_count') && gen.speedLimit > 0) {
    const speedLimitKnots = gen.speedLimit / 1.852; // Convert km/h to knots
    return allData.filter((pos) => (pos.speed || 0) > speedLimitKnots);
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
