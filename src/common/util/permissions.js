import { useSelector } from 'react-redux';

export const useAdministrator = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  return admin;
});

export const useManager = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  return admin || manager;
});

export const useDeviceReadonly = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const serverReadonly = state.session.server.readonly;
  const userReadonly = state.session.user.readonly;
  const serverDeviceReadonly = state.session.server.deviceReadonly;
  const userDeviceReadonly = state.session.user.deviceReadonly;
  return !admin && (serverReadonly || userReadonly || serverDeviceReadonly || userDeviceReadonly);
});

export const useRestriction = (key) => useSelector((state) => {
  const admin = state.session.user.administrator;
  const serverValue = state.session.server[key];
  const userValue = state.session.user[key];
  return !admin && (serverValue || userValue);
});

// Hook to check if user is a sub-account (V1 parity)
// Sub-accounts have deviceReadonly=true and cannot edit objects
export const useSubAccount = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const userDeviceReadonly = state.session.user.deviceReadonly;
  const userReadonly = state.session.user.readonly;
  // Sub-account is identified by: not admin AND (deviceReadonly OR readonly)
  return !admin && (userDeviceReadonly || userReadonly);
});

// Hook to check if user can edit objects (not a sub-account)
export const useCanEdit = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const userDeviceReadonly = state.session.user.deviceReadonly;
  const userReadonly = state.session.user.readonly;
  // Can edit if admin OR not readonly AND not deviceReadonly
  return admin || (!userDeviceReadonly && !userReadonly);
});

// Sub-account permission hooks
// For admin/manager: always return true (full access)
// For sub-accounts: return the specific permission value from user object

export const usePermissionDashboard = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.dashboard ?? false;
});

export const usePermissionHistory = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.history ?? false;
});

export const usePermissionReports = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.reports ?? false;
});

export const usePermissionTasks = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.tasks ?? false;
});

export const usePermissionRilogbook = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.rilogbook ?? false;
});

export const usePermissionDtc = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.dtc ?? false;
});

export const usePermissionMaintenance = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.maintenance ?? false;
});

export const usePermissionExpenses = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.expenses ?? false;
});

export const usePermissionObjectControl = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.objectControl ?? false;
});

export const usePermissionImageGallery = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.imageGallery ?? false;
});

export const usePermissionChat = () => useSelector((state) => {
  const admin = state.session.user.administrator;
  const manager = (state.session.user.userLimit || 0) !== 0;
  if (admin || manager) return true;
  return state.session.user.chat ?? false;
});
