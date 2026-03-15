import { makeStyles } from 'tss-react/mui';

/* ─────────── styles (V1 parity + SettingsDialog tab pattern) ─────────── */
export const useReportStyles = makeStyles()((theme) => ({
  dialogTitle: {
    backgroundColor: '#2a81d4',
    color: 'white',
    padding: '3px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  closeButton: {
    color: 'white',
    padding: '4px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
  },
  tabs: {
    backgroundColor: '#f5f5f5',
    minHeight: '31px !important',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTab-root': {
      marginTop: '6px',
      minHeight: '25px',
      textTransform: 'none',
      fontSize: '12px',
      fontWeight: 'normal',
      padding: '6px 16px',
      color: '#444444',
      borderRadius: 0,
      '&.Mui-selected': {
        backgroundColor: '#ffffff',
        color: '#444444',
      },
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  },
  /* ── Properties dialog ── */
  propRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    '& .lbl': { width: '40%', fontSize: '12px', color: '#333' },
    '& .val': { width: '60%' },
  },
  propCol: {
    flex: 1,
    padding: '0 12px',
  },
  propSection: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2a81d4',
    borderBottom: '1px solid #ddd',
    marginBottom: '8px',
    paddingBottom: '2px',
  },
}));
