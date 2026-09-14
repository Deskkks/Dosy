import express from "express";
import { prisma } from "../prisma";

const router = express.Router();

// Post criar medicamento

router.post("/", async (req, res) => {
  const newMeds = await prisma.medicamento.create({
    data: req.body,
  });
  res.status(201).json(newMeds);
});

// Post editar medicamento

router.post("/edit", async (req, res) => {
  const updatedMeds = await prisma.medicamento.update({
    where: { id: Number(req.body.id) },
    data: req.body.data,
  });
  res.status(200).json(updatedMeds);
});

// Get todos os medicamentos por usuario

router.get("/:id", async (req, res) => {
  let meds = await prisma.medicamento.findMany({
    where: { userId: Number(req.params.id) },
    select: {
      nome: true,
      dosagem: true,
      unidadeDosagem: true,
      dataInicio: true,
      frequencia: true
    }
  });

  const medsRes = meds.map((med: any) => {
    
    let doseDiaria = []
    for (let i = 0; 24 > med.frequencia*i; i++) {
      let dose = med.dataInicio.getHours() + (i * med.frequencia)
      if (dose >= 24) {
        dose = dose - 24
      }
      doseDiaria.push((dose < 10 ? "0" + dose : dose) + ":00")
      doseDiaria.sort((a, b) => {
        return a.localeCompare(b)
      })
    }

    return {
      nome: med.nome,
      dosagem: String(med.dosagem) + " " + med.unidadeDosagem,
      doseDiaria: doseDiaria,
    }
  });

  res.json(medsRes);
});

// Delete medicamento

router.delete("/:id", async (req, res) => {
  const deletedMeds = await prisma.medicamento.delete({
    where: { id: Number(req.params.id) },
  });
  res.status(200).json(deletedMeds);
});

// get todos os medicamentos

router.get("/", async (req, res) => {
  const meds = await prisma.medicamento.findMany();
  res.json(meds);
});

export default router;