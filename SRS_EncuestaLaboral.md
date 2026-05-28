ESPECIFICACIÓN DE

**REQUERIMIENTOS DE SOFTWARE**

Sistema Web de Gestión de Encuestas Laborales con Ruleta de Premios

  --------------------- -------------------------------------------------
  **Proyecto**          EncuestaLaboral App

  **Versión**           1.0

  **Fecha**             Abril 2026

  **Estado**            Borrador --- Revisión Inicial

  **Base de datos**     Supabase (PostgreSQL)

  **Autenticación**     Supabase Auth

  **Plataforma**        Aplicación Web --- Responsive (SPA)
  --------------------- -------------------------------------------------

**1. Introducción**

**1.1 Propósito del Documento**

El presente documento describe la Especificación de Requerimientos de
Software (SRS) para el desarrollo de un Sistema Web de Gestión de
Encuestas Laborales. El objetivo es servir como guía técnica y funcional
para el equipo de desarrollo, definiendo con claridad los alcances,
comportamientos esperados, restricciones y casos de uso del sistema.

**1.2 Alcance del Sistema**

El sistema permitirá a organizaciones administrar encuestas laborales
orientadas a sus trabajadores. Los principales módulos incluyen:

-   Panel de Administración de Preguntas (activas y respondidas)

-   Registro simplificado de trabajadores

-   Motor de encuesta Verdadero/Falso con acumulación automática de
    puntos

-   Generación de reportes visuales por usuario

-   Ruleta de premios editable, presentada al finalizar la encuesta

**1.3 Definiciones y Acrónimos**

  --------------------- -------------------------------------------------
  **SRS**               Software Requirements Specification

  **SPA**               Single Page Application

  **RLS**               Row Level Security (Supabase)

  **CRUD**              Create, Read, Update, Delete

  **UI/UX**             Interfaz de Usuario / Experiencia de Usuario

  **Admin**             Usuario con rol de administrador del sistema

  **Trabajador**        Usuario final que responde la encuesta
  --------------------- -------------------------------------------------

**1.4 Referencias**

-   Supabase Documentation --- https://supabase.com/docs

-   IEEE Std 830-1998 --- Recommended Practice for Software Requirements
    Specifications

-   WCAG 2.1 --- Web Content Accessibility Guidelines

**2. Descripción General del Sistema**

**2.1 Perspectiva del Producto**

EncuestaLaboral App es una aplicación web moderna e independiente que
opera sobre infraestructura serverless. Utilizará Supabase como backend
principal, aprovechando su base de datos PostgreSQL, su sistema de
autenticación integrado y las políticas de seguridad a nivel de fila
(RLS) para garantizar el aislamiento de datos entre roles.

**2.2 Roles de Usuario**

  ------------------- ------------------------------------------------------
  **Administrador**   Gestiona preguntas, premios, trabajadores y visualiza
                      reportes completos.

  **Trabajador**      Se registra, responde encuestas asignadas y participa
                      en la ruleta de premios.
  ------------------- ------------------------------------------------------

**2.3 Suposiciones y Dependencias**

-   El sistema requiere conexión a internet para operar con Supabase.

-   Los navegadores objetivo son Chrome, Firefox, Edge y Safari (últimas
    dos versiones).

-   El proyecto front-end se desarrollará preferentemente con React +
    Vite o Next.js.

-   Supabase proveerá autenticación mediante correo/contraseña o magic
    link.

**3. Requerimientos Funcionales**

**3.1 Módulo de Autenticación**

  -------------------------------------------------------------------------------
  **ID**     **Nombre**            **Descripción**                **Prioridad**
  ---------- --------------------- ------------------------------ ---------------
  RF-01      Login de              El admin ingresa con correo y  Alta
             administrador         contraseña mediante Supabase   
                                   Auth. Soporte de sesión        
                                   persistente.                   

  RF-02      Gestión de sesiones   El sistema invalida sesiones   Alta
                                   expiradas y redirige al login. 
                                   Soporte de logout seguro.      

  RF-03      Protección de rutas   Las rutas del panel admin son  Alta
                                   inaccesibles sin autenticación 
                                   válida (guard de ruta).        

  RF-04      Roles de usuario      Supabase RLS distingue el rol  Alta
                                   admin del rol trabajador. Los  
                                   trabajadores no pueden acceder 
                                   al panel admin.                
  -------------------------------------------------------------------------------

