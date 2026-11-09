import express from "express";
import { prisma } from "../../prisma.js";
import padData from "../../utils/padData.js";
import { DateTime } from "luxon";

const router = express.Router();

const tz = "America/Sao_Paulo"

// Get todos os medicamentos por usuario

router.get("/:id", async (req, res) => {
  let meds = await prisma.medicamentos.findMany({
    where: { usuario_id: Number(req.params.id) },
    select: {
      id: true,
      nome: true,
      dosagem: true,
      unidade_dosagem: true,
      horario_dose: true,
      frequencia: true
    }
  }).then((meds) => {
    const medsRes = meds.map((med: any) => {
      let hora_dose = DateTime.fromJSDate(med.horario_dose).setZone("America/Sao_Paulo").hour;
      let minutos_dose = DateTime.fromJSDate(med.horario_dose).setZone("America/Sao_Paulo").minute;
      let doseDiaria = []
      for (let i = 0; 24 > med.frequencia * i; i++) {
        let dose = hora_dose + (i * med.frequencia)
        if (dose >= 24) {
          dose = dose - 24
        }
        doseDiaria.push(padData(new Date(0, 0, 0, dose, minutos_dose)))
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
  }).catch((err) => {
    res.status(500).send({ message: "Erro ao buscar medicamentos", error: err })
  })
});

// Post criar medicamento

router.post("/", async (req, res) => {
  const { horario_dose } = req.body
  const data_dose = DateTime.fromFormat(horario_dose, "HH:mm", { zone: "America/Sao_Paulo" }).toJSDate()
  const newMeds = await prisma.medicamentos.create({
    data: {
      dosagem: req.body.dosagem || null,
      frequencia: req.body.frequencia || null,
      horario_dose: data_dose || null,
      nome: req.body.nome || null,
      data_fim: req.body.data_fim || null,
      data_inicio: req.body.data_inicio || null,
      observacoes: req.body.observacoes || null,
      unidade_dosagem: req.body.unidade_dosagem || null,
      estoque: req.body.estoque || null,
      unidade_quantidade: req.body.unidade_quantidade || null,
      usuario_id: req.body.usuario_id || null,
    }
  }).then((newMeds) => {
    res.status(201).json(newMeds);
  }).catch((err) => {
    res.status(500).send({ message: "Erro ao criar medicamento", error: err })
  })
});

// Post editar medicamento

router.post("/edit", async (req, res) => {
  const { horario_dose } = req.body
  const data_dose = horario_dose ?  DateTime.fromFormat(horario_dose, "HH:mm", { zone: "America/Sao_Paulo" }).toJSDate() : undefined
  const updatedMeds = await prisma.medicamentos.update({
    where: { id: Number(req.body.id) },
    data: {
      dosagem: req.body.dosagem || undefined,
      frequencia: req.body.frequencia || undefined,
      horario_dose: data_dose || undefined,
      nome: req.body.nome || undefined,
      data_fim: req.body.data_fim || undefined,
      data_inicio: req.body.data_inicio || undefined,
      observacoes: req.body.observacoes || undefined,
      unidade_dosagem: req.body.unidade_dosagem || undefined,
      estoque: req.body.estoque || undefined,
      unidade_quantidade: req.body.unidade_quantidade || undefined,
      usuario_id: req.body.usuario_id || undefined,
    },
  }).then((updatedMeds) => {
    res.status(200).json(updatedMeds);
  }).catch((err) => {
    res.status(500).send({ message: "Erro ao editar medicamento", error: err })
  })
});

// Delete medicamento

router.delete("/:id", async (req, res) => {
  const deletedMeds = await prisma.medicamentos.delete({
    where: { id: Number(req.params.id) },
  }).then((deletedMeds) => {
    res.status(200).json(deletedMeds);
  }).catch((err) => {
    res.status(500).send({ message: "Erro ao deletar medicamento", error: err })
  })
});

export default router;