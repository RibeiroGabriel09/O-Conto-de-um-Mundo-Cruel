# O Conto de um Mundo Cruel | Criador de Ficha

Projeto React + TypeScript + Vite para criar fichas básicas de um RPG medieval sombrio.

## Rodar durante desenvolvimento

```bash
npm install
npm run dev
```

## Publicar no GitHub Pages

O jeito mais simples é publicar a pasta `docs/`, que já contém o site compilado.

No GitHub:

1. Entre em `Settings`.
2. Vá em `Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Em `Branch`, escolha `main`.
5. Na pasta, escolha `/docs`.
6. Clique em `Save`.

O link público aparecerá em `Settings > Pages`.

Sempre que alterar o projeto, rode:

```bash
npm install
npm run build:pages
git add .
git commit -m "Atualiza site"
git push
```

## Abrir com Live Server

O Live Server não compila arquivos `.tsx` sozinho. Para usar mesmo assim:

```bash
npm run build
```

Depois abra a pasta `dist` no VS Code e use o Live Server no `dist/index.html`.

Para o Live Server atualizar enquanto você edita, deixe este comando rodando em um terminal:

```bash
npm run live-server
```

Com isso, edite os arquivos em `src/` e deixe o Live Server aberto em `dist/index.html`.

## Estrutura simples

```text
src/
  App.tsx
  main.tsx
  style.css
```

O app usa JSON como fluxo principal:

- `Baixar JSON` exporta a ficha completa.
- `Importar JSON` abre uma ficha recebida de outra pessoa.
- Também dá para colar o JSON direto no campo da seção `JSON`.

Não há mais sistema de fichas salvas localmente.