**3.2 Módulo de Registro de Trabajadores**

  -------------------------------------------------------------------------------
  **ID**     **Nombre**            **Descripción**                **Prioridad**
  ---------- --------------------- ------------------------------ ---------------
  RF-05      Formulario de         El trabajador ingresa cédula,  Alta
             registro              nombre y apellidos. Sin        
                                   contraseña --- acceso por      
                                   cédula única.                  

  RF-06      Validación de cédula  La cédula debe ser única en el Alta
                                   sistema. Se valida formato     
                                   numérico (10 dígitos, estándar 
                                   Ecuador).                      

  RF-07      Búsqueda de           El admin puede buscar          Media
             trabajador            trabajadores por cédula,       
                                   nombre o apellido con filtro   
                                   en tiempo real.                

  RF-08      Edición y baja        El administrador puede editar  Media
                                   datos del trabajador o         
                                   desactivar su acceso al        
                                   sistema.                       

  RF-09      Acceso por cédula     El trabajador accede a su      Alta
                                   encuesta ingresando solo su    
                                   número de cédula en una        
                                   pantalla dedicada.             
  -------------------------------------------------------------------------------

**3.3 Módulo de Gestión de Preguntas**

  -------------------------------------------------------------------------------
  **ID**     **Nombre**            **Descripción**                **Prioridad**
  ---------- --------------------- ------------------------------ ---------------
  RF-10      Crear pregunta        El admin crea preguntas con:   Alta
                                   enunciado, respuesta correcta  
                                   (Verdadero/Falso) y puntos     
                                   asignados.                     

  RF-11      Editar pregunta       El admin puede modificar       Alta
                                   enunciado, respuesta correcta  
                                   y puntos de cualquier pregunta 
                                   activa.                        

  RF-12      Activar/desactivar    El admin puede marcar          Alta
             pregunta              preguntas como activas o       
                                   inactivas. Solo las activas    
                                   aparecen en encuestas.         

  RF-13      Ordenar preguntas     El admin puede reordenar las   Media
                                   preguntas con arrastre         
                                   (drag-and-drop) o campo de     
                                   orden numérico.                

  RF-14      Panel de preguntas    Vista dedicada con listado de  Alta
             activas               preguntas activas con filtros  
                                   de búsqueda y estado.          

  RF-15      Panel de preguntas    Vista con historial de todas   Alta
             respondidas           las preguntas respondidas por  
                                   trabajadores, con estadísticas 
                                   de acierto.                    
  -------------------------------------------------------------------------------

**3.4 Módulo de Encuesta (Motor Verdadero/Falso)**

  -------------------------------------------------------------------------------
  **ID**     **Nombre**            **Descripción**                **Prioridad**
  ---------- --------------------- ------------------------------ ---------------
  RF-16      Visualización de      Las preguntas se presentan de  Alta
             pregunta              forma secuencial, una por      
                                   pantalla, con botones          
                                   Verdadero y Falso.             

  RF-17      Acumulación de puntos Al seleccionar la respuesta    Alta
                                   correcta, el sistema suma      
                                   automáticamente los puntos     
                                   configurados.                  

  RF-18      Respuesta única por   El trabajador no puede         Alta
             sesión                responder la misma encuesta    
                                   más de una vez por período     
                                   configurado.                   

  RF-19      Progreso de encuesta  Se muestra una barra de        Media
                                   progreso con el número de      
                                   pregunta actual y el total.    

  RF-20      Retroalimentación     Al responder, el sistema       Media
             visual                muestra feedback visual        
                                   inmediato                      
                                   (correcto/incorrecto) antes de 
                                   continuar.                     

  RF-21      Resumen final         Al terminar la encuesta se     Alta
                                   muestra el puntaje total       
                                   obtenido antes de activar la   
                                   ruleta.                        
  -------------------------------------------------------------------------------

