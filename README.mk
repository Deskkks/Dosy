## Prefixos das rotas

As rotas são agrupadas em um roteador principal:

| Prefixo | Módulo |
|---|---|
| `/users` | Contas, login e vínculo com cuidador |
| `/meds` | Medicamentos |
| `/historys` | Histórico, dose do dia e dashboard |
| `/notification` | Disparo de notificações (cron) |

O prefixo base (ex.: `/api`) depende de onde esse roteador é montado no `app`.

---

## Modelo de dados (resumo)

- **usuarios** (pacientes): `id`, `email` (único), `nome`, `senha_hash`, `precisa_cuidador`
- **cuidadores**: `id`, `usuario_id` (paciente vinculado), `nome`, `email` (único), `senha`, `telefone`, `parentesco`, `token` (FCM)
- **medicamentos**: `id`, `usuario_id`, `nome`, `dosagem`, `unidade_dosagem`, `frequencia`, `data_inicio`, ...
- **historico**: registro de cada dose (`previsto_para`, `status`, `tomado_em`, ...)

---

## Usuários — `/users`

### `POST /users` — Criar conta de paciente

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `nome` | string | sim | |
| `email` | string | sim | Único |
| `senha` | string | sim | Salva em `senha_hash` |
| `precisa_cuidador` | boolean | não | Padrão `false` |

Respostas:
- `201`: id do usuário criado (número)
- `409`: `{ "message": "Já existe uma conta com esse email" }`
- `500`: `{ "message": "Erro ao criar conta" }`

### `POST /users/cuidador` — Criar conta de cuidador

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `nome` | string | sim | |
| `email` | string | sim | Único |
| `senha` | string | sim | |
| `usuarioId` | number | não | Id do paciente ao qual o cuidador é vinculado |
| `telefone` | string | não | Até 20 caracteres |
| `parentesco` | string | não | |

Respostas:
- `201`: id do cuidador criado (número)
- `404`: paciente não encontrado
- `409`: já existe cuidador com esse email
- `500`: erro ao criar conta do cuidador

### `POST /users/login` — Entrar (paciente ou cuidador)

| Campo | Tipo | Obrigatório |
|---|---|---|
| `email` | string | sim |
| `senha` | string | sim |

O servidor procura primeiro um paciente e depois um cuidador com esse email.

Respostas:
- `200` paciente: `{ "id": 1, "tipo": "paciente" }`
- `200` cuidador: `{ "id": 3, "tipo": "cuidador", "pacienteId":? 1 }`
- `401`: email ou senha errados
- `500`: erro ao fazer login

### `POST /users/token` — Salvar token FCM do cuidador

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `cuidadorId` | number | sim | |
| `token` | string | sim | Token FCM do dispositivo |

Respostas: `200` token atualizado, `500` erro ao atualizar.

> O token precisa estar salvo para o cuidador receber notificações.

### `POST /users/requestCuidador` — Paciente pede um cuidador

Envia uma notificação push ao cuidador convidando-o a aceitar o paciente.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `email` | string | sim | Email do cuidador |
| `nome` | string | sim | Nome do paciente |
| `userId` | number | sim | Id do paciente |

Requisitos: cuidador cadastrado, com `token` salvo, e Firebase configurado.

Respostas: `200` mensagem enviada, `404` cuidador não encontrado ou sem token, `500` erro ao enviar.

### `POST /users/accept` — Cuidador aceita o paciente

| Campo | Tipo | Obrigatório |
|---|---|---|
| `cuidadorId` | number | sim |
| `pacientId` | number | sim |

Atualiza `cuidadores.usuario_id` para o paciente informado.

Respostas: `200` cuidador aceito, `500` erro ao aceitar.

---

## Medicamentos — `/meds`

A agenda de doses é calculada a partir de `data_inicio` e `frequencia` (intervalo em **horas** entre as doses).

### `GET /meds/:id` — Listar medicamentos de um paciente

| Parâmetro | Onde | Descrição |
|---|---|---|
| `id` | URL | Id do paciente (`usuario_id`) |

Resposta `200`:

```json
[
  {
    "id": 1,
    "nome": "Dipirona",
    "dosagem": "500 mg",
    "doseDiaria": ["06:00", "14:00", "22:00"]
  }
]
```

`500`: `{ "message": "Erro ao buscar medicamentos" }`

### `POST /meds` — Criar medicamento

O corpo é enviado direto para o banco.

