import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwhLXKWEboTSAVxw6aRJGFsPc_-Oxx-74",
  authDomain: "test-app-aa484.firebaseapp.com",
  projectId: "test-app-aa484",
  storageBucket: "test-app-aa484.appspot.com",
  messagingSenderId: "224115581290",
  appId: "1:224115581290:web:2268e947cb43f9742dc513",
  measurementId: "G-JP17B5MX7Z",
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export const uploadFileToFirebase = async (
  file: any,
  folderName: string = "HydroMint"
) => {
  if (!file) return null;
  try {
    const sotrageRef = ref(storage, `${folderName}/${file.name}`);
    const snapshot = await uploadBytes(sotrageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.log("Error uploading file : ", error);
    return null;
  }
};
