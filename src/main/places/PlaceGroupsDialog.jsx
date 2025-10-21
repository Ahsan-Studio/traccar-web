import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import { CustomTable } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";
import PlaceGroupDialog from "./PlaceGroupDialog";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "700px",
      maxWidth: "90vw",
      height: "600px",
      maxHeight: "90vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "12px 16px",
    fontSize: "16px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    color: "white",
    padding: "4px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  dialogContent: {
    padding: 0,
    height: "calc(100% - 50px)",
    display: "flex",
    flexDirection: "column",
  },
  toolbar: {
    padding: theme.spacing(2),
    display: "flex",
    gap: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
  },
}));

const PlaceGroupsDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [placesCount, setPlacesCount] = useState({});

  // Fetch groups from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!open) return;
      
      console.log('🔍 PlaceGroupsDialog: Fetching groups...');
      
      try {
        setLoading(true);
        
        // Fetch groups
        const groupsResponse = await fetchOrThrow('/api/geofence-groups', { 
          headers: { Accept: "application/json" } 
        });
        const groupsData = await groupsResponse.json();
        console.log('✅ Groups fetched:', groupsData);
        
        // Fetch all geofences to count places per group
        const geofencesResponse = await fetchOrThrow('/api/geofences', { 
          headers: { Accept: "application/json" } 
        });
        const geofencesData = await geofencesResponse.json();
        console.log('✅ Geofences fetched:', geofencesData);
        
        if (!cancelled) {
          setItems(Array.isArray(groupsData) ? groupsData : []);
          
          // Count markers/routes/zones per group
          const counts = {};
          (Array.isArray(geofencesData) ? geofencesData : []).forEach((geofence) => {
            const gid = geofence.groupId || 0;
            if (!counts[gid]) {
              counts[gid] = { markers: 0, routes: 0, zones: 0 };
            }
            
            // Detect type from area geometry
            let type = geofence.attributes?.type;
            if (!type && geofence.area) {
              if (geofence.area.startsWith('CIRCLE')) type = 'marker';
              else if (geofence.area.startsWith('POLYGON')) type = 'zone';
              else if (geofence.area.startsWith('LINESTRING')) type = 'route';
            }
            
            if (type === 'marker') counts[gid].markers++;
            else if (type === 'zone') counts[gid].zones++;
            else if (type === 'route') counts[gid].routes++;
          });
          
          console.log('📊 Places count:', counts);
          setPlacesCount(counts);
          setSelected((prev) => prev.filter((id) => groupsData.some((r) => r.id === id)));
        }
      } catch (e) {
        if (!cancelled) setItems([]);
        console.error("❌ Error fetching groups:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, refreshVersion]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((it) => 
      (it.name || "").toLowerCase().includes(q) ||
      (it.attributes?.description || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const columns = [
    { 
      key: "name", 
      label: "Name",
      minWidth: 150,
    },
    { 
      key: "id", 
      label: "Places",
      minWidth: 100,
      align: "center",
      format: (value, row) => {
        const count = placesCount[row.id];
        if (!count) return "0/0/0";
        return `${count.markers || 0}/${count.routes || 0}/${count.zones || 0}`;
      }
    },
    { 
      key: "attributes", 
      label: "Description",
      minWidth: 200,
      format: (value) => {
        if (!value) return "";
        return value.description || "";
      }
    },
  ];

  const onToggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const onToggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onAdd = () => {
    setEditing(null);
    setGroupDialogOpen(true);
  };

  const onEdit = (row) => {
    setEditing(row);
    setGroupDialogOpen(true);
  };

  const onDelete = (row) => {
    // Check if group has places
    const count = placesCount[row.id];
    if (count && (count.markers > 0 || count.routes > 0 || count.zones > 0)) {
      const total = count.markers + count.routes + count.zones;
      const confirmed = window.confirm(
        `This group contains ${total} place(s) (${count.markers} markers, ${count.routes} routes, ${count.zones} zones).\n\n` +
        `Deleting this group will move all places to "Ungrouped".\n\n` +
        `Are you sure you want to continue?`
      );
      if (!confirmed) return;
    }
    
    setRemoving(row);
    setRemoveOpen(true);
  };

  const handleGroupDialogClose = (saved) => {
    setGroupDialogOpen(false);
    setEditing(null);
    if (saved) {
      setRefreshVersion((v) => v + 1);
    }
  };

  const handleRemoveResult = async (ok) => {
    if (ok && removing) {
      // After deleting group, need to refresh geofences to show updated groupIds
      // The backend should handle CASCADE update (set groupId=0 for all places)
      setRefreshVersion((v) => v + 1);
    }
    setRemoveOpen(false);
    setRemoving(null);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={() => onClose(false)} 
        className={classes.dialog}
        maxWidth={false}
      >
        <DialogTitle className={classes.dialogTitle}>
          Groups
          <IconButton 
            onClick={() => onClose(false)} 
            className={classes.closeButton} 
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className={classes.dialogContent}>
          <Box className={classes.tableContainer}>
            <CustomTable
              rows={rows}
              columns={columns}
              loading={loading}
              selected={selected}
              onToggleAll={onToggleAll}
              onToggleRow={onToggleRow}
              onEdit={onEdit}
              onDelete={onDelete}
              search={search}
              onSearchChange={setSearch}
              onAdd={onAdd}
              onOpenSettings={() => {}}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <PlaceGroupDialog
        open={groupDialogOpen}
        onClose={handleGroupDialogClose}
        group={editing}
      />

      <RemoveDialog
        open={removeOpen}
        endpoint="geofence-groups"
        itemId={removing?.id}
        onResult={handleRemoveResult}
      />
    </>
  );
};

export default PlaceGroupsDialog;
