import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

export const getSecondaryAuth = () => {
  const secondaryAppName = "SecondaryApp";
  const app = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
  return getAuth(app);
};
