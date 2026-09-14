import express from "express";
import { prisma } from "../prisma";

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

router.post("/cuid", async (req, res) => {

  const cuidador = await prisma.user.findUnique({
    where: {
      email: req.body.email,
      nome: req.body.nome
    }
  })
  if(cuidador){
    const user = await prisma.user.update({
      where: { id: req.body.userId },
      data: { cuidadorId : cuidador.id}
    })
    res.status(200)
  }else{
    res.status(404).json({message: "usuario do cuidador não existe"})
  }
})

export default router;