**3.5 Módulo de Ruleta de Premios**

  -------------------------------------------------------------------------------
  **ID**     **Nombre**            **Descripción**                **Prioridad**
  ---------- --------------------- ------------------------------ ---------------
  RF-22      Ruleta animada        Al completar la encuesta, se   Alta
                                   presenta una ruleta giratoria  
                                   con animación CSS/Canvas y los 
                                   premios disponibles.           

  RF-23      Gestión de premios    El admin puede agregar,        Alta
             (Admin)               editar, eliminar y reordenar   
                                   los premios que aparecen en la 
                                   ruleta.                        

  RF-24      Probabilidad por      Opcionalmente, el admin puede  Media
             puntaje               asignar probabilidades o       
                                   rangos de puntaje mínimo a     
                                   cada premio.                   

  RF-25      Registro del premio   El resultado de la ruleta se   Alta
             obtenido              registra en la base de datos   
                                   asociado al trabajador y su    
                                   sesión de encuesta.            

  RF-26      Pantalla de resultado Al detenerse la ruleta, se     Media
                                   muestra el premio ganado con   
                                   animación y opción de          
                                   imprimir/compartir.            
  -------------------------------------------------------------------------------

**3.6 Módulo de Reportes**

  -------------------------------------------------------------------------------
  **ID**     **Nombre**            **Descripción**                **Prioridad**
  ---------- --------------------- ------------------------------ ---------------
  RF-27      Dashboard de reportes Panel con gráficos de barras y Alta
                                   tarjetas KPI: total            
                                   encuestados, promedio de       
                                   puntos, participación.         

  RF-28      Tabla de              Listado ordenable de           Alta
             clasificación         trabajadores con columnas:     
                                   nombre, cédula, puntos         
                                   totales, premios obtenidos.    

  RF-29      Filtros de reporte    El admin puede filtrar         Media
                                   reportes por rango de fechas,  
                                   departamento (si aplica) o     
                                   estado.                        

  RF-30      Exportación           El admin puede exportar el     Media
                                   reporte a formato CSV o PDF    
                                   desde el panel.                

  RF-31      Detalle por           Vista individual con todas las Media
             trabajador            encuestas respondidas,         
                                   puntajes por pregunta y        
                                   premios recibidos.             
  -------------------------------------------------------------------------------

**4. Requerimientos No Funcionales**

**4.1 Rendimiento**

-   El tiempo de carga inicial de la aplicación no debe superar los 3
    segundos en una conexión de 10 Mbps.

-   Las respuestas del API (Supabase) deben resolverse en menos de 800ms
    bajo carga normal.

-   La ruleta debe renderizarse fluidamente a mínimo 30 fps en
    dispositivos de gama media.

**4.2 Seguridad**

-   Toda la comunicación entre cliente y Supabase se realizará mediante
    HTTPS/TLS.

-   Se implementarán políticas RLS en Supabase para que cada trabajador
    acceda únicamente a sus propios datos.

-   Las claves de API de Supabase se almacenarán en variables de
    entorno, nunca en el código fuente.

-   El panel de administración estará protegido por autenticación con
    JWT válido.

**4.3 Usabilidad**

-   La interfaz deberá ser completamente responsive: operativa en
    pantallas desde 360px (móvil) hasta 1920px (escritorio).

-   El flujo de registro de un trabajador no debe requerir más de 3
    campos y completarse en menos de 30 segundos.

-   Los íconos y botones de acción tendrán un tamaño mínimo de 44×44 px
    (WCAG 2.1 AA).

-   El sistema incluirá mensajes de error descriptivos en español para
    todas las validaciones.

**4.4 Mantenibilidad**

-   El código fuente se organizará por módulos/features siguiendo
    arquitectura de componentes (React).

-   Se documentarán funciones críticas con JSDoc y se mantendrá un
    README actualizado.

-   Las migraciones de base de datos se gestionarán mediante el sistema
    de migraciones de Supabase CLI.

**4.5 Disponibilidad**

-   La disponibilidad del sistema dependerá del SLA de Supabase (99.9%
    en plan Pro).

-   Se implementará manejo de errores offline con mensajes claros al
    usuario.

**5. Arquitectura y Stack Tecnológico**

**5.1 Diagrama de Arquitectura General**

El sistema sigue una arquitectura JAMstack donde el frontend consume
directamente los servicios de Supabase:

+-----------------------+-----------------------+-----------------------+
| **Frontend (SPA)**    | **Supabase Backend**  | **Infraestructura**   |
+-----------------------+-----------------------+-----------------------+
| React / Next.js       | PostgreSQL            | Vercel / Netlify      |
|                       |                       |                       |
| Tailwind CSS          | Auth (JWT)            | Supabase Cloud        |
|                       |                       |                       |
| Zustand / Redux       | Row Level Security    | GitHub Actions        |
|                       |                       | (CI/CD)               |
| React Query           | Realtime              |                       |
|                       |                       |                       |
| Canvas API (ruleta)   | Storage (archivos)    |                       |
+-----------------------+-----------------------+-----------------------+

