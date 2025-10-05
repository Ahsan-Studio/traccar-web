import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CustomTable } from "../../common/components/custom";
import EditGroupDialog from "./EditGroupDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { groupsActions, devicesActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";

const GroupsTab = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);

  // Convert groups object to array and calculate device count
  const groupList = useMemo(() => {
    const groupsArray = Object.values(groups);
    const devicesArray = Object.values(devices);
    
    // Calculate device count for each group
    return groupsArray.map(group => {
      const deviceCount = devicesArray.filter(device => device.groupId === group.id).length;
      return {
        ...group,
        deviceCount
      };
    });
  }, [groups, devices]);

  // Filter groups based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupList;
    
    const query = searchTerm.toLowerCase();
    return groupList.filter((group) =>
      group.name?.toLowerCase().includes(query)
    );
  }, [groupList, searchTerm]);

  // Define columns for CustomTable
  const columns = [
    { key: "name", label: "Name" },
    { key: "deviceCount", label: "Objects" },
    { 
      key: "description", 
      label: "Description",
      render: (row) => row.attributes?.description || "-"
    },
  ];

  const handleToggleAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map((g) => g.id));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setEditDialogOpen(true);
  };

  const handleDelete = (group) => {
    setRemovingId(group.id);
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setEditDialogOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Refresh both groups and devices to get accurate device count
      const [groupsResponse, devicesResponse] = await Promise.all([
        fetchOrThrow('/api/groups'),
        fetchOrThrow('/api/devices')
      ]);
      
      const groupsData = await groupsResponse.json();
      const devicesData = await devicesResponse.json();
      
      dispatch(groupsActions.refresh(groupsData));
      dispatch(devicesActions.refresh(devicesData));
    } catch (error) {
      console.error('Failed to refresh groups and devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingGroup(null);
  };

  return (
    <>
      <CustomTable
        rows={filteredGroups}
        columns={columns}
        selected={selectedGroups}
        onToggleAll={handleToggleAll}
        onToggleRow={handleToggleRow}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        loading={loading}
        showSearch={true}
        search={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {editDialogOpen && (
        <EditGroupDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          group={editingGroup}
          onGroupSaved={handleRefresh}
        />
      )}

      <RemoveDialog
        open={!!removingId}
        endpoint="groups"
        itemId={removingId}
        onResult={(removed) => {
          const id = removingId;
          setRemovingId(null);
          if (removed && id != null) {
            dispatch(groupsActions.remove(id));
            setSelectedGroups((prev) => prev.filter((g) => g !== id));
          }
        }}
      />
    </>
  );
};

export default GroupsTab;
