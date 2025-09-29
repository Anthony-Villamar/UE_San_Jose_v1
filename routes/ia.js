// import express from 'express';
// import OpenAI from 'openai';

// const iaRouter = express.Router();
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// iaRouter.post('/generar-mensaje', async (req, res) => {
//   const { puntaje } = req.body;

//   if (typeof puntaje !== 'number') {
//     return res.status(400).json({ mensaje: "El puntaje debe ser un número" });
//   }

//   try {
//     // Generar mensaje usando GPT
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: "Eres un asistente que da mensajes motivacionales personalizados."
//         },
//         {
//           role: "user",
//           content: `Dame un mensaje motivacional breve basado en un puntaje de desempeño que va de 0 a 5. El puntaje es ${puntaje}. Hazlo positivo y alentador.`
//         }
//       ],
//       temperature: 0.7
//     });

//     const mensaje = completion.choices[0].message.content.trim();

//     res.json({ mensaje });

//   } catch (err) {
//     console.error("Error al generar mensaje con OpenAI:", err);
//     res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
//   }
// });

// export default iaRouter;


// ia.js
import express from 'express';
import OpenAI from 'openai';

const iaRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

iaRouter.post('/generar-mensaje', async (req, res) => {
  const { categoria, puntaje } = req.body;

  if (!categoria || typeof puntaje !== 'number') {
    return res.status(400).json({ mensaje: "Se requiere 'categoria' y 'puntaje' numérico" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que da mensajes motivacionales positivos y breves."
        },
        {
          role: "user",
          content: `Genera un mensaje motivacional breve para un usuario sobre su ${categoria} con puntaje ${puntaje} de 0 a 5. Hazlo alentador y constructivo.`
        }
      ],
      temperature: 0.7
    });

    const mensaje = completion.choices[0].message.content.trim();
    res.json({ mensaje });

  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
  }
});

export default iaRouter;
