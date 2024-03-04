import os
import openai

openai.api_key = "**placeholder**"
filePath = "modelGeneration.jsonl"

def tune(fileId):
    response = openai.FineTuningJob.create(training_file=fileId, model="gpt-3.5-turbo")
    print('Job ID:' + response['id'])

def createFile():
    file = open(filePath, "rb")
    response = openai.File.create(
        file=file,
        purpose='fine-tune'
    )
    print(response['id'])
    tune(response['id'])

# Script
createFile()
print(openai.FineTuningJob.list(limit=10))