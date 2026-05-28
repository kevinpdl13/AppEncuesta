import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sesiones = await prisma.sesionEncuesta.findMany({
    include: {
      respuestas: {
        select: {
          esCorrecta: true,
          puntosObtenidos: true,
          respuestaDada: true,
          valorNumerico: true,
          pregunta: {
            select: {
              id: true,
              enunciado: true,
              tipoPregunta: true,
              respuestaCorrecta: true,
              grupo: { select: { nombre: true } },
              subGrupo: { select: { nombre: true } }
            }
          }
        }
      }
    }
  });
  console.log("TEST PRISMA SELECT:");
  console.log(JSON.stringify(sesiones[0]?.respuestas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
