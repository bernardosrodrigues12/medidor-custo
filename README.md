# medidor-custo

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini%20API-8E75B2?style=flat&logo=google-gemini&logoColor=white)
![Status](https://img.shields.io/badge/status-conclu%C3%ADdo-success)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

> Medidor de custo, tokens e latência para chamadas de LLM — com comparação experimental entre modelos Gemini.

## 📋 Sobre o projeto

Ferramenta em TypeScript que mede cada chamada a um LLM (tokens de prompt, resposta e pensamento, custo estimado, latência) e persiste tudo em CSV, permitindo comparar modelos com dados reais em vez de intuição.

**Funcionalidades:**

- ✅ **Medição por chamada** — tokens de entrada, saída e pensamento, custo estimado por tabela de preços e latência em ms
- ✅ **Classificação de erros** — códigos HTTP separados entre transientes (429/500/503, com retry e backoff exponencial) e determinísticos (falham rápido, sem retry)
- ✅ **Persistência em CSV** — append incremental, cabeçalho automático e mensagens de erro sanitizadas
- ✅ **Experimento comparativo** — N modelos × N chamadas com intervalo configurável e respeitoso com rate limits
- ✅ **Camadas desacopladas** — medição, persistência e orquestração em módulos independentes

**Feito com:** TypeScript · Node.js + tsx · `@google/genai` (SDK nativo do Gemini) · Git/GitHub

## 🗂️ Estrutura

```text
medidor-custo/
├── src/
│   ├── client.ts          # cliente isolado — único ponto que conhece a API
│   ├── meter.ts           # medição: guard de usage, retry, custo, latência
│   └── logger.ts          # persistência: CSV com append e cabeçalho automático
├── scripts/
│   ├── smoke-test.ts      # lista os modelos disponíveis na conta
│   ├── test-meter.ts      # canário: 1 chamada medida de ponta a ponta
│   ├── test-error.ts      # valida a classificação de erros
│   ├── api-key-test.ts    # diagnóstico de chave e .env
│   └── batch-compare.ts   # experimento: 2 modelos × 10 chamadas
├── data/
│   └── calls.csv          # resultados do experimento
└── package.json
```

## 🚀 Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Configure a chave da API
#    Crie um arquivo .env na raiz com sua chave:
#    GEMINI_API_KEY=sua-chave-do-google-ai-studio

# 3. Valide o ambiente
npm run smoke        # lista os modelos disponíveis para sua conta
npm run test:meter   # canário: 1 chamada medida — confirma chave, rede e medição
npm run test:error   # valida a classificação de erros

# 4. Rode o experimento (~3-10 min)
npm run batch        # 2 modelos × 10 chamadas → data/calls.csv
```

> Custo total do experimento: menos de `US$ 0,06` — roda tranquilamente no free tier.

## 📊 Resultados (20 chamadas — 06/11/2026)

| Métrica | gemini-3.5-flash | gemini-3.5-flash-lite |
|---|---|---|
| Chamadas bem-sucedidas | 5/10 | 10/10 |
| Latência média (sucessos) | 5,9 s | 1,3 s |
| Tokens de resposta (média) | 76 | 106 |
| Tokens de pensamento (média) | 522 | 0 |
| Custo médio por chamada | `~$0,0054` | `~$0,00027` |

Na mesma janela de ~3 minutos, o flash falhou metade das chamadas (alta demanda no modelo) e o flash-lite, nenhuma — **disponibilidade também é métrica**. Com o custo corrigido (pensamento cobrado como saída), o flash custou ~20× mais com respostas de tamanho equivalente. Para tarefas simples, o flash-lite entregou mais, por ~5% do preço.

> **Nota metodológica:** a primeira rodada registrou custo subestimado (tokens de pensamento fora da fórmula). A fórmula foi corrigida e o experimento re-executado — ver Aprendizados, item 6.

## 🎯 Intenção com o projeto

Primeiro projeto da minha transição de desenvolvedor front-end para engenharia de produto de IA. O objetivo não era "fazer uma chamada de API" — é fácil —, mas construir o hábito de **medir antes de decidir**: custo por requisição, latência percebida e disponibilidade como critérios reais de escolha de modelo. A decisão de qual LLM usar num produto deve sair de dados como os deste CSV, não de hype.

## 📚 Aprendizados

1. **Variáveis de ambiente são strings puras** — um `.env` escrito com sintaxe de JavaScript (colchetes, vírgulas) quebra o parse silenciosamente.
2. **API nativa ≠ API compatível com OpenAI** — `contents`/`usageMetadata` vs `messages`/`usage`: trocar de provedor custa mais que trocar uma URL, e isolar o cliente é o que torna a troca barata.
3. **O `!` (non-null assertion) não verifica nada** — silencia o compilador e empurra a falha para o pior lugar: o runtime. Guard com narrowing prova a invariante; quanto mais longe a origem do dado (resposta de API, input externo), mais caro o `!`.
4. **ListModels ≠ disponibilidade** — modelos listados no catálogo podem retornar 404 para contas novas (política de acesso por modelo). Descobri na prática com o 2.5-flash.
5. **503 persistente é saturação, não pico** — dois dias de alta demanda no mesmo modelo; o padrão canário (1 chamada antes do lote) poupou experimentos inteiros de zeros.
6. **Tokens de pensamento são cobrados como saída** — a fórmula sem eles subestimou o custo em 5,8×; corrigi somando `thoughtTokens` ao output e revalidei os valores contra o CSV.
7. **Erro consome tempo, não tokens** — cada falha com retry custou `US$ 0` e até ~70 s; latência de falha é dado, e virou coluna no CSV.
8. **Contrato entre camadas** — `meteredChat` nunca lança: classificação, retry e fallback vivem na camada de medição; o orquestrador apenas confia e consome.

## ✅ Conclusão

O projeto cumpriu o papel da semana 1: primeira integração real com API de LLMs, com observabilidade construída do zero e dois achados que só dados reais entregam — a subestimação de custo pelos tokens de pensamento e a disponibilidade diferenciada por modelo. Próximos passos naturais: estudar temperatura e janela de contexto, streaming e structured outputs com interface React.

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.