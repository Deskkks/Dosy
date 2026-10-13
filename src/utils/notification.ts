import { prisma } from "../prisma.js";
import cron from "node-cron";
import defStatus from "./defstatus.js"
import { getMessaging } from 'firebase-admin/messaging';

//criar notificação

function notification() {

// cron.schedule("0 0 * * *", async () => {

  const dataInicio = new Date(new Date().setHours(0, 0, 0, 0))
	const dataFim = new Date(new Date().setHours(23, 59, 59, 999))
    
  cron.schedule("* * * * *", async () => {
    const medsUsers = await prisma.user.findMany({
      where: {
        cuidadorId: {
          not: null
        },
        TokenFCM: {
          not: null
        }
      },
      select: {
        cuidadorId: true,
        TokenFCM: true,
        medicamentos: {
          select: {
            nome: true,
            dosagem: true,
            unidadeDosagem: true,
            dataInicio: true,
            frequencia: true,
            id: true,
            historicos: {
              where: {
              data: {
                gte: dataInicio,
                lt: dataFim,
              }
              },
              select: {
                data: true
              }
            }     
          }
        }
      }
    })

    medsUsers.map((medsUser) => {
      medsUser.medicamentos.map((med) => {
        const status = defStatus(med, dataInicio, dataFim)

        status.map((stat: any) => {
          if(stat.status === "não tomado"){

            var [hours, minutes] = stat.horario.split(":").map(Number)
            var doseTime = new Date()
            doseTime.setHours(hours, minutes, 0, 0)
            var currentTime = new Date()
            var timeDifference = currentTime.getTime() - doseTime.getTime()

            if(timeDifference >= 0 && timeDifference <= 5 * 60 * 1000 && medsUser.TokenFCM) {
              const message = {
                token: medsUser.TokenFCM,
                notification: {
                  title: "Medicamento do paciente atrasado",
                  body: "O paciente não tomou o medicamento " + med.nome + " no horário correto. Por favor, verifique a situação."
                }
              };
          
              getMessaging().send(message)
              .then((response) => {
                console.log("Mensagem enviada com sucesso:", response);
              })
              .catch((error) => {
                console.log("Erro ao enviar mensagem:", error);
              });
            }
          }
        })
      })
      
    })
  })

// })
}

export default notification;