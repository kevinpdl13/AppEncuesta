import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Iniciando seed...');
  
  try {
    const adminEmail = 'admin@encuesta.com';
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.admin.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Administrador Principal'
        }
      });
      console.log('✅ Admin creado: admin@encuesta.com / admin123');
    } else {
      console.log('ℹ️ El admin ya existe.');
    }

    // Opcional: Crear un tema por defecto
    const existingTema = await prisma.tema.findFirst({
      where: { titulo: 'Encuesta General' }
    });

    if (!existingTema) {
      await prisma.tema.create({
        data: {
          titulo: 'Encuesta General',
          descripcion: 'Tema inicial para encuestas laborales'
        }
      });
      console.log('✅ Tema "Encuesta General" creado.');
    }

  } catch (error) {
    console.error('❌ Error en el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
