# Docs API

Documentação dos endpoints da API do aplicativo.

---

## Medicamentos

### `POST /api/meds`

Cadastra um novo medicamento.

#### Exemplo de requisição

```json
{
  "data": {
    "nome": "losartana",
    "dataFim": "2026-12-31 08:00:00-03:00",
    "dataInicio": "2026-01-01 08:00:00-03:00",
    "dosagem": 50,
    "frequencia": 8,
    "quantidade": 60,
    "unidadeDosagem": "mg",
    "unidadeQuantidade": "comprimido",
    "userId": 1
  }
}
```

---

### `POST /api/meds/edit`

Altera informações de um medicamento que já existe.

> **Observação:** o `?` indica que o campo é opcional.
> Envie no objeto `data` apenas as informações que precisam ser alteradas.

#### Exemplo de requisição

```json
{
  "id": 1,
  "data": {
    "nome?": "losartana",
    "dataFim?": "2026-12-31 08:00:00-03:00",
    "dataInicio?": "2026-01-01 08:00:00-03:00",
    "dosagem?": 50,
    "frequencia?": 8,
    "quantidade?": 60,
    "unidadeDosagem?": "mg",
    "unidadeQuantidade?": "comprimido"
  }
}
```

---

### `GET /api/meds/:userId`

Recebe informações dos medicamentos de um usuário.

> **Observação:** esse endpoint foi criado inicialmente de forma automática e pode não ser necessário para o aplicativo. O endpoint `/api/historys` possui uma funcionalidade mais adequada para obter as doses do dia.

#### Exemplo de URL

```text
URL/api/meds/1
```

#### Exemplo de resposta

```json
[
  {
    "nome": "losartana",
    "dosagem": "50 mg",
    "doseDiaria": [
      "00:00",
      "08:00",
      "16:00"
    ]
  }
]
```

> **Observação:** o `[]` indica que a resposta é uma lista de objetos.

---

### `DELETE /api/meds/:userId`

Deleta um medicamento.

#### Exemplo de URL

```text
URL/api/meds/1
```

---

# Usuários

### `POST /api/users`

Cria um novo usuário.

#### Exemplo de requisição

```json
{
  "data": {
    "email": "kayky@email.com",
    "nome": "Kayky Almeida de Souza",
    "senha": "743890235"
  }
}
```

#### Exemplo de resposta

```json
{
  "userId": 1
}
```

> **Importante:** guarde o `userId` localmente para utilizá-lo nas outras requisições.

---

### `POST /api/users/login`

Realiza o login do usuário.

#### Exemplo de requisição

```json
{
  "email": "kayky@email.com",
  "senha": "743890235"
}
```

---

### `POST /api/users/cuid`

Cadastra um cuidador para o usuário.

#### Exemplo de requisição

```json
{
  "email": "kayky@email.com",
  "nome": "Kayky Almeida de Souza",
  "userId": 1
}
```

* `email`: e-mail do cuidador.
* `nome`: nome do cuidador.
* `userId`: ID do usuário que será acompanhado.

---

# Histórico

### `POST /api/historys`

Cria um novo histórico de medicamento.

#### Exemplo de requisição

```json
{
  "data": {
    "medicamentoId": 1,
    "userId": 1,
    "data?": "2026-09-14 08:00:00-03:00"
  }
}
```

> **Observação:** o campo `data` é opcional.

---

### `GET /api/historys`

Recebe as doses do dia de um usuário.

#### Exemplo de requisição

```json
{
  "id": 1
}
```

#### Exemplo de resposta

```json
[
  {
    "nome": "dipirona",
    "dosagem": "50 mg",
    "doses": [
      {
        "horario": "08:00",
        "tomado": "08:05",
        "status": "tomado"
      }
    ]
  }
]
```

O campo `status` pode assumir os seguintes valores:

* `tomado`
* `atrasado`
* `não tomado`
* `pendente`

> **Observação:** esse endpoint deve ser utilizado para obter as doses do dia. O endpoint `GET /api/meds/:userId` pode conter erros ou não ser necessário para o aplicativo.

