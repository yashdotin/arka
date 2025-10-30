import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
   baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "meta/llama-3.3-70b-instruct",
    messages: [{"role":"user","content":"give me 10 lines poem on nature"}],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
    stream: true
  })
   
  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '')
  }
  
}

main();