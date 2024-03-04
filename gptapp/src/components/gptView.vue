<template>
  <div id="wrapper">
    <div v-if="recorderBool == true" id="recorder-column">
      <div style="width: 100%">
        <h2>BPMN Modeler</h2>
        <div class="column">
          <recorder ref="recorder" :duration="duration" @createModel="(processDescription) => createModel(processDescription,false)" @updateModel="(updateDescription) => createModel(updateDescription,true)"/>
        </div>
        <div class="column" v-for="message in messageHistory" :key="message">
          <div class="text-wrapper">
            <p>{{ message }}</p>
          </div>
        </div>
      </div>
    </div>
  <div id="model-column" v-if="firstModel == true">
    <div style="width: 100%">
    <div class="column">
      <p v-if="loading == true">Loading...</p>
      <p v-if="reloading == true">Reloading...</p>
      <div id="bpmn-wrapper" v-else>
        <div style="height: 100%">
          <div class="model" style="height: 100%">
            <div class="column" style="height: 85%">
              <div id="canvas"></div>
            </div>
            <div class="column" style="height: 20%; display: flex; align-items: center">
              <button @click="exportBPMN" style="margin-right: 10px">Export BPMN</button>
              <button v-if="this.undo == true" @click="undoFunction" style="margin-left: 10px">Undo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="this.participants.length > 0" class="column">
      <div class="text-wrapper">
        <p v-for="item in this.participants" :key="item">{{item}}</p>
      </div>
    </div>
    </div>
  </div>
    </div>
</template>

<script>
import recorder from "./recorder.vue"
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import BpmnModeler from "bpmn-js/lib/Modeler";
import CliModule from "bpmn-js-cli";
import {convertToBPMN} from "@/parser";
import {changeModelJSON, getFeedback, requestModelJSON} from "@/gptRequests";

