import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useSelector } from "react-redux";

const useStyles = makeStyles()((theme) => ({
  tableContainer: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    height: "24px",
  },
  headerCell: {
    fontSize: "12px",
    color: "#444444",
    fontWeight: "normal",
    padding: "0px 8px",
    height: "24px",
    border: "none",
  },
  dataHeaderCell: {
    width: "170px",
  },
  infoHeaderCell: {
    width: "100%",
  },
  tableRow: {
    height: "19px",
    borderBottom: "1px solid #f5f5f5",
  },
  dataCell: {
    fontSize: "11px",
    color: "#333",
    padding: "0px 8px",
    height: "19px",
    width: "100%",
    border: "none",
    verticalAlign: "middle",
  },
  valueCell: {
    fontSize: "11px",
    color: "#333",
    padding: "0px 8px",
    height: "19px",
    width: "100%",
    border: "none",
    verticalAlign: "middle",
  },
  refreshIcon: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    cursor: "pointer",
    color: "#666",
    "&:hover": {
      color: "#333",
    },
  },
}));

const InfoTab = ({ device }) => {
  const { classes } = useStyles();
  
  // Get position data from Redux store like DeviceInfoPanel does
  const position = useSelector((state) => state.session.positions[device?.id]);


  const infoData = [
    { label: "Kecepatan", value: position ? `${position.speed.toFixed(0)} kph` : "N/A" },
    { label: "Ketinggian", value: position ? `${position.altitude.toFixed(0)} m` : "N/A" },
    { label: "Latitude", value: position ? `${position.latitude.toFixed(6)}°` : "N/A" },
    { label: "Longitude", value: position ? `${position.longitude.toFixed(6)}°` : "N/A" },
    { label: "Parameters", value: position?.attributes ? JSON.stringify(position.attributes) : "" },
    { label: "Protocol", value: position?.protocol || "N/A" },
    { label: "Sudut", value: position ? `${position.course.toFixed(0)}°` : "N/A" },
    { label: "Waktu (posisi)", value: position ? new Date(position.deviceTime).toLocaleString("id-ID") : "N/A" },
    { label: "Waktu (server)", value: position ? new Date(position.serverTime).toLocaleString("id-ID") : "N/A" },
  ];

  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table className={classes.table}>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={`${classes.headerCell} ${classes.dataHeaderCell}`} style={{ minWidth: "170px" }}>
                Data
              </TableCell>
              <TableCell className={`${classes.headerCell} ${classes.infoHeaderCell}`}>
                Nilai
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {infoData.map((row, index) => (
              <TableRow key={index} className={classes.tableRow}>
                <TableCell className={classes.dataCell} style={{ width: "170px" }}>
                  {row.label}
                </TableCell>
                <TableCell className={classes.valueCell}>
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Refresh Icon */}
      <Box className={classes.refreshIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </Box>
    </Box>
  );
};

export default InfoTab;
