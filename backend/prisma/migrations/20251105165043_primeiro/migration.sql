-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "quantidadeInicial" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "categoria" TEXT,
    "dataCompra" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntradaProduto" (
    "id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "EntradaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saidaProduto" (
    "id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "saidaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrimonio" (
    "numeroTombo" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "numeroNotaFiscal" TEXT,
    "imagem" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patrimonio_pkey" PRIMARY KEY ("numeroTombo")
);

-- CreateTable
CREATE TABLE "Movimentacao" (
    "id" TEXT NOT NULL,
    "patrimonioId" INTEGER NOT NULL,
    "deLocal" TEXT,
    "paraLocal" TEXT,
    "deResponsavel" TEXT,
    "paraResponsavel" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- AddForeignKey
ALTER TABLE "EntradaProduto" ADD CONSTRAINT "EntradaProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saidaProduto" ADD CONSTRAINT "saidaProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_patrimonioId_fkey" FOREIGN KEY ("patrimonioId") REFERENCES "Patrimonio"("numeroTombo") ON DELETE RESTRICT ON UPDATE CASCADE;
