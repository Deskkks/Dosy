import express from "express";
import { prisma } from "../../prisma.js";
import padData from "../../utils/padData.js";
import { DateTime } from "luxon";

const router = express.Router();

// Get todos os medicamentos por usuario

router.get("/:id", async (req, res) => {
  let meds = await prisma.medicamentos.findMany({
    where: { usuario_id: Number(req.params.id) },
    select: {
      id: true,
      nome: true,
      dosagem: true,
      unidade_dosagem: true,
      data_inicio: true,
      frequencia: true
    }
  }).then((meds) => {

    const medsRes = meds.map((med: any) => {
      let dataInicio = DateTime.fromJSDate(med.data_inicio).setZone("America/Sao_Paulo").hour;
      let doseDiaria = []
      for (let i = 0; 24 > med.frequencia*i; i++) {
        let dose = dataInicio + (i * med.frequencia)
        if (dose >= 24) {
          dose = dose - 24
        }
        doseDiaria.push(padData(new Date(0, 0, 0, dose, 0)))
        doseDiaria.sort((a, b) => {
          return a.localeCompare(b)
        })
      }

      return {
        id: med.id,
        nome: med.nome,
        dosagem: String(med.dosagem) + " " + med.unidade_dosagem,
        doseDiaria: doseDiaria,
      }
    })
    res.status(200).json(medsRes);
  }).catch(() => {
    res.status(500).json({message: "Erro ao buscar medicamentos"})
  })
});

// Post criar medicamento

router.post("/", async (req, res) => {
  const newMeds = await prisma.medicamentos.create({
    data: req.body
  }).then((newMeds) => {
    res.status(201).json(newMeds);
  }).catch(() => {
    res.status(500).json({message: "Erro ao criar medicamento"})
  })
});

// Post editar medicamento

router.post("/edit", async (req, res) => {
  const updatedMeds = await prisma.medicamentos.update({
    where: { id: Number(req.body.id) },
    data: req.body.data,
  }).then((updatedMeds) => {
    res.status(200).json(updatedMeds);
  }).catch(() => {
    res.status(500).json({message: "Erro ao editar medicamento"})
  })
});

// Delete medicamento

router.delete("/:id", async (req, res) => {
  const deletedMeds = await prisma.medicamentos.delete({
    where: { id: Number(req.params.id) },
  }).then((deletedMeds) => {
    res.status(200).json(deletedMeds);
  }).catch(() => {
    res.status(500).json({message: "Erro ao excluir medicamento"})
  })
});

export default router;