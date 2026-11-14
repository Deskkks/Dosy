import { DateTime } from "luxon";
import { prisma } from "../prisma.js";
import defStatus from "./defstatus.js"
import { getMessaging } from 'firebase-admin/messaging';

//criar notificação

export async function enviarNotificacoes() {
  const tz = "America/Sao_Paulo"

  const dataInicio = DateTime.now().setZone(tz).startOf('day').toJSDate()
  const dataFim = DateTime.now().setZone(tz).endOf("day").toJSDate()


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

  const envios: Promise<string>[] = [];

  medsUsers.map((medsUser) => {
    medsUser.medicamentos.map((med) => {
      const status = defStatus(med, dataInicio, dataFim)

      status.map((stat: any) => {
        if (stat.status === "não tomado") {

          var [hours, minutes] = stat.horario.split(":").map(Number)
          var doseTime = new Date()
          doseTime.setHours(hours, minutes, 0, 0)
          var currentTime = new Date()
          var timeDifference = currentTime.getTime() - doseTime.getTime()

          if (timeDifference >= 0 && timeDifference <= 5 * 60 * 1000) {
            medsUser.cuidadores.map((cuid) => {
              if (cuid.token) {
                envios.push(
                  getMessaging().send({
                    token: cuid.token,
                    notification: {
                      title: "Medicamento do paciente atrasado",
                      body: "O paciente não tomou o medicamento " + med.nome + " no horário correto. Por favor, verifique a situação."
                    }
                  })
                )
              }
            })
          }
        }
      })
    })
  })

  const resultados = await Promise.allSettled(envios);

  let enviadas = 0;
  let falhas = 0;
  for (const r of resultados) {
    if (r.status === "fulfilled") {
      enviadas++;
      console.log("Mensagem enviada com sucesso:", r.value);
    } else {
      falhas++;
      console.error("Erro ao enviar mensagem:", r.reason);
    }
  }

  return { enviadas, falhas };
}