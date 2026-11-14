import { cert, initializeApp } from "firebase-admin";

export default function firebaseInit() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  
  initializeApp({ credential: cert(serviceAccount) })
}