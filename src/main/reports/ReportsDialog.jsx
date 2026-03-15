import {
  useEffect, useState, useMemo, useCallback, useRef,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Tabs, Tab,
  CircularProgress, Menu, MenuItem,
} from '@mui/material';
import { useSelector } from 'react-redux';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import { CustomTable, BoolIcon } from '../../common/components/custom';
import {
  REPORT_TYPE_MAP,
  TIME_FILTERS,
} from './reportConstants';
import {
  fetchReportTemplates,
  fetchGeneratedReports,
  saveReportTemplate,
  saveGeneratedReport,
  deleteUserTemplate,
  refetchReportData,
} from './reportApi';
import {
  setupReportSchedule,
  removeReportSchedule,
} from './reportScheduleApi';
import {
  buildHtmlReport,
  generatePdfFromData,
  downloadReportFile,
  isGraphicalReport,
} from './reportGenerator';
import { fmtShort, applyTimeFilter } from './reportUtils';
import { useReportStyles } from './useReportStyles';
import ReportPropertiesDialog from './ReportPropertiesDialog';
import ChartReportDialog from './ChartReportDialog';

/* ═══════════════════════════════════════════════════════════════
   Main ReportsDialog  – 2 tabs with CustomTable (V1 parity)
   ═══════════════════════════════════════════════════════════════ */
