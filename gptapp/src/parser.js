import {bpmnTemplate} from "@/assets/prompts";
import {layoutProcess} from "bpmn-auto-layout";

export async function convertToBPMN(json,modeler){

    //Import base BPMN
    try {
        await modeler.importXML(bpmnTemplate);
    } catch (err) {/**/}

    //Create the BPMN Draft
    buildModel(json)

    //Export xml to layout it
    let xml = await modeler.saveXML()
    const layoutedDiagramXML = await layoutProcess(xml.xml);

    //Import layouted diagram
    try {
        await modeler.importXML(layoutedDiagramXML);
    } catch (err) {console.log("Layouting not possible")}
}

function buildModel(model){
    let cli = window.cli
    let elements = {}

    //Create First Element
    let first = model[0]
    let firstElement = null
    if(isDecision(first)==true){
        firstElement = cli.append('StartEvent','bpmn:ExclusiveGateway')
    } else {
        firstElement = cli.append('StartEvent','bpmn:Task')
    }
    cli.setLabel(firstElement,first.val.name)
    elements[first.val.name] = firstElement

    //Create Remaining Tasks
    for(let el of model){

        let pre = elements[el.val.name]
        if (el.val.suc.length > 1 && isDecision(el) == false){
            pre = cli.append(pre,'bpmn:ParallelGateway')
        }

        //Create and append all successors
        for(let suc of el.val.suc){

            //Get the element, "suc" points at
            let element = getElement(el,model,suc)
            let connection = null
            let newElementInstance = null
                //Check if element is null (directly connect with end) or already exists
                if(element  == null){
                    //Should connected directly with end (Only appears in XOR Gateway)
                    connectWithEnd(el,elements,cli)
                    connection = getEdge(cli.element(pre),cli.element(elements['EndEvent']))
                }else if(elements[element.val.name]!=null){
                    //Connect with an existing element
                    connection = cli.connect(pre,elements[element.val.name],'bpmn:SequenceFlow')
                } else {
                    //Create element as Task or Gateway and name it
                    if (isDecision(element)) {
                        newElementInstance = cli.append(pre, 'bpmn:ExclusiveGateway')
                    }else{
                        newElementInstance = cli.append(pre,'bpmn:Task')
                    }
                    elements[element.val.name] = newElementInstance
                    cli.setLabel(newElementInstance,element.val.name)
                    connection = getEdge(cli.element(pre),cli.element(newElementInstance))
                }
                //Name the new edge if it is a gateway
                if(isDecision(el)){
                    cli.setLabel(connection,Object.keys(suc)[0])
                }
        }
        if(el.val.suc.length==0) {
            connectWithEnd(el, elements, cli)
        }
    }
}

// Helper functions

//connect an element with the end-event
function connectWithEnd(el,elements,cli){
    //Connect the element with the EndEvent if it has no successors
    if(elements['EndEvent']==null){
        let end = cli.append(elements[el.val.name],'bpmn:EndEvent')
        elements['EndEvent'] = end
    } else{
        cli.connect(elements[el.val.name],elements['EndEvent'],'bpmn:SequenceFlow')
    }
}

//get a successor element of a base element
function getElement(element, model, suc){
    if(isDecision(element)){
        if(suc[Object.keys(suc)]==""){
            return null
        } else {
            return getById(model,suc[Object.keys(suc)])
        }
    } else {
        return getById(model,suc)
    }
}

//get an element by its id
function getById(json,i){
    for (let j of json){
        if(j.id==i){
            return j
        }
    }
}

//determine whether an element is a decision
function isDecision(element){
    let successor = element.val.suc[0]
    let key = null
    try {
        key = successor[Object.keys(successor)]
    }catch (e) {
        // key remains null
    }
    if(element.val.decision != null || key != null){
        return true
    } else {
        return false
    }
}

//get an edge between two elements
function getEdge(pre,suc){
    let sequence = null
    for(let seq of pre.outgoing){
        if (suc.incoming.includes(seq)){
            sequence = seq
        }
    }
    return sequence
}