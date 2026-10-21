import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXI-NesdEXf0mymSNnpV1Lnyah4BNNODE",
  authDomain: "dvoting-privacy.firebaseapp.com",
  projectId: "dvoting-privacy",
  storageBucket: "dvoting-privacy.firebasestorage.app",
  messagingSenderId: "116228274888",
  appId: "1:116228274888:web:ebc26fdd195eb80af983fd",
  measurementId: "G-RCNM20LCT5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