**5.2 Modelo de Base de Datos (Supabase/PostgreSQL)**

Las tablas principales del sistema son las siguientes:

**Tabla: trabajadores**

id (UUID), cedula (TEXT UNIQUE), nombres (TEXT), apellidos (TEXT),
activo (BOOL), created_at (TIMESTAMPTZ)

**Tabla: preguntas**

id (UUID), enunciado (TEXT), respuesta_correcta (BOOL), puntos (INT),
activo (BOOL), orden (INT), created_at (TIMESTAMPTZ)

**Tabla: encuestas_sesiones**

id (UUID), trabajador_id (FK), fecha_inicio (TIMESTAMPTZ), fecha_fin
(TIMESTAMPTZ), puntaje_total (INT)

**Tabla: respuestas**

id (UUID), sesion_id (FK), pregunta_id (FK), respuesta_dada (BOOL),
es_correcta (BOOL), puntos_obtenidos (INT)

**Tabla: premios**

id (UUID), nombre (TEXT), descripcion (TEXT), color (TEXT), probabilidad
(NUMERIC), activo (BOOL), orden (INT)

**Tabla: resultados_ruleta**

id (UUID), sesion_id (FK), premio_id (FK), obtenido_en (TIMESTAMPTZ)

**6. Descripción de Interfaces de Usuario**

**6.1 Pantalla de Acceso del Trabajador**

-   Campo único: Número de Cédula.

-   Botón \'Ingresar a mi Encuesta\' de gran tamaño y alto contraste.

-   Si la cédula no existe, se muestra opción de registro rápido en el
    mismo lugar.

**6.2 Flujo de Encuesta**

1.  Bienvenida personalizada con nombre del trabajador y número de
    preguntas.

2.  Presentación secuencial de preguntas con botones Verdadero (verde) /
    Falso (rojo).

3.  Feedback inmediato tras cada respuesta (color + ícono + puntos
    ganados).

4.  Barra de progreso en la parte superior durante todo el flujo.

5.  Pantalla de resumen: puntaje total, preguntas correctas, tiempo
    tomado.

6.  Transición animada hacia la ruleta de premios.

**6.3 Panel Administrativo**

-   Barra lateral de navegación con íconos para cada módulo.

-   Dashboard principal con KPIs y gráficos en tiempo real.

-   Sección \'Preguntas Activas\': tabla con CRUD completo y toggle de
    activación.

-   Sección \'Historial de Respuestas\': preguntas respondidas con
    estadísticas de acierto.

-   Sección \'Trabajadores\': registro, búsqueda y gestión de usuarios.

-   Sección \'Premios\': editor de premios de la ruleta con
    drag-and-drop y vista previa.

-   Sección \'Reportes\': gráficos interactivos, tabla de clasificación
    y exportación.

**6.4 Ruleta de Premios**

-   Animación giratoria generada con Canvas API o librería SVG.

-   Segmentos con colores y nombres de premios configurables desde el
    panel admin.

-   Botón \'Girar\' activado tras mostrar el puntaje final.

-   Animación de desaceleración gradual y señalador fijo (puntero de
    ruleta).

-   Modal de celebración con el premio obtenido al detenerse.

**7. Casos de Uso Principales**

**CU-01: Trabajador responde encuesta**

  --------------------- -------------------------------------------------
  **Actor**             Trabajador

  **Precondición**      El trabajador está registrado y la encuesta tiene
                        preguntas activas.

  **Flujo principal**   1\. Ingresa cédula → 2. Sistema carga preguntas
                        activas → 3. Responde V/F pregunta por pregunta →
                        4. Sistema acumula puntos → 5. Muestra resumen →
                        6. Activa ruleta.

  **Flujo alterno**     Si ya respondió la encuesta hoy, el sistema
                        informa y no permite doble participación.

  **Postcondición**     Sesión y respuestas guardadas en BD. Resultado de
                        ruleta registrado.
  --------------------- -------------------------------------------------

