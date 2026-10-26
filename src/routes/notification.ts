import { prisma } from "../prisma.js";
import defStatus from "../utils/defstatus.js"
import { getMessaging } from 'firebase-admin/messaging';
import Express from "express";

const router = Express.Router();

//criar notificação

router.get("/", async (req, res) => {

  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const dataInicio = new Date(new Date().setHours(0, 0, 0, 0))
  const dataFim = new Date(new Date().setHours(23, 59, 59, 999))
    
  const medsUsers = await prisma.usuarios.findMany({
    where: {
      cuidadores: {
        some: {
          token: {
            not: null
          }
        }
      }
    },
    select: {
      cuidadores: {
        select: {
          id: true,
          token: true
        }
      },
      medicamentos: {
        select: {
          nome: true,
          dosagem: true,
          unidadeDosagem: true,
          data_inicio: true,
          frequencia: true,
          id: true,
          historico: {
            where: {
              tomado_em: {
                gte: dataInicio,
                lte: dataFim,
              }
            },
            select: {
              tomado_em: true
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

          if(timeDifference >= 0 && timeDifference <= 5 * 60 * 1000) {
            medsUser.cuidadores.map((cuid) => {
              if(cuid.token){
                const message = {
                  token: cuid.token,
                  notification: {
                    title: "Medicamento do paciente atrasado",
                    body: "O paciente não tomou o medicamento " + med.nome + " no horário correto. Por favor, verifique a situação."
                  }
                }
            
                getMessaging().send(message)
                .then((response) => {
                  console.log("Mensagem enviada com sucesso:", response)
                })
                .catch((error) => {
                  console.log("Erro ao enviar mensagem:", error)
                })  
              }
            })
          }
        }
      })
    })
  })

  return res.status(200).send('Notificações enviadas com sucesso');
})

export default router;