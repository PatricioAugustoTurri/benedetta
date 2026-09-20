# Originales

Archivos de origen. **No se publican**: quedan fuera de `public/` a propósito,
así el build no sirve un archivo que ninguna página pide.

| Archivo | Qué es | Qué se deriva |
| --- | --- | --- |
| `Opera_senza_titolo.jpg` | El lettering de "illustrando" escrito a mano por Benedetta. Escaneado a 300 dpi, 838×217, fondo blanco, sin transparencia. | `public/illustrando-wordmark.png` |

## Cómo se regenera el logotipo

`.tmp-assets/` no se versiona; el procedimiento sí, porque el recorte no es
obvio y hay que poder repetirlo si llega un escaneo nuevo:

1. Pasar a escala de grises y leer la luminancia de cada píxel.
2. Derivar el alfa invirtiendo la luminancia, con punto de blanco 244 y punto
   de negro 24. El punto de blanco mata el ringing del JPEG alrededor del
   trazo; bajarlo más empieza a comerse el grano del lápiz, que es lo único
   que hace que el logotipo se lea como hecho a mano y no como una fuente.
3. Pintar el RGB con la tinta del sistema (`#1c1a16`) y dejar que el alfa
   cargue toda la textura.
4. Recortar a la caja de tinta real (alfa > 8), sin margen: el aire alrededor
   del logotipo lo pone el CSS, no el archivo.
5. Exportar PNG sin reescalar. El original da 740×147, que es entre 3 y 4
   veces el tamaño al que se muestra: alcanza para pantallas de alta densidad.

No pasarlo a SVG: un trazado vectorial perdería el grano del lápiz, que es
justamente lo que distingue esta firma de una tipografía caligráfica.
