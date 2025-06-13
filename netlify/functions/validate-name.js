// وظيفة Netlify للتحقق من الاسم من خلال OpenAI API

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const name = body.name;
    const prompt = body.prompt;

    if (!name || typeof name !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "الاسم مطلوب ويجب أن يكون نصًا" }),
      };
    }

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });
    console.log(response.output_text);

    return {
      statusCode: 200,
      body: response.output_text,
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "حدث خطأ أثناء معالجة الطلب" }),
    };
  }
};;