# 🧪 @vibe2founder/<PROJECT_NAME>

> <PROJECT_DESCRIPTION>

## 📋 Sobre os Testes

Este projeto utiliza o framework **@vibe2founder/tests2dialects** para padronização dos testes TDD/BDD.

### 🎯 Dialeitos Suportados

O tests2dialects permite escrever testes em múltiplos dialetos:

#### 1. **Imperativo** (Padrão)
```typescript
import { ImperativeDialect } from '../packages/tests2dialects/dist/src/index.js';

const { ensure, check, that, stub, reset, clear } = ImperativeDialect;

ensure('Nome do Suite de Testes', () => {
  const mock = stub();
  
  reset(() => {
    mock.clear();
  });
  
  check('deve fazer algo', () => {
    mock('teste');
    that(mock).triggered();
    that(mock).calledWith('teste');
  });
});
```

#### 2. **Narrativo** (BDD)
```typescript
import { NarrativeDialect } from '../packages/tests2dialects/dist/src/index.js';

const { intend, scenario, to, standIn, background } = NarrativeDialect;

intend('Funcionalidade', () => {
  const api = standIn();
  
  background(() => {
    api.respondsWith({ status: 200 });
  });
  
  scenario('cenário de sucesso', () => {
    api('/endpoint');
    to(api).received('/endpoint');
  });
});
```

#### 3. **Matemático**
```typescript
import { MathDialect } from '../packages/tests2dialects/dist/src/index.js';

const { axiom, proof, implies, arbitrary } = MathDialect;

axiom('Teorema', () => {
  const fn = arbitrary();
  fn.yields(42);
  
  proof('demonstração', () => {
    const result = fn();
    implies(result).is(42);
  });
});
```

#### 4. **Clássico** (Jest/Vitest compatible)
```typescript
import { ClassicDialect } from '../packages/tests2dialects/dist/src/index.js';

const { describe, it, expect, beforeEach, afterEach } = ClassicDialect;

describe('Suite', () => {
  beforeEach(() => {
    // setup
  });
  
  it('teste', () => {
    expect(1).is(1);
  });
});
```

## 🚀 Rodando os Testes

### Com Vitest
```bash
npm test
# ou
npx vitest run
```

### Com Bun
```bash
bun test
```

### Com Node.js Native Test Runner
```bash
node --test test/*.test.js
```

### Com Jest
```bash
npm run test:jest
```

## 📦 Instalação

O tests2dialects já está incluído na pasta `packages/tests2dialects`.

Para usar em outro projeto:
```bash
npm install @vibe2founder/tests2dialects
# ou
bun add @vibe2founder/tests2dialects
```

## 🔧 Configuração

### Vitest (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

### Jest (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(.*@vibe2founder/tests2dialects.*)/)'
  ],
};
```

## 📚 API Reference

### Assertions
| Método | Descrição |
|--------|-----------|
| `that(x).is(y)` | Igualdade estrita (===) |
| `that(x).toEqual(y)` | Igualdade profunda (JSON) |
| `that(x).isGreaterThan(n)` | Maior que |
| `that(x).includes(y)` | Contém |
| `that(mock).triggered()` | Mock foi chamado |
| `that(mock).calledWith(...)` | Mock chamado com args |
| `that(mock).triggeredCount(n)` | Mock chamado N vezes |

### Mocks/Stubs
| Método | Descrição |
|--------|-----------|
| `stub()` | Cria um stub |
| `stub().forceReturn(x)` | Retorna valor fixo |
| `stub().executes(fn)` | Executa função |
| `mock.clear()` | Limpa chamadas |
| `mock.reset()` | Reset completo |

### Hooks
| Método | Descrição |
|--------|-----------|
| `initAll(fn)` | BeforeAll |
| `disposeAll(fn)` | AfterAll |
| `reset(fn)` | BeforeEach |
| `clear(fn)` | AfterEach |

## 📄 Licença

MIT - Vibe2Founder Team