| Campo | Tipo | Obrigatório | Padrão |
|---|---|---|---|
| `usuario_id` | number | sim | |
| `nome` | string | sim | |
| `dosagem` | number | sim | |
| `frequencia` | number | sim | Intervalo em horas |
| `unidade_dosagem` | string | não | `"mg"` |
| `quantidade_por_dose` | number | não | `1` |
| `unidade_quantidade` | string | não | `"comprimido"` |
| `data_inicio` | date (ISO) | não | Data atual |
| `data_fim` | date (ISO) | não | |
| `estoque` | number | não | |
| `estoque_minimo` | number | não | `5` |
| `observacoes` | string | não | |
| `foto_obrigatoria` | boolean | não | `false` |
| `ativo` | boolean | não | `true` |

Respostas: `201` medicamento criado (objeto completo), `500` erro ao criar.

### `POST /meds/edit` — Editar medicamento

```json
{
  "id": 1,
  "data": { "nome": "Novo nome", "frequencia": 6 }
}
```

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | number | sim | Id do medicamento |
| `data` | objeto | sim | Campos de `medicamentos` a alterar |

Respostas: `200` medicamento atualizado, `500` erro ao editar.

### `DELETE /meds/:id` — Excluir medicamento

| Parâmetro | Onde | Descrição |
|---|---|---|
| `id` | URL | Id do medicamento |

Também apaga o histórico e os horários ligados a ele (`onDelete: Cascade`).

Respostas: `200` medicamento excluído (objeto), `500` erro ao excluir.

---

## Histórico — `/historys`

### `POST /historys` — Registrar dose no histórico

O corpo é enviado direto para o banco.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `usuario_id` | number | sim | |
| `medicamento_id` | number | sim | |
| `previsto_para` | datetime (ISO) | sim | Único junto com `medicamento_id` |
| `horario_id` | number | não | |
| `status` | string | não | Padrão `"pendente"` |
| `tomado_em` | datetime (ISO) | não | Hora em que a dose foi tomada |
| `lembrete_enviado_em` | datetime (ISO) | não | |
| `segundo_aviso_em` | datetime (ISO) | não | |
| `responsavel_notificado_em` | datetime (ISO) | não | |
| `foto_caminho` | string | não | |
| `observacao` | string | não | |

Respostas: `201` registro criado, `500` `{ "error": "...", "details": "..." }`.

### `GET /historys/doseDia/:id` — Doses de hoje

| Parâmetro | Onde | Descrição |
|---|---|---|
| `id` | URL | Id do paciente |

Retorna, para cada medicamento, as doses do dia e o status de cada uma.

```json
[
  {
    "nome": "Dipirona",
    "dosagem": "500 mg",
    "doses": [
      { "horario": "06:00", "status": "tomado" },
      { "horario": "14:00", "status": "pendente" }
    ]
  }
]
```

Valores de `status`: `tomado`, `atrasado`, `não tomado`, `pendente`.

Respostas: `200` lista, `500` `{ "error": "Erro ao buscar doses do dia", "details": "..." }`.

### `GET /historys/dashboard/:id` — Dashboard de adesão

| Parâmetro | Onde | Descrição |
|---|---|---|
| `id` | URL | Id do paciente |

Resposta `200`:

| Campo | Descrição |
|---|---|
| `adesao` | % de adesão geral do dia (doses tomadas ou atrasadas ÷ doses esperadas) |
| `dosesEsp` | Doses esperadas hoje (exclui as `pendente`) |
| `dosesTom` | Doses tomadas hoje (`tomado` + `atrasado`) |
| `dosesAtr` | Doses tomadas com atraso |
| `dosesNT` | Doses não tomadas |
| `adesaoR` | Lista por remédio: `{ remedio, dosesEsp, dosesTom, adesao }` |
| `adesaoD` | Lista por dia da semana (semana passada): `{ adesao, diaSem }` |
| `horariosEsq` | Horários em que mais se esquece de tomar: `{ horario, qtd, porcentgem }` |

---

## Notificações — `/notification`

### `GET /notification` — Avisar cuidadores sobre doses atrasadas

Pensada para ser chamada por um **cron job** (ex.: Vercel Cron), **a cada 5 minutos**.

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <CRON_SECRET>` |

Funcionamento: para cada paciente que tenha ao menos um cuidador com token FCM, procura doses de hoje com status `não tomado` cujo horário passou há no máximo 5 minutos e envia um push a todos os cuidadores com token: *"O paciente não tomou o medicamento X no horário correto"*.

Respostas: `200` texto `Notificações enviadas com sucesso`, `401` `Unauthorized` (header ausente ou incorreto).

---