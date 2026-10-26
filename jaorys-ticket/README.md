# Jaory's Ticket

Sitio web estático para registrar metas de compra y convertir oportunidades de gasto en tickets.

## Cómo abrirlo
1. Descarga y descomprime `jaorys-ticket.zip`.
2. Abre `index.html` en Chrome, Edge o Firefox.
3. No requiere instalación ni servidor.

## Funciones
- Añadir metas con nombre, precio, categoría y nota.
- Registrar oportunidades de mecato, comida rápida, bebida u otro gasto con valores variables.
- Cada $5.000 equivale a 1 ticket para las metas de compra; los tickets pueden ser fraccionados. El resumen muestra el equivalente en efectivo de los tickets disponibles y de los asignados a objetos pendientes.
- Asignar tickets disponibles a una meta.
- Estados: En progreso, Permitido comprar y Ya comprado.
- Editar o eliminar metas; al eliminar una meta, sus tickets vuelven al saldo disponible.
- Historial de movimientos, guardado local automático y exportación de respaldo JSON.

## Almacenamiento y límites
Los datos se guardan en el `localStorage` del navegador y dispositivo donde abras la página. No hay cuenta ni sincronización entre dispositivos. Usa el botón de exportar para descargar un respaldo.

## Regla de cálculo
La meta se completa cuando los tickets asignados alcanzan `precio de la meta ÷ 5.000`. Cada oportunidad registrada añade `valor de la oportunidad ÷ 5.000` tickets disponibles. La oportunidad puede tener un valor distinto; por ejemplo, una hamburguesa de $40.000 registra 8 tickets si ese es el valor que ingresas.

## Seguimiento de hábitos (actualización)
- Racha diaria sin Shorts y planta visual por hitos (7, 14, 30, 90, 180 y 365 días).
- Registro diario: 0 minutos de Shorts = 0,02 tickets; de 1 a 15 minutos = 0,01 tickets; más de 15 minutos = 0 tickets. La racha solo avanza en días registrados con 0 minutos.
- Cumplir el objetivo de evitar mecato, dulces y comida rápida = 0,02 tickets.
- Dormir 8 horas o más = 0,02 tickets por día registrado.
- Cada comida registrada en la sección personal, por separado, suma 0,2 tickets.
- Mensaje personalizado cuando hay siete días seguidos con 0 minutos de Shorts, objetivo de evitar mecato/comida rápida marcado y al menos 8 horas de sueño.
- Manual de acompañamiento por etapas, prevención de tropiezos y revisión semanal.

**Almacenamiento importante:** todos los datos se guardan localmente en el navegador/dispositivo. Aunque se publique la página, no se comparten automáticamente con la persona que hace seguimiento ni entre dispositivos. Para un seguimiento realmente compartido hace falta una base de datos en línea y control de acceso. Descarga periódicamente el respaldo JSON. Las fases son orientativas, no etapas clínicas universales.
