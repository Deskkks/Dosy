import express from "express";
import { prisma } from "../../prisma.js";
import { getMessaging } from "firebase-admin/messaging";

const router = express.Router();

// Post criar conta

router.post("/", async (req, res) => {

  const newUser = await prisma.user.create({
    data: req.body.data
  })

  res.json(newUser.id).status(201)
})

//post entrar conta

router.post("/login", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
      senha: req.body.senha
    }
  })

  if(user){
    res.json(user.id).status(200)
  }else {
    res.json({message: "O email ou senha estão errados ou não existe"}).status(404)
  }
})

//Post Adicionar Cuidador

router.post("/requestCuidador", async (req, res) => {

  const cuidador = await prisma.user.findUnique({
    where: {
      email: req.body.email
    }
  })

  if(cuidador?.TokenFCM){
    const message = {
      token: cuidador.TokenFCM,
      notification: {
        title: "Você tem um novo paciente",
        body: "O paciente " + req.body.nome + " deseja que você seja seu cuidador. Acesse o aplicativo para aceitar ou recusar."
      },
      data: {
        pacientId: req.body.userId,
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

})

router.post("/accept", async (req, res) => {

    await prisma.user.update({
      where: { id: req.body.pacientId },
      data: { cuidadorId : req.body.cuidadorId }
    })
    res.status(200).json({message: "Cuidador aceito com sucesso"})

})

export default router;