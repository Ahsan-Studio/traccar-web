import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CustomTable } from "../../common/components/custom";

const GroupedMarkersTable = ({
  rows,
  columns,
  loading,
  selected,
  onToggleAll,
  onToggleRow,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  onAdd,
  onOpenGroups,
  onOpenSettings,
  groups,
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});

  // Group markers by groupId
  const groupedMarkers = useMemo(() => {
    const grouped = {};
    rows.forEach((marker) => {
      const groupId = marker.groupId || 0;
      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(marker);
    });
    return grouped;
  }, [rows]);

  // Sort group keys: Ungrouped (0) first, then others by name
  const sortedGroupIds = useMemo(() => {
    const ids = Object.keys(groupedMarkers).map(Number);
    return ids.sort((a, b) => {
      if (a === 0) return -1; // Ungrouped first
      if (b === 0) return 1;
      const nameA = groups[a] || "";
      const nameB = groups[b] || "";
      return nameA.localeCompare(nameB);
    });
  }, [groupedMarkers, groups]);

  const handleAccordionChange = (groupId) => (event, isExpanded) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: isExpanded,
    }));
  };

  // Toggle all groups expand/collapse
  const toggleAllGroups = () => {
    const allExpanded = sortedGroupIds.every((id) => expandedGroups[id]);
    const newState = {};
    sortedGroupIds.forEach((id) => {
      newState[id] = !allExpanded;
    });
    setExpandedGroups(newState);
  };

  // If no grouping (all ungrouped), show regular table
  if (sortedGroupIds.length === 1 && sortedGroupIds[0] === 0) {
    return (
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
        onSearchChange={onSearchChange}
        onAdd={onAdd}
        onOpenGroups={onOpenGroups}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Header with search and actions - reuse CustomTable header */}
      <CustomTable
        rows={[]} // Empty rows, just use header
        columns={columns}
        loading={loading}
        selected={selected}
        onToggleAll={onToggleAll}
        onToggleRow={onToggleRow}
        onEdit={onEdit}
        onDelete={onDelete}
        search={search}
        onSearchChange={onSearchChange}
        onAdd={onAdd}
        onOpenGroups={onOpenGroups}
        onOpenSettings={onOpenSettings}
        hideTable={true} // We'll render grouped view below
      />

      {/* Grouped Accordions */}
      <Box sx={{ mt: 2, px: 2, pb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Typography
            variant="caption"
            sx={{ cursor: "pointer", color: "primary.main" }}
            onClick={toggleAllGroups}
          >
            {sortedGroupIds.every((id) => expandedGroups[id])
              ? "Collapse All"
              : "Expand All"}
          </Typography>
        </Box>

        {sortedGroupIds.map((groupId) => {
          const groupMarkers = groupedMarkers[groupId];
          const groupName = groups[groupId] || "Unknown Group";
          const groupCount = groupMarkers.length;

          return (
            <Accordion
              key={groupId}
              expanded={expandedGroups[groupId] || false}
              onChange={handleAccordionChange(groupId)}
              sx={{
                mb: 1,
                "&:before": { display: "none" },
                boxShadow: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: "action.hover",
                  "&:hover": { backgroundColor: "action.selected" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    pr: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="medium">
                    {groupName}
                  </Typography>
                  <Chip
                    label={`${groupCount} marker${groupCount !== 1 ? "s" : ""}`}
                    size="small"
                    color={groupId === 0 ? "default" : "primary"}
                  />
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <CustomTable
                  rows={groupMarkers}
                  columns={columns}
                  loading={false}
                  selected={selected}
                  onToggleAll={() => {}} // Handle per-group selection
                  onToggleRow={onToggleRow}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  search=""
                  onSearchChange={() => {}}
                  hideHeader={true} // Hide header in nested table
                  hideActions={true} // Hide add/groups buttons
                />
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default GroupedMarkersTable;
