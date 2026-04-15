api key =sk-648d241980834014b1acf1fbb70189db  

import OpenAI from "openai";
import process from 'process';

// 初始化 openai 客户端
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY, // 从环境变量读取
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});
let isAnswering = false;
async function main() {
    try {
        const messages = [{ role: 'user', content: '你是谁' }];
        const stream = await openai.chat.completions.create({
            model: 'qwen3-max-2026-01-23',
            messages,
            stream: true,
            enable_thinking: true
        });
        console.log('\n' + '='.repeat(20) + '思考过程' + '='.repeat(20));
        for await (const chunk of stream) {
            const delta = chunk.choices[0].delta;
            if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
                if (!isAnswering) {
                    process.stdout.write(delta.reasoning_content);
                }
            }
            if (delta.content !== undefined && delta.content) {
                if (!isAnswering) {
                    console.log('\n' + '='.repeat(20) + '完整回复' + '='.repeat(20));
                    isAnswering = true;
                }
                process.stdout.write(delta.content);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
main();



import OpenAI from "openai";
const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
);
const completion = await openai.chat.completions.create({
    model: "qwen-flash-character",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "你是谁？" }
    ],
    stream: true
});
for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0].delta.content);
}






