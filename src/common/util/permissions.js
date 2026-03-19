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
