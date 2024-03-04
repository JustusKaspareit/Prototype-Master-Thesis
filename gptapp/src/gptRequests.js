import OpenAI from "openai";
import {
    feedbackInstruction,
    feedpackDescription,
    modelDescription, modelExample,
    modelPrompt, updateDescription, updatePrompt1, updatePrompt2
} from "@/assets/prompts";

const openai = new OpenAI({
    apiKey: "**placeholder**",
    dangerouslyAllowBrowser: true
})

//Create initial process

export async function requestModelJSON(description){
    let response = await openai.chat.completions.create({
        messages: [{role: "system", content: modelDescription},
            {role: "user", content: modelPrompt + description},
            {role: "assistant", content: modelExample},
            {role: "user", content: description}],
        model: "**placeholder**"
    })
    let answer = response.choices[0].message.content
    return JSON.parse(answer)
}

//Update Process

export async function changeModelJSON(model,prompt){
    let s = ""
    let query1 = s+updatePrompt1+JSON.stringify(model)
    let query2 = s+updatePrompt2+prompt
    let response = await openai.chat.completions.create({
        messages: [
            {role: "system", content: updateDescription},
            {role: "user", content: query1},
            {role: "user", content: query2}
        ],
        model: "**placeholder**"
    })
    let answer = response.choices[0].message.content
    return JSON.parse(answer)
}

//Get Textual Feedback

export async function getFeedback(history){
    let prompt= ""
    for (let i = history.length-1; i >=0; i--){
        if(history[i].includes('User:')){
            prompt+=history[i]+", "
        }
    }
    let response = await openai.chat.completions.create({
        messages: [{role: "system", content: feedpackDescription},
            {role: "user", content: prompt},
            {role: "user", content: feedbackInstruction}],
        model: "gpt-4-turbo-preview"
    })
    return response.choices[0].message.content
}

//Get Text from Speech

export async function getTextFromSpeech(blob) {
    let file = new File([blob], "requestFile.wav")
    let response = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: file,
    })
    return response.text
}