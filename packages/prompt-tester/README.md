# 🧠 Prompt Tester System

> Sistema de teste e geração automática de prompts para o padrão OpenIntent.

## Como foi feito

Para garantir a integridade e a evolução dos prompts no sistema OmniChannelBridge, implementamos um motor de teste e geração que segue rigorosamente os princípios de **Antifragilidade** e **Object Calisthenics**.

O desafio consistia em ler o arquivo `openintent.json`, agrupar as intenções por domínio e, crucialmente, gerar prompts para as intenções que estivessem vazias, sem nunca utilizar o nome da entidade (evitando acoplamento léxico direto).

### Técnica Utilizada: Semantic Nominal Typing & Domain Synonyms

1.  **Tipagem Semântica**: Utilizamos *Nominal Typing* para garantir que strings de Domínio não sejam confundidas com strings gerais de Prompt.
2.  **Mapeamento de Sinônimos**: Criamos um dicionário de conceitos que substitui nomes de entidades (ex: "usuário") por termos abstratos ou sinônimos contextuais (ex: "membro", "identidade", "colaborador").
3.  **Pattern Matching de Intenções**: O gerador identifica o "verbo" da intenção (`create`, `delete`, `list`) e aplica um template conceitual.

## Como funciona

O sistema é dividido em quatro componentes principais:
- **Parser**: Valida e interpreta o JSON, aplicando tipos nominais.
- **Generator**: Analisa quais prompts faltam e os gera dinamicamente.
- **Tester**: Orquestra a execução e valida se as regras de negócio (como a não utilização do nome da entidade) foram seguidas.
- **Runner**: Script de execução que consome o arquivo real e gera relatórios em markdown.

## Como testar

Utilizamos a biblioteca local `@purecore/one-proof-4-all` para validar o motor.

```bash
# Executar testes unitários
bun packages/prompt-tester/src/test.ts

# Executar o sistema no projeto real
bun packages/prompt-tester/src/run.ts
```

## Relatórios e Documentação

- Os relatórios de execução são salvos na pasta `/reports`.
- A especificação da API está disponível em `openapi.json`.
- Mudanças registradas no [CHANGELOG.md](../../CHANGELOG.md).

---
Fontes: [OpenIntent Specification](https://github.com/purecore/openintent)