---

# Dashboard

### `GET /api/historys/dashboard`

Retorna os dados utilizados para montar o dashboard de adesão do usuário.

#### Exemplo de URL

```text
URL/api/historys/dashboard?id=userId
```

#### Exemplo de resposta

```json
{
  "adesao": "23.6",
  "dosesEsp": 416,
  "dosesTom": 98,
  "dosesAtr": 64,
  "dosesNT": 248,

  "adesaoD": [
    {
      "adesao": "46.2",
      "diaSem": "domingo"
    },
    {
      "adesao": "50.0",
      "diaSem": "segunda-feira"
    },
    {
      "adesao": "42.3",
      "diaSem": "terça-feira"
    },
    {
      "adesao": "42.3",
      "diaSem": "quarta-feira"
    },
    {
      "adesao": "23.1",
      "diaSem": "quinta-feira"
    },
    {
      "adesao": "0.0",
      "diaSem": "sexta-feira"
    },
    {
      "adesao": "0.0",
      "diaSem": "sábado"
    }
  ],

  "adesaoR": [
    {
      "remedio": "Dipirona",
      "dosesEsp": 126,
      "dosesTom": 28,
      "adesao": "22"
    },
    {
      "remedio": "Paracetamol",
      "dosesEsp": 95,
      "dosesTom": 21,
      "adesao": "22"
    },
    {
      "remedio": "Amoxicilina",
      "dosesEsp": 63,
      "dosesTom": 16,
      "adesao": "25"
    },
    {
      "remedio": "Omeprazol",
      "dosesEsp": 32,
      "dosesTom": 4,
      "adesao": "13"
    },
    {
      "remedio": "Ibuprofeno",
      "dosesEsp": 94,
      "dosesTom": 29,
      "adesao": "31"
    }
  ],

  "horariosEsq": [
    {
      "horario": "06:00",
      "qtd": 7,
      "porcentagem": "50.0"
    },
    {
      "horario": "07:00",
      "qtd": 5,
      "porcentagem": "35.7"
    },
    {
      "horario": "11:00",
      "qtd": 5,
      "porcentagem": "35.7"
    },
    {
      "horario": "15:00",
      "qtd": 7,
      "porcentagem": "50.0"
    },
    {
      "horario": "17:00",
      "qtd": 7,
      "porcentagem": "50.0"
    },
    {
      "horario": "18:00",
      "qtd": 5,
      "porcentagem": "35.7"
    }
  ]
}
```

### Estrutura da resposta

#### Dados gerais

| Campo      | Descrição                             |
| ---------- | ------------------------------------- |
| `adesao`   | Porcentagem geral de adesão           |
| `dosesEsp` | Quantidade de doses esperadas         |
| `dosesTom` | Quantidade de doses tomadas           |
| `dosesAtr` | Quantidade de doses tomadas atrasadas |
| `dosesNT`  | Quantidade de doses não tomadas       |

#### `adesaoD`

Contém a adesão agrupada por dia da semana.

| Campo    | Descrição                         |
| -------- | --------------------------------- |
| `adesao` | Porcentagem de adesão naquele dia |
| `diaSem` | Dia da semana                     |

#### `adesaoR`

Contém a adesão agrupada por medicamento.

| Campo      | Descrição                     |
| ---------- | ----------------------------- |
| `remedio`  | Nome do medicamento           |
| `dosesEsp` | Quantidade de doses esperadas |
| `dosesTom` | Quantidade de doses tomadas   |
| `adesao`   | Porcentagem de adesão         |

#### `horariosEsq`

Contém os horários em que o usuário mais esquece de tomar os medicamentos.

| Campo         | Descrição                                       |
| ------------- | ----------------------------------------------- |
| `horario`     | Horário da dose                                 |
| `qtd`         | Quantidade de doses esquecidas                  |
| `porcentagem` | Porcentagem de doses esquecidas naquele horário |
| `adesao`      | —                                               |
