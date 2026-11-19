# Livro Aberto — Fase 0 (protótipo estático)

App de apoio à gestão financeira de jovens casais. **Fase 0**: tudo corre no browser, sem servidor nem base de dados. Serve para validar o formulário, o diagnóstico e o PT/ES/EN antes de ligar o Supabase (Fase 1).

## O que existe
- Formulário: receitas, despesas, empréstimos e cartões, investimentos.
- Diagnóstico preliminar: totais, sobra mensal, taxa de poupança, peso das prestações, dívidas por taxa, juros mensais estimados, pontos de atenção.
- PT/ES/EN, rotas `/pt/`, `/es/`, `/en/`, hreflang e sitemap.
- Exportação dos dados em JSON.

## O que NÃO existe (Fase 1)
Login, casal com dois acessos, caderno partilhado, dados privados vs partilhados, backups, textos legais completos (Privacidade, Termos, Cookies em pt/es/en).

## Privacidade
Os dados ficam em `localStorage` do browser. Não são enviados para lado nenhum. **Usa só dados fictícios.**

## Instalar e correr
```
npm ci
npm run dev        # http://localhost:3000
npm test           # regras de negócio, traduções, formatos
npm run typecheck
npm run build      # gera a pasta out/ (site estático)
```

## Estrutura
- `src/domain/` regras de negócio puras (sem React, sem browser). Aqui vive o diagnóstico.
- `src/i18n/` idiomas, formatação por locale (Intl) e tradutor.
- `locales/` `pt.json`, `es.json`, `en.json`.
- `src/components/`, `src/app/` interface.
- `tests/` testes automáticos.

## Adicionar uma língua
1. Cria `locales/fr.json` com as mesmas chaves de `pt.json`.
2. Em `src/i18n/config.ts` adiciona `"fr"` a `LOCALES` e a etiqueta Intl a `INTL_TAGS`.
3. Em `src/i18n/messages.ts` importa o ficheiro.
4. Adiciona `language.fr` aos 3 ficheiros existentes.
O teste `tests/i18n.test.ts` falha se faltar ou sobrar alguma chave.

## Adicionar uma tradução
Acrescenta a chave nos **três** ficheiros. Nunca escrevas texto visível diretamente no código: usa `t("chave")`.

## Deploy no GitHub Pages
Workflow manual `Deploy to GitHub Pages (manual)`. Em repositório privado o Pages pode exigir plano pago. Em Settings > Pages escolhe "GitHub Actions". Rollback: volta a correr o workflow num commit anterior.

## Revisão pendente
As traduções ES e EN foram escritas por IA e **precisam de revisão humana** antes de uso real. Os limiares do diagnóstico (poupança < 10%, prestações > 35%, TAN de cartões >= 15%, empréstimos >= 10%) são heurísticas de coaching em `src/domain/diagnosis.ts`, a rever por ti.