const ReportsDialog = ({ open, onClose }) => {
  const { classes } = useReportStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);
  const geofenceItems = useSelector((state) => state.geofences.items);
  const geofenceList = useMemo(() => Object.values(geofenceItems), [geofenceItems]);

  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);

  /* Search state per tab */
  const [templateSearch, setTemplateSearch] = useState('');
  const [generatedSearch, setGeneratedSearch] = useState('');

  /* Checkbox selection per tab */
  const [templateSelected, setTemplateSelected] = useState([]);
  const [generatedSelected, setGeneratedSelected] = useState([]);

  /* Properties dialog */
  const [propsOpen, setPropsOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  /* Chart dialog for graphical reports */
  const [chartOpen, setChartOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartTemplate, setChartTemplate] = useState(null);
  const [chartDateFrom, setChartDateFrom] = useState('');
  const [chartDateTo, setChartDateTo] = useState('');

  /* Gear dropdown menu (Reports tab quick-generate) */
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuTemplateRef = useRef(null);

  /* Load data on open */
  useEffect(() => {
    if (open) {
      fetchReportTemplates().then(setTemplates);
      fetchGeneratedReports().then(setGenerated);
      // Fetch markers (CIRCLE geofences with type='marker')
      fetch('/api/markers', { headers: { Accept: 'application/json' } })
        .then((res) => res.json())
        .then(setMarkers)
        .catch(() => setMarkers([]));
    }
  }, [open]);

  /* ── Filtered rows ── */
  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return templates;
    const q = templateSearch.toLowerCase();
    return templates.filter((t) => (t.name || '').toLowerCase().includes(q)
      || (REPORT_TYPE_MAP[t.type]?.label || '').toLowerCase().includes(q));
  }, [templates, templateSearch]);

  const filteredGenerated = useMemo(() => {
    if (!generatedSearch) return generated;
    const q = generatedSearch.toLowerCase();
    return generated.filter((g) => (g.name || '').toLowerCase().includes(q)
      || (REPORT_TYPE_MAP[g.type]?.label || '').toLowerCase().includes(q));
  }, [generated, generatedSearch]);

  /* ── CustomTable column definitions ── */
  const templateColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => REPORT_TYPE_MAP[row.type]?.label || row.type },
    { key: 'format', label: 'Format', render: (row) => (row.format || '').toUpperCase() },
    { key: 'deviceIds', label: 'Objects', align: 'center', render: (row) => row.deviceIds?.length || 0 },
    { key: 'zoneIds', label: 'Zones', align: 'center', render: (row) => row.zoneIds?.length || 0 },
    { key: 'sensorIds', label: 'Sensors', align: 'center', render: (row) => row.sensorIds?.length || 0 },
    { key: 'daily', label: 'Daily', align: 'center', render: (row) => <BoolIcon value={row.daily} /> },
    { key: 'weekly', label: 'Weekly', align: 'center', render: (row) => <BoolIcon value={row.weekly} /> },
  ], []);

  const generatedColumns = useMemo(() => [
    { key: 'dateTime', label: 'DateTime', render: (row) => fmtShort(row.dateTime) },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => REPORT_TYPE_MAP[row.type]?.label || row.type },
    { key: 'format', label: 'Format', render: (row) => (row.format || '').toUpperCase() },
    { key: 'deviceIds', label: 'Objects', align: 'center', render: (row) => row.deviceIds?.length || 0 },
    { key: 'zoneIds', label: 'Zones', align: 'center', render: (row) => row.zoneIds?.length || 0 },
    { key: 'schedule', label: 'Schedule', align: 'center', render: (row) => <BoolIcon value={row.schedule} /> },
    { key: 'recordCount', label: 'Records', render: (row) => row.recordCount ?? (row.data?.length || 0) },
  ], []);

  /* ── Template CRUD ── */
  const handleSaveTemplate = useCallback(async (tpl) => {
    // Handle scheduling if daily or weekly is enabled
    if (tpl.daily || tpl.weekly) {
      try {
        const scheduleResult = await setupReportSchedule(tpl);
        if (scheduleResult) {
          tpl.calendarId = scheduleResult.calendarId;
          tpl.reportId = scheduleResult.reportId;
        }
      } catch (err) {
        console.error('Failed to setup schedule:', err);
        // Continue saving template even if scheduling fails
      }
    } else if (tpl.calendarId || tpl.reportId) {
      // Remove existing schedule if disabled
      try {
        await removeReportSchedule(tpl.calendarId, tpl.reportId);
        tpl.calendarId = null;
        tpl.reportId = null;
      } catch (err) {
        console.error('Failed to remove schedule:', err);
      }
    }

    const saved = await saveReportTemplate(tpl);
    if (saved) {
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t._serverId === saved._serverId);
        return idx >= 0 ? prev.map((t, i) => (i === idx ? saved : t)) : [...prev, saved];
      });
    }
  }, []);

  const handleDeleteTemplate = useCallback(async (row) => {
    // Remove schedule if exists
    if (row.calendarId || row.reportId) {
      try {
        await removeReportSchedule(row.calendarId, row.reportId);
      } catch (err) {
        console.error('Failed to remove schedule:', err);
      }
    }
    if (row?._serverId) {
      await deleteUserTemplate(row._serverId);
    }
    setTemplates((prev) => prev.filter((t) => t.id !== row.id));
    setTemplateSelected((prev) => prev.filter((id) => id !== row.id));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchReportTemplates().then(setTemplates);
    fetchGeneratedReports().then(setGenerated);
  }, []);

  /* ── Generate report from template ── */
  const handleGenerate = useCallback(async (tpl) => {
    if (!tpl.deviceIds || tpl.deviceIds.length === 0) return;
    if (!tpl.dateFrom || !tpl.dateTo) return;
    setLoading(true);
    try {
      const allData = await refetchReportData(tpl);

      /* Check if this is a graphical report - show in dialog instead */
      if (isGraphicalReport(tpl.type)) {
        setChartData(allData);
        setChartTemplate(tpl);
        setChartDateFrom(tpl.dateFrom);
        setChartDateTo(tpl.dateTo);
        setChartOpen(true);
        setLoading(false);

        // Save metadata to server
        const genMeta = {
          name: tpl.name || 'Untitled',
          type: tpl.type,
          format: tpl.format,
          deviceIds: tpl.deviceIds,
          zoneIds: tpl.zoneIds,
          schedule: tpl.daily || tpl.weekly,
          dateFrom: tpl.dateFrom,
          dateTo: tpl.dateTo,
          dateTime: new Date().toISOString(),
          recordCount: allData.length,
        };
        const saved = await saveGeneratedReport(genMeta);
        if (saved) {
          setGenerated((prev) => [saved, ...prev]);
        }
        setTab(1);
        return;
      }

      /* Generate report and download directly */
      const fmt = tpl.format || 'html';
      const html = buildHtmlReport(allData, tpl, deviceList, tpl.dateFrom, tpl.dateTo);
      const rt = REPORT_TYPE_MAP[tpl.type];
      const reportLabel = rt?.label || tpl.type;

      // Generate PDF document if format is pdf
      let pdfDoc = null;
      if (fmt === 'pdf') {
        pdfDoc = generatePdfFromData(allData, tpl, deviceList, tpl.dateFrom, tpl.dateTo, reportLabel);
      }

      // Download the file directly
      downloadReportFile(html, tpl.name, tpl.dateFrom, tpl.dateTo, fmt, pdfDoc);

      // Save metadata to server (no raw data blob)
      const genMeta = {
        name: tpl.name || 'Untitled',
        type: tpl.type,
        format: tpl.format,
        deviceIds: tpl.deviceIds,
        zoneIds: tpl.zoneIds,
        schedule: tpl.daily || tpl.weekly,
        dateFrom: tpl.dateFrom,
        dateTo: tpl.dateTo,
        dateTime: new Date().toISOString(),
        recordCount: allData.length,
      };
      const saved = await saveGeneratedReport(genMeta);
      if (saved) {
        setGenerated((prev) => [saved, ...prev]);
      }
      setTab(1);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceList]);

  /* ── Quick Generate from gear dropdown (time filter) ── */
  const handleQuickGenerate = useCallback(async (filterId) => {
    const tpl = menuTemplateRef.current;
    setMenuAnchor(null);
    if (!tpl || !tpl.deviceIds || tpl.deviceIds.length === 0) return;
    const { from, to } = applyTimeFilter(filterId);
    const tplWithDates = { ...tpl, dateFrom: from, dateTo: to };
    await handleGenerate(tplWithDates);
  }, [handleGenerate]);

  const handleDeleteGenerated = useCallback(async (row) => {
    if (row?._serverId) {
      await deleteUserTemplate(row._serverId);
    }
    setGenerated((prev) => prev.filter((g) => g.id !== row.id));
    setGeneratedSelected((prev) => prev.filter((id) => id !== row.id));
  }, []);

  /* ── Bulk delete ── */
  const handleBulkDeleteTemplates = useCallback(async (ids) => {
    for (const id of ids) {
      const tpl = templates.find((t) => t.id === id);
      if (tpl?._serverId) {
        await deleteUserTemplate(tpl._serverId);
      }
    }
    setTemplates((prev) => prev.filter((t) => !ids.includes(t.id)));
    setTemplateSelected([]);
  }, [templates]);

  const handleBulkDeleteGenerated = useCallback(async (ids) => {
    for (const id of ids) {
      const gen = generated.find((g) => g.id === id);
      if (gen?._serverId) {
        await deleteUserTemplate(gen._serverId);
      }
    }
    setGenerated((prev) => prev.filter((g) => !ids.includes(g.id)));
    setGeneratedSelected([]);
  }, [generated]);

  const handleOpenGenerated = useCallback(async (report) => {
    // Re-fetch data from Traccar API
    setLoading(true);
    try {
      const data = await refetchReportData(report);

      // Check if this is a graphical report - show in dialog
      if (isGraphicalReport(report.type)) {
        setChartData(data);
        setChartTemplate(report);
        setChartDateFrom(report.dateFrom);
        setChartDateTo(report.dateTo);
        setChartOpen(true);
        setLoading(false);
        return;
      }

      // For non-graphical reports, download directly
      const fmt = report.format || 'html';
      const html = buildHtmlReport(data, report, deviceList, report.dateFrom, report.dateTo);
      const rt = REPORT_TYPE_MAP[report.type];
      const reportLabel = rt?.label || report.type;

      // Generate PDF document if format is pdf
      let pdfDoc = null;
      if (fmt === 'pdf') {
        pdfDoc = generatePdfFromData(data, report, deviceList, report.dateFrom, report.dateTo, reportLabel);
      }

      downloadReportFile(html, report.name, report.dateFrom, report.dateTo, fmt, pdfDoc);
    } catch (err) {
      console.error('Failed to open report:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceList]);

  const handleDownloadGenerated = useCallback(async (report) => {
    setLoading(true);
    try {
      const fmt = report.format || 'html';
      const data = await refetchReportData(report);
      const html = buildHtmlReport(data, report, deviceList, report.dateFrom, report.dateTo);
      const rt = REPORT_TYPE_MAP[report.type];
      const reportLabel = rt?.label || report.type;

      // Generate PDF document if format is pdf
      let pdfDoc = null;
      if (fmt === 'pdf') {
        pdfDoc = generatePdfFromData(data, report, deviceList, report.dateFrom, report.dateTo, reportLabel);
      }

      downloadReportFile(html, report.name, report.dateFrom, report.dateTo, fmt, pdfDoc);
    } catch (err) {
      console.error('Failed to download report:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceList]);

  /* ── Toggle helpers ── */
  const onToggleTemplateAll = useCallback(() => {
    setTemplateSelected((prev) => (prev.length === filteredTemplates.length ? [] : filteredTemplates.map((t) => t.id)));
  }, [filteredTemplates]);

  const onToggleTemplate = useCallback((id) => {
    setTemplateSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const onToggleGeneratedAll = useCallback(() => {
    setGeneratedSelected((prev) => (prev.length === filteredGenerated.length ? [] : filteredGenerated.map((g) => g.id)));
  }, [filteredGenerated]);

  const onToggleGenerated = useCallback((id) => {
    setGeneratedSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* ── Open add/edit dialog ── */
  const openAdd = useCallback(() => { setEditTemplate(null); setPropsOpen(true); }, []);
  const openEdit = useCallback((row) => { setEditTemplate(row); setPropsOpen(true); }, []);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 900, height: 600 } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2" component="span">Reports</Typography>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} className={classes.tabs}>
          <Tab label="Reports" />
          <Tab label="Generated" />
        </Tabs>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={1} sx={{ borderBottom: '1px solid #e0e0e0' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" sx={{ ml: 1, fontSize: '11px' }}>Generating report…</Typography>
            </Box>
          )}

          {/* ════════ Tab 0: Reports (Templates) – CustomTable ════════ */}
          {tab === 0 && (
            <CustomTable
              rows={filteredTemplates}
              columns={templateColumns}
              loading={false}
              selected={templateSelected}
              onToggleAll={onToggleTemplateAll}
              onToggleRow={onToggleTemplate}
              onEdit={openEdit}
              onDelete={handleDeleteTemplate}
              search={templateSearch}
              onSearchChange={setTemplateSearch}
              onAdd={openAdd}
              onRefresh={handleRefresh}
              onOpenSettings={() => {}}
              onBulkDelete={handleBulkDeleteTemplates}
              customActions={(row) => (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    menuTemplateRef.current = row;
                    setMenuAnchor(e.currentTarget);
                  }}
                  title="Generate"
                  disabled={loading}
                  sx={{ padding: '2px' }}
                >
                  <SettingsIcon sx={{ fontSize: 14, color: '#4a90e2' }} />
                </IconButton>
              )}
            />
          )}

          {/* ════════ Tab 1: Generated – CustomTable (V1: file icon + delete only) ════════ */}
          {tab === 1 && (
            <CustomTable
              rows={filteredGenerated}
              columns={generatedColumns}
              loading={false}
              selected={generatedSelected}
              onToggleAll={onToggleGeneratedAll}
              onToggleRow={onToggleGenerated}
              onDelete={handleDeleteGenerated}
              search={generatedSearch}
              onSearchChange={setGeneratedSearch}
              onAdd={openAdd}
              onRefresh={handleRefresh}
              onOpenSettings={() => {}}
              onBulkDelete={handleBulkDeleteGenerated}
              hideEdit
              customActions={(row) => (
                <>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenGenerated(row)}
                    title="Open Report"
                    disabled={loading}
                    sx={{ padding: '2px' }}
                  >
                    <DescriptionIcon sx={{ fontSize: 14, color: '#4a90e2' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDownloadGenerated(row)}
                    title="Download Report"
                    disabled={loading}
                    sx={{ padding: '2px' }}
                  >
                    <DownloadIcon sx={{ fontSize: 14, color: '#4a90e2' }} />
                  </IconButton>
                </>
              )}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Gear dropdown menu: time filter quick-generate (V1 parity) ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              minWidth: 170,
              borderRadius: 0,
              backgroundColor: '#ffffff',
              boxShadow: '3px 0 5px 0 #9b9b9b',
              '& .MuiList-root': { padding: 0 },
            },
          },
        }}
      >
        {TIME_FILTERS.filter((f) => f.id).map((f, i) => (
          <MenuItem
            key={f.id}
            onClick={() => handleQuickGenerate(f.id)}
            disabled={loading}
            sx={{
              borderTop: i === 0 ? '3px solid #2b82d4' : '1px solid #f5f5f5',
              py: '5px',
              px: '15px',
              minHeight: 'auto',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            <Typography sx={{ fontSize: '13px', color: '#444' }}>
              {f.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* ── Report Properties (Add/Edit) ── */}
      <ReportPropertiesDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        onSave={handleSaveTemplate}
        onGenerate={handleGenerate}
        template={editTemplate}
        devices={deviceList}
        geofences={geofenceList}
        markers={markers}
      />

      {/* ── Chart Dialog for Graphical Reports ── */}
      <ChartReportDialog
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        data={chartData}
        template={chartTemplate}
        devices={deviceList}
        dateFrom={chartDateFrom}
        dateTo={chartDateTo}
        loading={false}
      />
    </>
  );
};

export default ReportsDialog;
