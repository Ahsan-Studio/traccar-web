import { Box, Typography, TextField, Grid, Chip } from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  formField: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  infoCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: "#f9f9f9",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
    "&:last-child": {
      marginBottom: 0,
    },
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#666",
  },
  infoValue: {
    fontSize: "12px",
    color: "#333",
  },
  statusChip: {
    height: "20px",
    fontSize: "10px",
    "&.online": {
      backgroundColor: "#4caf50",
      color: "white",
    },
    "&.offline": {
      backgroundColor: "#f44336",
      color: "white",
    },
  },
}));

const InfoTab = ({ formData, onFormDataChange, device }) => {
  const { classes } = useStyles();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status === "online" ? "Online" : "Offline"}
        className={`${classes.statusChip} ${status}`}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Typography className={classes.sectionTitle}>Informasi Device</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Device Information */}
        <Box className={classes.infoCard}>
          <Typography variant="subtitle2" sx={{ fontSize: "12px", fontWeight: 600, marginBottom: 1 }}>
            Informasi Device
          </Typography>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>ID:</span>
            <span className={classes.infoValue}>{device?.id || "N/A"}</span>
          </div>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Status:</span>
            {getStatusChip(device?.status)}
          </div>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Kategori:</span>
            <span className={classes.infoValue}>{device?.category || "N/A"}</span>
          </div>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Disabled:</span>
            <span className={classes.infoValue}>{device?.disabled ? "Ya" : "Tidak"}</span>
          </div>
        </Box>

        {/* Position Information */}
        <Box className={classes.infoCard}>
          <Typography variant="subtitle2" sx={{ fontSize: "12px", fontWeight: 600, marginBottom: 1 }}>
            Informasi Posisi
          </Typography>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Position ID:</span>
            <span className={classes.infoValue}>{device?.positionId || "N/A"}</span>
          </div>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Last Update:</span>
            <span className={classes.infoValue}>{formatDate(device?.lastUpdate)}</span>
          </div>
        </Box>

        {/* Additional Information */}
        <Box className={classes.infoCard}>
          <Typography variant="subtitle2" sx={{ fontSize: "12px", fontWeight: 600, marginBottom: 1 }}>
            Informasi Tambahan
          </Typography>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Group ID:</span>
            <span className={classes.infoValue}>{device?.groupId || "N/A"}</span>
          </div>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Driver ID:</span>
            <span className={classes.infoValue}>{device?.driverId || "N/A"}</span>
          </div>
          
          <div className={classes.infoRow}>
            <span className={classes.infoLabel}>Trailer ID:</span>
            <span className={classes.infoValue}>{device?.trailerId || "N/A"}</span>
          </div>
        </Box>

        {/* Attributes */}
        {device?.attributes && Object.keys(device.attributes).length > 0 && (
          <Box className={classes.infoCard}>
            <Typography variant="subtitle2" sx={{ fontSize: "12px", fontWeight: 600, marginBottom: 1 }}>
              Attributes
            </Typography>
            
            {Object.entries(device.attributes).map(([key, value]) => (
              <div key={key} className={classes.infoRow}>
                <span className={classes.infoLabel}>{key}:</span>
                <span className={classes.infoValue}>{value || "N/A"}</span>
              </div>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InfoTab;
