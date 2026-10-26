import express from "express";
import { prisma } from "../../prisma.js";
import { getMessaging } from "firebase-admin/messaging";

const router = express.Router();

// ---------- criar conta (paciente) ----------

router.post("/", async (req, res) => {
  const { nome, email, senha, precisa_cuidador } = req.body;

  try {
    const newUser = await prisma.usuarios.create({
      data: {
        nome,
        email,
        senha_hash: senha, // versão simples: sem hash
        precisa_cuidador: Boolean(precisa_cuidador),
      },
    });
    res.status(201).json(newUser.id);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Já existe uma conta com esse email" });
    }
    res.status(500).json({ message: "Erro ao criar conta" });
  }
});

// ---------- criar conta (cuidador) ----------

router.post("/cuidador", async (req, res) => {
  const { nome, email, senha, telefone, parentesco, usuarioId } = req.body;

  try {
    const novoCuidador = await prisma.cuidadores.create({
      data: {
        nome,
        email,
        senha,
        telefone,
        parentesco,
        usuario_id: Number(usuarioId), // paciente ao qual o cuidador está ligado
      },
    });
    res.status(201).json(novoCuidador.id);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Já existe um cuidador com esse email" });
    }
    if (error?.code === "P2003") {
      return res.status(404).json({ message: "Paciente não encontrado" });
    }
    res.status(500).json({ message: "Erro ao criar conta do cuidador" });
  }
});

// ---------- entrar (paciente ou cuidador) ----------

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuarios.findUnique({ where: { email } });
    if (usuario && usuario.senha_hash === senha) {
      return res.status(200).json({ id: usuario.id, tipo: "paciente" });
    }

    const cuidador = await prisma.cuidadores.findUnique({ where: { email } });
    if (cuidador && cuidador.senha === senha) {
      return res.status(200).json({
        id: cuidador.id,
        tipo: "cuidador",
        pacienteId: cuidador.usuario_id,
      });
    }

    res.status(401).json({ message: "O email ou senha estão errados ou não existe" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

// ---------- paciente pede para um cuidador (notificação push) ----------

router.post("/requestCuidador", async (req, res) => {
  try {
    const cuidador = await prisma.cuidadores.findUnique({
      where: { email: req.body.email },
    });

    if (!cuidador?.token) {
      return res.status(404).json({ message: "Cuidador não encontrado ou sem token de notificação" });
    }

    await getMessaging().send({
      token: cuidador.token,
      notification: {
        title: "Você tem um novo paciente",
        body: `O paciente ${req.body.nome} deseja que você seja seu cuidador. Acesse o aplicativo para aceitar ou recusar.`,
      },
      data: {
        pacientId: String(req.body.userId),
      },
    });

    res.json({ message: "Mensagem enviada com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao enviar mensagem" });
  }
});

// ---------- cuidador aceita o paciente ----------

router.post("/accept", async (req, res) => {
  try {
    await prisma.cuidadores.update({
      where: { id: Number(req.body.cuidadorId) },
      data: { usuario_id: Number(req.body.pacientId) },
    });
    res.status(200).json({ message: "Cuidador aceito com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao aceitar cuidador" });
  }
});

// ---------- salvar token FCM do cuidador ----------

router.post("/token", async (req, res) => {
  try {
    await prisma.cuidadores.update({
      where: { id: Number(req.body.cuidadorId) },
      data: { token: req.body.token },
    });
    res.status(200).json({ message: "Token atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar token" });
  }
});

export default router;