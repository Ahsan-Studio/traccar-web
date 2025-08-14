import { useEffect, useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  Button,
  TextField,
  Link,
  Snackbar,
  IconButton,
  Tooltip,
  Box,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ReactCountryFlag from "react-country-flag";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import QrCode2Icon from "@mui/icons-material/QrCode2";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sessionActions } from "../store";
import {
  useLocalization,
  useTranslation,
} from "../common/components/LocalizationProvider";
import LoginLayout from "./LoginLayout";
import usePersistedState from "../common/util/usePersistedState";
import {
  generateLoginToken,
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from "../common/components/NativeInterface";

import { useCatch } from "../reactHelper";
import QrCodeDialog from "../common/components/QrCodeDialog";
import fetchOrThrow from "../common/util/fetchOrThrow";

const useStyles = makeStyles()((theme) => ({
  options: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(1),
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(3),
    width: "100%",
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(2),
    },
  },
  extraContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    color: "#444444",
    fontSize: "11px",
    gap: theme.spacing(0.4),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(2),
      flexDirection: "column",
      alignItems: "center",
    },
  },
  registerButton: {
    minWidth: "unset",
  },
  link: {
    cursor: "pointer",
    color: "#676767",
    fontSize: "11px",
    fontWeight: "bold",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  serverInfo: {
    textAlign: "center",
    marginTop: theme.spacing(3),
    color: "#666666",
    fontSize: "0.875rem",
    "& a": {
      color: "#4B89DC",
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
      },
    },
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(2),
      fontSize: "0.8rem",
    },
  },
  inputField: {
    "& .MuiInputBase-input.MuiOutlinedInput-input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px transparent inset !important",
      WebkitTextFillColor: "#444444 !important",
      caretColor: "#444444",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f5f5f5",
      [theme.breakpoints.down("sm")]: {
        fontSize: "0.9rem",
      },
      border: "1px solid #f5f5f5",
      color: "#444444",
      fontSize: "11px",
      height: "40px",
    },
    "& .MuiInputLabel-root": {
      color: "#666666",
      [theme.breakpoints.down("sm")]: {
        fontSize: "0.9rem",
      },
    },
    "& .MuiInputAdornment-root": {
      color: "#666666",
      [theme.breakpoints.down("sm")]: {
        "& .MuiSvgIcon-root": {
          fontSize: "1.2rem",
        },
      },
    },
  },
  loginButton: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    fontSize: "11px",
    fontWeight: 500,
    height: "50px",
    backgroundColor: "#2b82d4",
    color: "white",
    "&:hover": {
      backgroundColor: "#3875C5",
    },
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.25),
      fontSize: "0.95rem",
      marginTop: theme.spacing(1.5),
    },
  },
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const t = useTranslation();

  const { languages, language, setLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({
    code: values[0],
    country: values[1].country,
    name: values[1].name,
  }));

  const [failed, setFailed] = useState(false);

  const [email, setEmail] = usePersistedState("loginEmail", "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showServerTooltip, setShowServerTooltip] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };

  const languageEnabled = useSelector((state) => {
    const attributes = state.session.server.attributes;
    return !attributes.language && !attributes["ui.disableLoginLanguage"];
  });
  const changeEnabled = useSelector(
    (state) => !state.session.server.attributes.disableChange
  );
  const openIdEnabled = useSelector(
    (state) => state.session.server.openIdEnabled
  );
  const openIdForced = useSelector(
    (state) =>
      state.session.server.openIdEnabled && state.session.server.openIdForce
  );
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector(
    (state) => state.session.server.announcement
  );

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`;
      const response = await fetch("/api/session", {
        method: "POST",
        body: new URLSearchParams(
          code.length ? `${query}&code=${code}` : query
        ),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem("postLogin") || "/";
        window.sessionStorage.removeItem("postLogin");
        navigate(target, { replace: true });
      } else if (
        response.status === 401 &&
        response.headers.get("WWW-Authenticate") === "TOTP"
      ) {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword("");
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetchOrThrow(
      `/api/session?token=${encodeURIComponent(token)}`
    );
    const user = await response.json();
    dispatch(sessionActions.updateUser(user));
    navigate("/");
  });

  const handleOpenIdLogin = () => {
    document.location = "/api/session/openid/auth";
  };

  useEffect(() => nativePostMessage("authentication"), []);

  useEffect(() => {
    const listener = (token) => handleTokenLogin(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem("hostname") !== window.location.hostname) {
      window.localStorage.setItem("hostname", window.location.hostname);
      setShowServerTooltip(true);
    }
  }, []);

  return (
    <LoginLayout>
      <div className={classes.options}>
        {nativeEnvironment && changeEnabled && (
          <IconButton
            color="primary"
            onClick={() => navigate("/change-server")}
          >
            <Tooltip
              title={`${t("settingsServer")}: ${window.location.hostname}`}
              open={showServerTooltip}
              arrow
            >
              <VpnLockIcon />
            </Tooltip>
          </IconButton>
        )}
        {!nativeEnvironment && (
          <IconButton color="primary" onClick={() => setShowQr(true)}>
            <QrCode2Icon />
          </IconButton>
        )}
        {languageEnabled && (
          <FormControl>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <Box component="span" sx={{ mr: 1 }}>
                    <ReactCountryFlag countryCode={it.country} svg />
                  </Box>
                  {it.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      <div className={classes.container}>
        {!openIdForced && (
          <>
            <TextField
              required
              error={failed}
              placeholder="Username"
              name="email"
              value={email}
              autoComplete="email"
              autoFocus={!email}
              onChange={(e) => setEmail(e.target.value)}
              helperText={failed && "Invalid username or password"}
              fullWidth
              variant="outlined"
              className={classes.inputField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              required
              error={failed}
              placeholder="Password"
              name="password"
              value={password}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoFocus={!!email}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              variant="outlined"
              className={classes.inputField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "hide the password"
                          : "display the password"
                      }
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      onMouseUp={handleMouseUpPassword}
                      edge="end"
                      color="primary"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {codeEnabled && (
              <TextField
                required
                error={failed}
                label={t("loginTotpCode")}
                name="code"
                value={code}
                type="number"
                onChange={(e) => setCode(e.target.value)}
                fullWidth
                variant="outlined"
                className={classes.inputField}
              />
            )}
            <Button
              onClick={handlePasswordLogin}
              type="submit"
              variant="contained"
              fullWidth
              className={classes.loginButton}
            >
              Login
            </Button>
          </>
        )}
        {openIdEnabled && (
          <Button
            onClick={() => handleOpenIdLogin()}
            variant="contained"
            color="primary"
            fullWidth
            className={classes.loginButton}
          >
            {t("loginOpenId")}
          </Button>
        )}
        <div className={classes.extraContainer}>
          <Link
            onClick={() => navigate("/reset-password")}
            className={classes.link}
            underline="none"
          >
            Recover password
          </Link>
          or
          <Link
            onClick={() => navigate("/register")}
            className={classes.link}
            underline="none"
          >
            create account
          </Link>
        </div>
      </div>
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setAnnouncementShown(true)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </LoginLayout>
  );
};

export default LoginPage;
