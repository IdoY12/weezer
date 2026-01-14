import { NextFunction, Request, Response } from "express";
import openAIClient from "../../openai/openai";

export async function translate(req: Request, res: Response, next: NextFunction) {
    try {
        const { textToTranslate } = req.body

        const completion = await openAIClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user', content: `
                Translate the following text into 7 different languages.
                Choose surprising and diverse languages (not the obvious ones like English, Spanish, or French).
                For each translation, clearly label the language name.

                Text to translate:
                "${textToTranslate}"
            ` },
            ],
        });

        console.log(completion.choices[0].message.content);
        res.json({ result: completion.choices[0].message.content });
    } catch (e) {
        next(e)
    }
}
