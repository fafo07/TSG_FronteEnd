# TSC Registry Frontend (Angular)

Frontend Angular 17+ (standalone) para registro/gestão de pacientes com Esclerose Tuberosa (TSC), com autenticação JWT, interceptor de token, refresh e rotas protegidas.

## Stack
- Angular standalone + Router + HttpClient + Reactive Forms
- Angular Material
- ngx-translate (pt-BR)

## Requisitos
- Node.js 20+
- npm 10+

## Instalação
```bash
npm install
```

## Configuração da API
Defina a URL base em `src/app/core/config/environment.ts`:

```ts
apiBaseUrl: 'http://127.0.0.1:8000/api/v1'
```

> A aplicação usa URL absoluta da API no `environment.ts` (sem depender de proxy no login).

## Executar
```bash
npm start
```

No Windows (CMD):

```bat
cd "C:\Users\D_Faf\OneDrive\Documentos\Proyecto angui Frontend\TSG_FronteEnd" && git pull --rebase && npm install && npm start
```

## Rotas
- Pública: `/login`
- Protegidas:
  - `/dashboard`
  - `/patients`
  - `/patients/:id`
  - `/patients/:id/genetic-tests`
  - `/patients/:id/manifestations`
  - `/manifestations/:mid`
  - `/manifestations/:mid/findings`
  - `/patients/:id/treatments`
  - `/patients/:id/adverse-events`
  - `/patients/:id/contacts`
  - `/catalogs`, `/catalogs/countries`, `/catalogs/systems`, `/catalogs/findings`

## O que já está implementado
- Login JWT + refresh e bloqueio de rotas privadas.
- Shell com sidebar/topbar.
- CRUD básico de pacientes.
- Cadastro/listagem de avaliações por paciente.
- Checklist de achados por manifestação (replace).
- Cadastro/listagem de tratamentos por paciente com seleção obrigatória da avaliação (`manifestation_id`).
- Cadastro/listagem de efeitos adversos por paciente com vínculo opcional a tratamento do próprio paciente.
- Cadastro/vinculação de contatos por paciente com confirmação ao marcar contato principal.
- CRUD básico de catálogos (países, sistemas e achados).

## Fluxo sugerido para validação manual
1. Acessar `/login`.
2. Fazer login e validar redirecionamento para `/dashboard`.
3. Abrir `/patients`, criar paciente e entrar no detalhe.
4. Cadastrar teste genético.
5. Cadastrar avaliação e abrir detalhe da avaliação.
6. Abrir `/manifestations/:mid/findings` e salvar checklist.
7. Criar tratamento e validar `manifestation_id` obrigatório.
8. Criar efeito adverso e contato vinculado ao paciente.
9. Abrir `/catalogs` e validar criação de países/sistemas/achados.

## Estrutura
- `src/app/core/auth`: auth service, guard, interceptor, session store.
- `src/app/core/api`: services HTTP por recurso.
- `src/app/features`: páginas por feature.
- `src/app/shared/models`: interfaces TS alinhadas ao backend.
- `src/app/shared/validators`: validadores reutilizáveis.
- `src/assets/i18n`: traduções pt-BR.
