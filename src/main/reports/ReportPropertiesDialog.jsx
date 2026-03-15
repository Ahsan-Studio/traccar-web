import { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import {
  CustomSelect, CustomCheckbox, CustomInput, CustomButton, CustomMultiSelect,
} from '../../common/components/custom';
import {
  TYPE_OPTIONS,
  FORMAT_SELECT_OPTIONS,
  TIME_FILTER_OPTIONS,
  STOP_DURATION_OPTIONS,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  emptyTemplate,
  DATA_ITEMS,
  DATA_ITEM_LABELS,
} from './reportConstants';
import { useReportStyles } from './useReportStyles';
import { applyTimeFilter } from './reportUtils';

/* ─────────── Get available sensors from selected devices ─────────── */
const getAvailableSensors = (devices, selectedDeviceIds) => {
  const sensors = [];
  const sensorSet = new Set();

  selectedDeviceIds.forEach((deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
    if (device?.attributes?.sensors) {
      device.attributes.sensors.forEach((sensor) => {
        const key = sensor.name || sensor.id;
        if (!sensorSet.has(key)) {
          sensorSet.add(key);
          sensors.push({
            value: sensor.name || sensor.id,
            label: sensor.name || sensor.id,
            type: sensor.type,
          });
        }
      });
    }
    // Also check for computed attributes
    if (device?.attributes) {
      Object.keys(device.attributes).forEach((key) => {
        if (!sensorSet.has(key) && !['id', 'name', 'uniqueId', 'status', 'disabled', 'lastUpdate', 'positionId', 'groupId', 'phone', 'model', 'contact', 'category', 'attributes'].includes(key)) {
          sensorSet.add(key);
          sensors.push({
            value: key,
            label: key,
          });
        }
      });
    }
  });

  return sensors;
};

/* ─────────── Get data items options based on report type ─────────── */
const getDataItemsOptions = (reportType) => {
  const items = DATA_ITEMS[reportType] || DATA_ITEMS.general;
  return items.map((item) => ({
    value: item,
    label: DATA_ITEM_LABELS[item] || item,
  }));
};

const ReportPropertiesDialog = ({
  open, onClose, onSave, onGenerate, template, devices, geofences, markers,
}) => {
  const { classes } = useReportStyles();
  const [form, setForm] = useState(emptyTemplate());

  useEffect(() => {
    if (open) {
      if (template) {
        setForm({ ...emptyTemplate(), ...template });
      } else {
        const t = emptyTemplate();
        const { from, to } = applyTimeFilter('today');
        t.dateFrom = from;
        t.dateTo = to;
        setForm(t);
      }
    }
  }, [open, template]);

  /* helpers – CustomSelect passes value directly, CustomInput passes event */
  const setVal = (key) => (v) => setForm((prev) => ({ ...prev, [key]: v }));
  const setEvent = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFilterChange = (fid) => {
    setForm((prev) => {
      const { from, to } = fid ? applyTimeFilter(fid) : { from: prev.dateFrom, to: prev.dateTo };
      return { ...prev, timeFilter: fid, dateFrom: from, dateTo: to };
    });
  };

  /* When report type changes, reset data items to default */
  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      type,
      dataItems: [], // Reset data items when type changes
      sensorIds: [], // Reset sensors when type changes
    }));
  };

  const handleSave = () => { onSave(form); onClose(); };
  const handleGenerate = () => {
    if (!form.deviceIds || form.deviceIds.length === 0) {
      alert('Please select at least 1 object/device.');
      return;
    }
    onGenerate({ ...form, format: form.format || 'html' });
    onClose();
  };

  const deviceOptions = useMemo(() => devices.map((d) => ({ value: d.id, label: d.name })), [devices]);
  const zoneOptions = useMemo(() => geofences.map((g) => ({ value: g.id, label: g.name })), [geofences]);
  const markerOptions = useMemo(() => (markers || []).map((m) => ({ value: m.id, label: m.name })), [markers]);

  /* Get available sensors from selected devices */
  const sensorOptions = useMemo(
    () => getAvailableSensors(devices, form.deviceIds || []),
    [devices, form.deviceIds],
  );

  /* Get data items options based on report type */
  const dataItemsOptions = useMemo(
    () => getDataItemsOptions(form.type),
    [form.type],
  );

  /* Check if sensors should be shown for this report type */
  const showSensors = useMemo(() => {
    const sensorTypes = ['drives_stops_sensors', 'drives_stops_logic', 'logic_sensors', 'sensor_graph', 'route_data_sensors'];
    return sensorTypes.includes(form.type);
  }, [form.type]);

  /* Check if data items should be shown for this report type */
  const showDataItems = useMemo(() => {
    const dataItemsTypes = DATA_ITEMS[form.type];
    return dataItemsTypes && dataItemsTypes.length > 0;
  }, [form.type]);

  /* Check if markers should be shown for this report type */
  const showMarkers = useMemo(() => {
    const markerTypes = ['marker_in_out', 'marker_in_out_gen'];
    return markerTypes.includes(form.type);
  }, [form.type]);

  /* Check if zones should be shown for this report type */
  const showZones = useMemo(() => {
    const zoneTypes = ['zone_in_out', 'zone_in_out_general'];
    return zoneTypes.includes(form.type);
  }, [form.type]);

  /* Check if day/night config should be shown for this report type */
  const showDayNight = useMemo(() => form.type === 'travel_sheet_dn', [form.type]);

  /* Check if RAG score config should be shown for this report type */
  const showRagConfig = useMemo(() => ['rag', 'rag_driver'].includes(form.type), [form.type]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 680, maxHeight: '90vh' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2" component="span">Report Properties</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, mt: 1 }}>
        {/* ── "Report" section header ── */}
        <Box sx={{ px: 1.5 }}>
          <div className={classes.propSection}>Report</div>
        </Box>

        <Box display="flex">
          {/* ── Left column ── */}
          <Box className={classes.propCol}>
            <div className={classes.propRow}>
              <span className="lbl">Name</span>
              <div className="val">
                <CustomInput value={form.name} onChange={setEvent('name')} placeholder="Report name" style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Type</span>
              <div className="val">
                <CustomSelect value={form.type} onChange={handleTypeChange} options={TYPE_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Objects</span>
              <div className="val">
                <CustomMultiSelect
                  value={form.deviceIds}
                  onChange={setVal('deviceIds')}
                  options={deviceOptions}
                  placeholder="Nothing selected"
                />
              </div>
            </div>

            {showZones && (
              <div className={classes.propRow}>
                <span className="lbl">Zones</span>
                <div className="val">
                  <CustomMultiSelect
                    value={form.zoneIds}
                    onChange={setVal('zoneIds')}
                    options={zoneOptions}
                    placeholder="Nothing selected"
                  />
                </div>
              </div>
            )}

            {showMarkers && (
              <div className={classes.propRow}>
                <span className="lbl">Markers</span>
                <div className="val">
                  <CustomMultiSelect
                    value={form.markerIds}
                    onChange={setVal('markerIds')}
                    options={markerOptions}
                    placeholder={markerOptions.length > 0 ? 'Select markers' : 'No markers available'}
                  />
                </div>
              </div>
            )}

            {showSensors && (
              <div className={classes.propRow}>
                <span className="lbl">Sensors</span>
                <div className="val">
                  <CustomMultiSelect
                    value={form.sensorIds}
                    onChange={setVal('sensorIds')}
                    options={sensorOptions}
                    placeholder={sensorOptions.length > 0 ? 'Select sensors' : 'No sensors available'}
                  />
                </div>
              </div>
            )}

            {showDataItems && (
              <div className={classes.propRow}>
                <span className="lbl">Data items</span>
                <div className="val">
                  <CustomMultiSelect
                    value={form.dataItems}
                    onChange={setVal('dataItems')}
                    options={dataItemsOptions}
                    placeholder="All items included"
                  />
                </div>
              </div>
            )}

            <div className={classes.propRow}>
              <span className="lbl">Ignore empty reports</span>
              <div className="val">
                <CustomCheckbox checked={form.ignoreEmpty} onChange={setVal('ignoreEmpty')} />
              </div>
            </div>
          </Box>

          {/* ── Right column ── */}
          <Box className={classes.propCol}>
            <div className={classes.propRow}>
              <span className="lbl">Format</span>
              <div className="val">
                <CustomSelect value={form.format} onChange={setVal('format')} options={FORMAT_SELECT_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Show coordinates</span>
              <div className="val">
                <CustomCheckbox checked={form.showCoordinates} onChange={setVal('showCoordinates')} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Show addresses</span>
              <div className="val">
                <CustomCheckbox checked={form.showAddresses} onChange={setVal('showAddresses')} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Zones instead of addresses</span>
              <div className="val">
                <CustomCheckbox checked={form.zonesAddresses} onChange={setVal('zonesAddresses')} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Stops</span>
              <div className="val">
                <CustomSelect value={form.stopDuration} onChange={setVal('stopDuration')} options={STOP_DURATION_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Speed limit (kph)</span>
              <div className="val">
                <CustomInput type="number" value={form.speedLimit} onChange={setEvent('speedLimit')} placeholder="0" style={{ width: '100%' }} />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Schedule (left) + Time period (right) – V1 two-column layout ── */}
        <Box display="flex">
          <Box className={classes.propCol}>
            <div className={classes.propSection}>Schedule</div>
            <div className={classes.propRow}>
              <span className="lbl">Daily</span>
              <div className="val"><CustomCheckbox checked={form.daily} onChange={setVal('daily')} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Weekly</span>
              <div className="val"><CustomCheckbox checked={form.weekly} onChange={setVal('weekly')} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Send to e-mail</span>
              <div className="val">
                <CustomInput value={form.scheduleEmail} onChange={setEvent('scheduleEmail')} placeholder="E-mail address" style={{ width: '100%' }} />
              </div>
            </div>
          </Box>

          <Box className={classes.propCol}>
            <div className={classes.propSection}>Time period</div>
            <div className={classes.propRow}>
              <span className="lbl">Filter</span>
              <div className="val">
                <CustomSelect value={form.timeFilter} onChange={handleFilterChange} options={TIME_FILTER_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Time from</span>
              <div className="val">
                <CustomInput type="datetime-local" value={form.dateFrom} onChange={setEvent('dateFrom')} style={{ width: '100%' }} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Time to</span>
              <div className="val">
                <CustomInput type="datetime-local" value={form.dateTo} onChange={setEvent('dateTo')} style={{ width: '100%' }} />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Day/Night configuration for travel_sheet_dn ── */}
        {showDayNight && (
          <Box display="flex">
            <Box className={classes.propCol}>
              <div className={classes.propSection}>Day/Night Configuration</div>
              <div className={classes.propRow}>
                <span className="lbl">Night starts</span>
                <div className="val" style={{ display: 'flex', gap: 4 }}>
                  <CustomSelect value={form.nightStartHour} onChange={setVal('nightStartHour')} options={HOUR_OPTIONS} style={{ width: 60 }} />
                  <span style={{ lineHeight: '28px' }}>:</span>
                  <CustomSelect value={form.nightStartMinute} onChange={setVal('nightStartMinute')} options={MINUTE_OPTIONS} style={{ width: 60 }} />
                </div>
              </div>
            </Box>
            <Box className={classes.propCol}>
              <div className={classes.propSection} style={{ visibility: 'hidden' }}>Day/Night</div>
              <div className={classes.propRow}>
                <span className="lbl">Night ends</span>
                <div className="val" style={{ display: 'flex', gap: 4 }}>
                  <CustomSelect value={form.nightEndHour} onChange={setVal('nightEndHour')} options={HOUR_OPTIONS} style={{ width: 60 }} />
                  <span style={{ lineHeight: '28px' }}>:</span>
                  <CustomSelect value={form.nightEndMinute} onChange={setVal('nightEndMinute')} options={MINUTE_OPTIONS} style={{ width: 60 }} />
                </div>
              </div>
            </Box>
          </Box>
        )}

        {/* ── RAG score configuration for driver behavior reports ── */}
        {showRagConfig && (
          <Box display="flex">
            <Box className={classes.propCol}>
              <div className={classes.propSection}>Driver Behavior RAG</div>
              <div className={classes.propRow}>
                <span className="lbl">Lowest score</span>
                <div className="val">
                  <CustomInput type="number" value={form.ragLowScore} onChange={setEvent('ragLowScore')} placeholder="0" style={{ width: '100%' }} />
                </div>
              </div>
            </Box>
            <Box className={classes.propCol}>
              <div className={classes.propSection} style={{ visibility: 'hidden' }}>RAG</div>
              <div className={classes.propRow}>
                <span className="lbl">Highest score</span>
                <div className="val">
                  <CustomInput type="number" value={form.ragHighScore} onChange={setEvent('ragHighScore')} placeholder="100" style={{ width: '100%' }} />
                </div>
              </div>
            </Box>
          </Box>
        )}

        {/* ── Buttons (V1: Generate, Save, Cancel) ── */}
        <Box display="flex" justifyContent="center" gap={1} py={1.5} sx={{ borderTop: '1px solid #eee' }}>
          <CustomButton variant="contained" color="primary" icon={<BuildIcon style={{ width: 14, height: 14 }} />} onClick={handleGenerate} size="small">
            Generate
          </CustomButton>
          <CustomButton variant="contained" color="primary" icon={<SaveIcon style={{ width: 14, height: 14 }} />} onClick={handleSave} size="small">
            Save
          </CustomButton>
          <CustomButton variant="outlined" icon={<CloseIcon style={{ width: 14, height: 14 }} />} onClick={onClose} size="small">
            Cancel
          </CustomButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPropertiesDialog;