export default {
  name: "gpt-vue",
  components: {
    recorder,
  },
  data(){
      return{
        modeler: null,
        recorderBool: true,
        loading: false,
        duration: null,
        firstModel: false,
        reloading: false,
        modelJSON: null,
        currentModel: null,
        currentBPMN: null,
        participants: [],
        messageHistory: [],
        undo: false,
        previousModelJSON: null
      }
       },
  methods:{

  //handle when a function is triggered
  handleLoading(text){
    if(text != this.messageHistory[0]) {
      this.messageHistory.unshift("User: "+text)
    }
    this.loading=true
    this.firstModel=true
    this.startTimer()
  },

  //copy BPMN to clipboard
  async exportBPMN(){
    //Export the final BPMN in XML form
    let request = await this.modeler.saveXML()
    let xml = request.xml
    console.log(xml)
    await navigator.clipboard.writeText(xml)
  },

  //restore previous model version
  async undoFunction(){
    this.undo = false
    await this.build(this.previousModelJSON,true)
    this.currentModel = this.previousModelJSON
  },

  //store current version of the BPMN code
  async saveBPMN(){
    let request = await this.modeler.saveXML()
    let xml = request.xml
    this.currentBPMN = xml.substring(xml.indexOf("<bpmn:process"),xml.indexOf("/bpmn:process>"))
  },

  //check whether the model has been manually changed
  async modelChanged(){
    let referenceBPMN = null
    try {
      let request = await this.modeler.saveXML()
      let xml = request.xml
      referenceBPMN = xml.substring(xml.indexOf("<bpmn:process"),xml.indexOf("/bpmn:process>"))
    } catch (e){/*nothing*/}
    if (this.currentBPMN === referenceBPMN){
      return false
    } else {
      return true
    }
  },

  //request the model from GPT and create a BPMN representation
  async createModel(description,updateBool) {
    let modelChanged = await this.modelChanged()
    this.handleLoading(description)
    if (modelChanged == false) {
      //save the previous model
      this.previousModelJSON = this.currentModel
      //try 5 times to build the model
      for (let i = 0; i < 5; i++) {
        try {
          if (updateBool == false) {
            //if model should be generated initially
            console.log(description)
            this.currentModel = await requestModelJSON(description)
          } else {
            //if model should be updated
            await this.saveBPMN()
            this.currentModel = await changeModelJSON(this.currentModel,description)
            this.undo = true
          }
          await this.build(this.currentModel, false)
          break
        } catch (e) {
          //If the BPMN generation caused an error the reloading label is showed an the model generation is triggered again
          console.error('GPT or BPMN Parsing Error')
        }
      }
      this.stopTimer()

      //Don't do anything if the model was manually changed
    } else {
      this.recorderBool = false
      console.log("Changed")
    }
  },

  //build BPMN
  async build(input,undo){
    //Generate a BPMN model from the GPT JSON and inserting the feedback in the respective box
    this.clearBPMN()
    this.firstModel = true
    document.getElementById('bpmn-wrapper').style.display = 'block'

    //Instantiate the Modeler
    this.modeler = new BpmnModeler({
      container: '#canvas',
      additionalModules: [CliModule],
      cli: {bindTo: 'cli'}
    })
    await convertToBPMN(input,this.modeler) //from the parser.js

    let request = await this.modeler.saveXML()
    let xml = request.xml
    this.currentBPMN = xml.substring(xml.indexOf("<bpmn:process"),xml.indexOf("/bpmn:process>"))

    this.getParticipants(input)
    if(undo == false){
      let feedback = await getFeedback(this.messageHistory)
      this.messageHistory.unshift("Modeler: "+feedback)
    }
    this.stopTimer()

  },

  //Helpers

  //create a list of participants
  getParticipants(model){
    //Return an array of all participants in the model
    let participants = {}
    let participantList = []
    for (let el of model){
      let a = el.val.actor
      if(a != null && a != ""){
        // eslint-disable-next-line no-prototype-builtins
        if(!participantList.includes(a)){
          participantList.push(a)
          participants[a]= el.val.name
        } else {
          participants[a] += ", "+el.val.name
        }
      }
    }
    this.participants = []

    for(let p of participantList) {
      this.participants.push(p + ': ' + participants[p])
    }
  },
  //clear the current model
  clearBPMN() {
    //Set the existing BPMN canvas to null
    try {
      let canvas = document.getElementById('canvas')
      canvas.innerHTML = null
    } catch (e){
      console.error('canvas not found')
      //not yet mounted
    }
  },
  startTimer() {
    this.requestStart = performance.now()
    this.loading = true //init Timer
    this.count()
  },
  stopTimer() {
    this.loading = false
    this.reloading = false
  },
  count(){
    setTimeout(() => {
      if(this.loading == true || this.reloading == true){
        this.duration = (parseInt((performance.now() - this.requestStart)/ 1000))
        this.count()
      }
    }, 1000)
  },
  }
}

</script>

<style scoped>
.djs-palette{
  left: 0px;
}
.djs-palette.two-column.open{
  left: 0px;
}
  #canvas{
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    align-items: center;
  }
  #modeler{
    width: 100%;
    height: 100%;
  }
  #wrapper{
    width: 100%;
    color: white;
    display: flex;
    justify-content: center;
  }
  h2{
    color: darkslategray;
    text-align: center;
    margin-top: 10px;
  }
  button{
    height: 40px;
    width: 100px;
    border: none;
    border-radius: 5px;
    background: darkslategray;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }
  .text-wrapper{
    margin-top: 20px;
    color: darkslategray;
    width: 80%;
    border-radius: 10px;
    background: white;
    box-shadow: grey 0px 0px 10px;
    transition: 0.3s;
    padding: 20px;
    font-size: 16px;
  }
  #bpmn-wrapper{
    margin-top: 30px;
    color: darkslategray;
    width: 90%;
    height: 700px;
    border-radius: 10px;
    background: white;
    box-shadow: grey 0px 0px 10px;
    transition: 0.3s;
    display: none;
    padding-right: 20px;
    padding-left: 20px;
  }
  .column{
    display: flex;
    justify-content: center;
    width: 100%;
  }
  recorder{
    margin-right: 0px;
  }
  #paragraph-wrapper {
    padding-left: 30px;
    padding-right: 30px;
  }
  p{
    text-align: center;
  }
  #recorder-column{
    display: flex;
    justify-content: center;
    margin-top: 20px;
    width: 27%;
  }
  #model-column{
    width: 73%;
    display: flex;
    justify-content: center;
  }
</style>