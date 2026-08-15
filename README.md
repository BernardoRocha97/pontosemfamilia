# Pontos de Família

App de tarefas de casa gamificadas para o Bernardo e a Beatriz — tarefas com pontos
positivos/negativos, pontos bónus avulsos, ranking (semana/mês/ano), streak e resumo
semanal com campeã(o) da semana.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Sem nenhuma configuração adicional, a app arranca em **modo de demonstração**: os
dados (perfis, tarefas, pontuações) ficam guardados só no `localStorage` do browser,
sem sincronizar entre telemóveis. O PIN de ambos os perfis nesse modo é `0000`.

## Ligar ao Supabase (para sincronizar entre os dois telemóveis)

1. Cria uma conta e um projeto em [supabase.com](https://supabase.com) (grátis).
2. No SQL Editor do projeto, corre o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isto cria as tabelas, as regras de segurança e semeia os dois perfis (Bernardo e
   Beatriz, PIN inicial `0000`) e uma lista de tarefas de exemplo.
3. Em **Project Settings → API**, copia o `Project URL` e a `anon public key`.
4. Copia `.env.example` para `.env` e preenche:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Reinicia `npm run dev` — a app passa a ler/escrever no Supabase, com
   sincronização em tempo real entre os dois telemóveis. Mudem os PINs nas
   Definições assim que estiver ligado.

## Deploy (acesso de fora de casa)

Depois de ligar o Supabase, faz deploy da pasta a um serviço como o Vercel (importar
o repositório, adicionar as duas variáveis de ambiente `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` nas definições do projeto). A app é instalável como PWA a
partir do browser do telemóvel ("Adicionar ao ecrã principal").
