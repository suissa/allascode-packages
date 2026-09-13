# Specification: Generic Formatter for Nested Action Responses

## Requisitos de entrada
- `formatGeneric` deve receber um `ActionResponse` com propriedade `data` possivelmente contendo objetos aninhados, arrays, etc.
- As propriedades de `data` devem estar no seu formato raw or raw_result (JSON).

## Requisitos de saída
- A função deve formatar os dados de forma recursiva.
- As chaves de objeto devem ser traduzidas para PT-BR usando um dicionário embutido ou capitalizadas e tratadas caso não estejam nele.
- Formatos de valor (por exemplo, moedas e porcentagens) devem ser renderizados de forma legível (e.g., `R$ 450,40`, `0.00%`).
- O retorno não deve ficar contido no JSON final do envio, mas no texto gerado na interface de WhatsApp.
- O fallback deve cobrir todas as saídas de qualquer intent não detalhada especificamente.

## Invariantes
- A estrutura base e os intents tratados em formato pré-definido não devem ser modificados.
- Retorno de mensagens puras ou "successo sem dados" continua comportando-se idênticamente originais.

## Evidências
- A saída do script `test-formatter2.ts` mostra uma compilação perfeita das meta properties de 'Hoje', 'Ontem', e 'Comparação' sem recorrer a json stringified para objetos aninhados.
- Testes confirmam chaves transladadas e números de faturamento/dinheiro localizados `R$ xx,xx`.
