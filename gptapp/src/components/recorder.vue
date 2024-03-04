<script>
import OpenAI from "openai"
import {getTextFromSpeech} from "../gptRequests";

export default {
  props: ['duration'], //timer
  name: "recorder-vue",
  data() {
    return {
      feedback: null, //Feedback by gpt
      description: null, //latest process description
      rec: null, //recorder
      openai: null, //openAiInstance
      audioChunks: [], //recordedAudio
      speechMode: false, //boolean for text/speech
      requestStart: null, //timerStart
      loading: false, //timerStop
      firstRequest: true, //record vs. update
      recording: false //record/update vs. stop
    }
  },
  emits:
      ['createModel','updateModel']
  ,
  methods: {

    //Speech processing

    record() {
      this.recording = true //change Button
      console.log("Recording started")
      this.rec.start()
    },
    update() {
      this.recording = true //change Button
      console.log("Recording for Update started")
      this.rec.start()
    },
    stop() {
      this.recording = false //change Button
      console.log("Recording stopped")
      this.rec.stop() //stop recording --> Triggers handler
    },
    async handle(blob){
      //Choose a GPT action when the recording is stopped
      this.description = await getTextFromSpeech(blob)
      if(this.firstRequest == true){
        await this.createModel()
        this.firstRequest = false
      } else {
        await this.updateModel()
      }
    },

    //TextProcessing

    async submitText(){
      //When the submit button is pressed
      this.setDescription()
      await this.createModel()
      this.firstRequest = false
    },
    async updateText(){
      //when the update button is pressed
      this.setDescription()
      await this.updateModel()
    },

    //Modelling functions

    async createModel() {
      this.$emit('createModel', this.description)
    },
    async updateModel(){
      this.$emit('updateModel', this.description)
    },

    //Helper functions

    initHandler(stream) {
      this.openai = new OpenAI({
        apiKey: "**placeholder**",
        dangerouslyAllowBrowser: true
      })
      this.rec = new MediaRecorder(stream);
      this.rec.ondataavailable = e => {
        this.audioChunks.push(e.data);
        if (this.rec.state == "inactive") {
          let blob = new Blob(this.audioChunks, {type: 'audio/mp3'});
          this.audioChunks = []
          this.handle(blob)
        }
      }
    },
    async handleEnter(){
      if(this.firstRequest == true){
        await this.submitText()
      } else {
        await this.updateText()
      }
    },
    setDescription(){
      this.description = document.getElementById('textarea').value
      document.getElementById('textarea').value = ''
    }
  },
  mounted() {
    navigator.mediaDevices.getUserMedia({audio: true})
        .then(stream => {
          this.initHandler(stream)
        })
  }
}

</script>

<template>
  <div id="recorder-wrapper">
    <div class="column">
      <textarea @keyup.enter = "handleEnter" id="textarea" spellcheck="false" v-if="speechMode==false" placeholder="Describe your process"/>
    </div>
    <div class="rec-column button-line">
      <div style="margin-right: 10px">
        <button  v-if="recording == false && firstRequest == true && speechMode==true" @click="record">Record</button>
        <button  v-if="recording == false && firstRequest == false && speechMode==true" @click="update">Update</button>
        <button v-if="firstRequest == true && speechMode == false" @click="submitText">Submit</button>
        <button v-if="firstRequest == false && speechMode == false" @click="updateText">Update</button>
        <button v-if="recording == true" @click="stop">Stop</button>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; margin-left: 10px">
        <p id="speechLabel">Speech Mode</p>
        <input type="checkbox" id="speech" name="Speech Mode" v-model="speechMode">
      </div>
    </div>
    <div class="rec-column" style="height: 10px"></div>
    <p id="timer" v-if="duration!=null">{{duration}}</p>
  </div>
</template>

<style scoped>
.button-line{
}
#recorder-wrapper{
  background: darkslategray;
  margin-top: 10px;
  border-radius: 10px;
  width: 80%;
  padding: 20px 20px 10px 20px;
}
p{
  font-size: 10px;
  text-align: center;
  margin: 0px;
}
.rec-column{
  display: flex;
  justify-content: center;
  align-items: center;
}
.column{
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
button{
  height: 40px;
  width: 100px;
  border: none;
  border-radius: 5px;
  color: darkslategray;
  font-weight: bold;
  cursor: pointer;
  margin: 5px;
}
textarea{
  resize: none;
  border-radius: 10px;
  width: 100%;
  height: 80px;
  padding: 10px;
  language: english;
  margin-bottom: 15px;
}
#speechLabel{
  font-size: 13px;
  font-weight: bold;
  margin-right: 5px;
}
</style>