**CU-02: Administrador gestiona preguntas**

  --------------------- -------------------------------------------------
  **Actor**             Administrador

  **Precondición**      Admin autenticado en el panel.

  **Flujo principal**   1\. Navega a \'Preguntas\' → 2.
                        Crea/edita/elimina preguntas → 3. Configura
                        respuesta correcta y puntos → 4. Activa/desactiva
                        pregunta → 5. Guarda cambios.

  **Flujo alterno**     Si intenta eliminar una pregunta con respuestas
                        asociadas, el sistema advierte y pide
                        confirmación.

  **Postcondición**     Cambios reflejados en tiempo real en la encuesta
                        de los trabajadores.
  --------------------- -------------------------------------------------

**CU-03: Administrador gestiona ruleta**

  --------------------- -------------------------------------------------
  **Actor**             Administrador

  **Precondición**      Admin autenticado. Existen premios en el sistema.

  **Flujo principal**   1\. Navega a \'Premios\' → 2.
                        Agrega/edita/elimina premios → 3. Configura
                        nombre, color e icono → 4. Guarda → 5. Vista
                        previa de la ruleta actualizada.

  **Flujo alterno**     Si se eliminan todos los premios, el sistema
                        advierte que la ruleta requiere al menos 2
                        premios.

  **Postcondición**     La ruleta de todos los trabajadores refleja los
                        premios actualizados.
  --------------------- -------------------------------------------------

**CU-04: Administrador genera reporte**

  --------------------- -------------------------------------------------
  **Actor**             Administrador

  **Precondición**      Existen trabajadores que han completado
                        encuestas.

  **Flujo principal**   1\. Navega a \'Reportes\' → 2. Selecciona filtros
                        (fechas, etc.) → 3. Visualiza gráficos y tabla de
                        clasificación → 4. Exporta a CSV o PDF.

  **Flujo alterno**     Si no hay datos en el período seleccionado, se
                        muestra estado vacío con mensaje descriptivo.

  **Postcondición**     Reporte descargado o visualizado correctamente.
  --------------------- -------------------------------------------------

**8. Plan de Implementación Sugerido**

  --------------------------------------------------------------------------------
  **Fase**   **Duración**     **Entregables**                      **Prioridad**
  ---------- ---------------- ------------------------------------ ---------------
  Fase 1     2 semanas        Setup Supabase, Auth, tablas BD,     Alta
                              registro de trabajadores             

  Fase 2     2 semanas        Panel admin de preguntas (CRUD),     Alta
                              motor de encuesta V/F                

  Fase 3     1 semana         Acumulación de puntos, sesiones,     Alta
                              historial de respuestas              

  Fase 4     1 semana         Ruleta de premios animada + panel de Alta
                              gestión de premios                   

  Fase 5     1 semana         Dashboard de reportes, gráficos y    Media
                              exportación CSV/PDF                  

  Fase 6     1 semana         QA, ajustes de UX/UI responsive,     Media
                              pruebas y despliegue                 
  --------------------------------------------------------------------------------

**8.1 Criterios de Aceptación por Módulo**

-   Autenticación: el admin puede iniciar y cerrar sesión. Las rutas
    privadas redirigen si no hay sesión.

-   Trabajadores: se puede registrar un trabajador con cédula única en
    menos de 30 segundos.

-   Preguntas: el admin puede crear, editar, activar/desactivar y
    eliminar preguntas sin errores.

-   Encuesta: el trabajador responde la encuesta y el sistema calcula y
    guarda el puntaje correctamente.

-   Ruleta: la ruleta gira, se detiene y registra el premio. El admin
    puede modificar los premios en cualquier momento.

-   Reportes: el admin visualiza el ranking de trabajadores y puede
    exportarlo correctamente.

**9. Anexos**

**Anexo A: Estructura de Carpetas Sugerida (Frontend)**

src/

├── components/ \# Componentes reutilizables (Button, Modal, Table\...)

├── features/

│ ├── auth/ \# Login, guards de ruta

│ ├── trabajadores/ \# Registro, listado, edición

│ ├── preguntas/ \# CRUD preguntas, historial

│ ├── encuesta/ \# Motor de encuesta V/F

│ ├── ruleta/ \# Componente ruleta + gestión de premios

│ └── reportes/ \# Dashboard, gráficos, exportación

├── lib/

│ └── supabaseClient.js \# Inicialización Supabase

├── store/ \# Estado global (Zustand/Redux)

└── pages/ \# Rutas principales

**Anexo B: Variables de Entorno Requeridas**

VITE_SUPABASE_URL=https://xxxx.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs\...

VITE_APP_NAME=EncuestaLaboral

*Fin del Documento SRS --- EncuestaLaboral App v1.0*
