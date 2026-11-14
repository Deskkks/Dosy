import { prisma } from "../prisma.js";
import firebaseInit from "../firebase.js"; // arquivo onde você faz o initializeApp do firebase-admin
import { enviarNotificacoes } from "./notification.js";

firebaseInit(); // Inicializa o Firebase Admin SDK

try {
  const { enviadas, falhas } = await enviarNotificacoes();
  console.log(`Job finalizado: ${enviadas} enviadas, ${falhas} falhas`);
} catch (error) {
  console.error("Erro no job de notificações:", error);
  process.exitCode = 1;
} finally {
  // Fecha a conexão com o banco e encerra o processo,
  // senão o Railway pula as próximas execuções do cron.
  await prisma.$disconnect();
  process.exit();
}