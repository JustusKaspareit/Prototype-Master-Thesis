//Model creation
export const modelExample = "[{\"id\":1,\"val\":{\"name\":\"Check open leads\",\"actor\":\"Manager\",\"suc\":[2]}},{\"id\":2,\"val\":{\"name\":\"Select top five leads\",\"actor\":\"Manager\",\"suc\":[3]}},{\"id\":3,\"val\":{\"name\":\"Call contact person\",\"actor\":\"Sales Assistant\",\"suc\":[4]}},{\"id\":4,\"val\":{\"name\":\"Call each customer\",\"actor\":\"Sales Assistant\",\"suc\":[5]}},{\"id\":5,\"val\":{\"decision\":true,\"name\":\"Interested\",\"actor\":\"Sales Assistant\",\"suc\":[{\"Yes\":6},{\"No\":4}]}},{\"id\":6,\"val\":{\"name\":\"Send note to Manager\",\"actor\":\"Sales Assistant\",\"suc\":[7]}},{\"id\":7,\"val\":{\"name\":\"Process lead\",\"actor\":\"Manager\",\"suc\":[]}}]"

const JSONdescription = "The structure of the json works as follows. Every activity in the list should include the actor that executes it and the successing activities in the array \"suc\"." +
    "If the activity is a decision, the key \"decision\" with the value true should be added. Decisions can be identified by the keywords \"if\" or \"then\". Parallel tasks should not be executed after each other but simultaneously and share the same predecessor." +
    "For instance the key words \"simultaneously\", \"in parallel\", \"meantime\" or \"concurrently\" indicate parallel tasks. Return nothing but a list of json elements."

export const modelPrompt =
    "Act like process analyst and create a json model for the following process description. If the description is in german still build the model in english."

export const modelDescription = "Create a json representation for the process description you receive."+JSONdescription

//Feedback prompts
export const feedpackDescription =
    "You are a process analyst who provides feedback for a process description regarding its correctness and completeness." +
    "You will receive a sequence of descriptions that all belong to the same process. Your task is to analyze whether something must be" +
    "changed or described in more detail. Your total answer should not be longer than 30 words."

export const feedbackInstruction =
    "Please provide feedback for the process you just received." +
    "Analyse whether the process seems to be complete or if additional information are needed." +
    "If you think the process is complete, say that you do not need more information."+
    "If you think the process is not complete, ask questions for information that would be necessary to complete it in a"+
    "meaningful way. This can also be questions about what happens before or after the given tasks. " +
    "When you ask something about a specific task, refer to the name. Give me an answer that is not longer than 30 words."

//Update prompts

export const updateDescription = "You receive a json representation as well as a change description in order to crate a new json with the same format but with the requested changes." + JSONdescription
    "Despite of the changes leave the model the same. Return nothing but a list of json elements."

export const updatePrompt1 = "Given is the following process model in JSON notation:"

export const updatePrompt2 = "Return a JSON model, which only differs in the following changes:"

//Template for the Model Generation

export const bpmnTemplate = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
    "<bpmn:definitions xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" id=\"Definitions_12o13la\" targetNamespace=\"http://bpmn.io/schema/bpmn\" exporter=\"bpmn-js (https://demo.bpmn.io)\" exporterVersion=\"15.1.3\">\n" +
    "  <bpmn:process id=\"Process_05g2hpm\" isExecutable=\"false\">\n" +
    "    <bpmn:startEvent id=\"StartEvent\" />\n" +
    "  </bpmn:process>\n" +
    "  <bpmndi:BPMNDiagram id=\"BPMNDiagram_1\">\n" +
    "    <bpmndi:BPMNPlane id=\"BPMNPlane_1\" bpmnElement=\"Process_05g2hpm\">\n" +
    "      <bpmndi:BPMNShape id=\"_BPMNShape_StartEvent_2\" bpmnElement=\"StartEvent\">\n" +
    "        <dc:Bounds x=\"152\" y=\"82\" width=\"36\" height=\"36\" />\n" +
    "      </bpmndi:BPMNShape>\n" +
    "    </bpmndi:BPMNPlane>\n" +
    "  </bpmndi:BPMNDiagram>\n" +
    "</bpmn:definitions>\n"