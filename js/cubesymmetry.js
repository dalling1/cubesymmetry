/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
class Rotation {
 constructor(azimuth=0, elevation=0, gamma=0, units="radians"){
  this.name = "Rotation";
  this.az = azimuth;
  this.el = elevation;
  this.gamma = 0;
  this.units = "radians";
 }

 degrees(){
  if (this.units=="radians"){
   this.az = Math.PI*this.az/180.0; // convert degrees to radians
   this.el = Math.PI*this.el/180.0; // convert degrees to radians
   this.gamma = Math.PI*this.gamma/180.0; // convert degrees to radians
   this.units = "degrees";
  }
 }

 radians(){
  if (this.units=="degrees"){
   this.az = this.az*180.0/Math.PI; // convert radians to degrees
   this.el = this.el*180.0/Math.PI; // convert radians to degrees
   this.gamma = this.gamma*180.0/Math.PI; // convert radians to degrees
   this.units = "radians";
  }
 }

}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function canvasScale3D(pos=[0,0,0],offsetX=0,offsetY=0){
 var originX = 0;
 var originY = 0;
 var canvaswidth = $('#thecubegraph').width();
 var canvasheight = $('#thecubegraph').height();
 var centreX = Math.round(canvaswidth/2) + originX;
 var centreY = Math.round(canvasheight/2) + originY;

 var useScale = parseFloat($("#thescale").val());
 if (pos.length==3){
  // single coordinate given as input:
  var p = perspective(pos[2]);
  var newpos = [centreX + useScale*(p*pos[0]+offsetX), canvasheight - (centreY + useScale*(p*pos[1]+offsetY))];
 } else {
  // array of coordinates given as input:
  var newpos = Array(pos.length);
  for (var i=0;i<pos.length;i++){
   var p = perspective(pos[i][2]);
   newpos[i] = [centreX + useScale*(p*pos[i][0]+offsetX), canvasheight - (centreY + useScale*(p*pos[i][1]+offsetY))];
  }
 }
 return newpos;
}

function perspective(z){
 var z1=-2;
 var z2=2;
 var a=0.5;
 var p = (1-a)+(z2+z)*2*a/(z2-z1); // linear scaling from 1-a to 1+a between depths z1 and z2 (passing through 1 at z=0)
 return p;
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function setup(){
 // clean up first (and set up the SVG defs):
 wipeCanvas();

 // set the width of things:
 document.getElementById("graphareaCubeGraph").setAttribute("style","width:"+document.getElementById("cubeGraphControls").clientWidth+"px;");
 document.getElementById("thecubegraph").setAttribute("style","width:"+document.getElementById("cubeGraphControls").clientWidth+"px;");

 // add a control point to "therotator":
 if (document.getElementById("joystick")){
  // the joystick exists, so do nothing
 } else {
  $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
   "fill": "#000000",
   "stroke": "none",
   "r": 4,
   "cx": parseFloat($("#therotator").width()/2), // starts centred
   "cy": parseFloat($("#therotator").width()/2), // starts centred
   "id": "joystick",
   "class": "draggable",
  }).appendTo("#therotator");

  // set drag on therotator (which moves the "joystick"):
  makeJoystickDraggable();
 }

 // add mousemove function to the main graph:
 document.getElementById("thecubegraph").addEventListener("mousemove", highlightAllowedNodes);

 // set the control labels to the control values:
 setControls();

 // create the graph:
 createCubeGraph();

 // start by drawing the cube:
 drawCubeGraph();
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
doDragJoystick = null; // initialise
function makeJoystickDraggable(){
 // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
 var svg = $("#therotator")[0];
 svg.addEventListener('mousedown', startJoystickDrag);
 svg.addEventListener('mousemove', dragJoystick);
 svg.addEventListener('mouseup', endDrag);
 // we are not using 'mouseleave' to end dragging, so that the user can move the mouse outside
 // therotator temporarily (ie. overshoot) without losing "drag"

 function startJoystickDrag(event){
  event.preventDefault();
  event.stopPropagation();
  if (event.target.classList.contains('draggable')){
   doDragJoystick = event.target;
  }
 }

 function dragJoystick(event){
  if (doDragJoystick) {
   event.preventDefault();
   event.stopPropagation();
   // "therotator" is a "touch-pad"-like control which lets the user define two rotation angles
   // -- these will be scaled between some max and min values according to the position on the panel
   // -- the "joystick" is the dot marking the current value of therotator
   // the code below was formerly a separate function, setRotator(event):
   var boxW = document.getElementById("therotator").getBoundingClientRect().width; // get size so that we can work out the percentage
   var boxH = document.getElementById("therotator").getBoundingClientRect().height;

   // move the joystick marker to the clicked position:
   var dx = document.getElementById("thecubegraph").getBoundingClientRect().x;
   var dy = document.getElementById("thecubegraph").getBoundingClientRect().y;
   var mouseX = Math.round(event.clientX-dx);
   var mouseY = Math.round(event.clientY-dy);

   document.getElementById("joystick").setAttribute("cx",mouseX);
   document.getElementById("joystick").setAttribute("cy",mouseY);
   var cx = $("#joystick").attr("cx");
   var cy = $("#joystick").attr("cy");
   var px = parseFloat(cx/boxW);
   var py = parseFloat(cy/boxH);

   // re-draw the graph, which applies the current rotation
   drawCubeGraph();

  }
 }

 function endDrag(event){
  doDragJoystick = null;
 }

}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
selectedNode = null; // initialise
selectedNodePosition = [null,null]; // initialise
dragOffset = [0,0]; // initialise
function makeNodesDraggable(thisgroup){
 // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
 var svg = $("#graphareaCubeGraph")[0];
 svg.addEventListener('mousedown', startNodeDrag);
 svg.addEventListener('mousemove', dragNode);
 svg.addEventListener('mouseup', endNodeDrag);
 // not using 'mouseleave' to end dragging, so that the user can move the mouse outside the graph
 // area temporarily (ie. overshoot) without losing "drag" (otherwise they'd have to release and
 // re-click the mouse button)

 function startNodeDrag(event){
  // 1. look for the nearest node (within some range) in the original graph
  //     -- make sure that we don't switch nodes in mid-drag
  // 2. perhaps do nothing if it has already been "moved" to the graph copy (its label moved)
  // 3. set selectedNode equal to that nearest node

  if (selectedNode===null){ // make sure that we don't switch nodes in mid-drag
   var dx = document.getElementById("thecubegraph").getBoundingClientRect().x;
   var dy = document.getElementById("thecubegraph").getBoundingClientRect().y;
   var mouseX = Math.round(event.clientX-dx);
   var mouseY = Math.round(event.clientY-dy);

   var thenode = nearestNode(mouseX,mouseY,thisgroup);
   if (thenode != null){
    // record the original position in case we need to put it back:
    selectedNode = thenode;
    selectedNodePosition = [$("#"+thenode).attr("cx"), $("#"+thenode).attr("cy")];
    // check the offset of the mouse position from the svg element
    dragOffset[0] = Math.round(event.clientX - document.getElementById(selectedNode).getBoundingClientRect().x);
    dragOffset[1] = Math.round(event.clientY - document.getElementById(selectedNode).getBoundingClientRect().y);
   }
  }
 }

 function dragNode(event){
  // make sure that we are close to a node, and then move it around
  if (selectedNode) {
   event.preventDefault();
   event.stopPropagation();
   // move the node:
   var dx = document.getElementById("thecubegraph").getBoundingClientRect().x;
   var dy = document.getElementById("thecubegraph").getBoundingClientRect().y;
//   var mx = document.getElementById("thecubegraph").getBoundingClientRect().height;
//   var my = document.getElementById("thecubegraph").getBoundingClientRect().width;
   var mouseX = Math.round(event.clientX-dx);
   var mouseY = Math.round(event.clientY-dy);
   document.getElementById(selectedNode).setAttribute("cx",mouseX-dragOffset[0]);
   document.getElementById(selectedNode).setAttribute("cy",mouseY-dragOffset[1]);
  }
 }

 function endNodeDrag(event){
  event.preventDefault();

  // test for a legal node near the dragged (now dropped) node's position (not the mouse position):
  var droppedNodePosition = [$("#"+selectedNode).attr("cx"), $("#"+selectedNode).attr("cy")];
  var destination = nearestNode(droppedNodePosition[0],droppedNodePosition[1],copygroup); // look for nodes in the cube copy
  if (destination){
   // test if this is a legal destination for the dragged node:
   var from = selectedNode.split("_")[2];
   var to = destination.split("_")[2];

   var sourcelabel = labelsOriginal[from];
   var destlabel = labelsCopy[to];

   var islegal = destlabel.length==0; // for now this is the only test we will make [needs more logic added]

/*
 We also need to test:
  - dragged node's label is not already in the copy (should make it non-draggable after it has been copied once...)
  - test neighbour relationships
*/

   if (islegal){
    // add the dragged node's label to the destination node (in the copy graph)
    labelsCopy[to] = labelsOriginal[from];
    drawCubeGraph();
    restoreNodePosition(selectedNode,selectedNodePosition);
   } else {
    // otherwise, send the node back home
    restoreNodePosition(selectedNode,selectedNodePosition);
   }
  } else {
   // no destination, so send this node back to where it came from:
   restoreNodePosition(selectedNode,selectedNodePosition);
  }

  selectedNode = null; // reset
  dragOffset = [0,0]; // reset
 }
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function restoreNodePosition(selectedNode=null,selectedNodePosition){
 // possible problem here if the user drags and releases a second node before the first one has finished animating...
 var speed = 10; // milliseconds for the animation to run; smaller is faster
 if (selectedNode){
  mytimer = setInterval(animatePosition,speed,selectedNode,selectedNodePosition);
 }
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function animatePosition(nodeID,to,percent=20){
 var from = [parseFloat($("#"+nodeID).attr("cx")), parseFloat($("#"+nodeID).attr("cy"))];
 var step = [(to[0]-from[0])*(percent/100), (to[1]-from[1])*(percent/100)];
 var debug = false;

 if (Math.abs(step[0])<1 & Math.abs(step[1])<1){
  clearInterval(mytimer);
  document.getElementById(nodeID).setAttribute("cx",to[0]);
  document.getElementById(nodeID).setAttribute("cy",to[1]);
  if (debug) console.log("STOPPED");
 } else {
  document.getElementById(nodeID).setAttribute("cx",from[0] + step[0]);
  document.getElementById(nodeID).setAttribute("cy",from[1] + step[1]);
 }
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function highlightAllowedNodes(event){
 if (selectedNode===null){
  // turn off highlighting for all nodes:
  allnodes = document.getElementsByClassName("node")
  for (var i=0;i<allnodes.length;i++){
   allnodes[i].classList.remove("nodehighlight");
  }

  // add highlighting to the nearest node (in range)
  var dx = document.getElementById("thecubegraph").getBoundingClientRect().x;
  var dy = document.getElementById("thecubegraph").getBoundingClientRect().y;
  var mouseX = Math.round(event.clientX-dx);
  var mouseY = Math.round(event.clientY-dy);
  var thenode = nearestNode(mouseX,mouseY,originalgroup);
  if (thenode != null){
   document.getElementById(thenode).classList.add("nodehighlight");

   // get a list of unlabelled nodes in the second graph:
   var emptylabels = new Array(labelsCopy.length);
   emptylabels.fill(false);
   var Nempty = 0;
   for (var i=0;i<labelsCopy.length;i++){
    emptylabels[i] = labelsCopy[i].length==0;
    if (emptylabels[i]) Nempty++;
   }

   // are none empty?
   if (Nempty==0){
    // finished relabelling! do nothing
   } else {
    // are they all empty? then the highlighted node in the original graph can be placed anywhere:
    if (Nempty == labelsCopy.length){
     var nodelist = document.getElementById("nodegroup"+copygroup).children; // the copy cube's nodes
     for (var i=0;i<nodelist.length;i++){
      var nid = $(nodelist[i]).attr("id");
      document.getElementById(nid).classList.add("nodehighlight");
     }
    } else {
     // only some are not empty, so find the constraints on the placement of the highlighted node:
     var nodelist = document.getElementById("nodegroup"+copygroup).children; // all of the copy cube's nodes
/*
 procedure:
  - for each element of nodelist, find its neighbours

    var nodedists = new Array(nodelist.length);
    nodedists.fill(Infinity);
    for (var i=0;i<nodelist.length;i++){
     // ...
    }

     for (var i=999;i<nodelist.length;i++){
      if (emptylabels[i]){
       var nid = $(nodelist[i]).attr("id");
//       $("#"+nid).attr("fill","#ffcc00");
//       $("#"+nid).attr("filter","url(#f3)");
       document.getElementById(nid).classList.add("nodehighlight");
      }
     }

*/


    }
   }

   // highlight this node's copy: (that is, the node in the graph's copy which has the same label
   var thenodecopy = null;
   for (var i=0;i<labelsCopy.length;i++){
    if (labelsCopy[i]==labelsOriginal[thenode]){
     thenodecopy = i;
    }
   }
   if (thenodecopy != null){
    // replace these two lines with classList.add(...):
    $("#node_"+copygroup+"_"+thenodecopy).attr("fill","#ccff44");
    $("#node_"+copygroup+"_"+thenodecopy).attr("filter","url(#f2)");
   }

  }
 } // end "if selectedNode==null"
}



/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function getAzEl(){
 // parameters of the rotation control pad
 var mx = document.getElementById("therotator").getBoundingClientRect().width;
 var my = document.getElementById("therotator").getBoundingClientRect().height;
 var cx = $("#joystick").attr("cx");
 var cy = $("#joystick").attr("cy");
 var px = parseFloat(cx/mx);
 var py = parseFloat(cy/my);
 // azimuth and elevation limits
 var azRange = [-180, 180];
 var elRange = [-90, 90];
 // spherical rotation parameters
 var az = (azRange[1]-azRange[0])*px + azRange[0];
 var el = (elRange[1]-elRange[0])*py + elRange[0];

 rot = new Rotation();
 rot.az = az;
 rot.el = el;
 return rot;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* Set the control displays to their current value */
function setControls(){
//unused: theedgelengthOutput.value=theedgelength.value;
//unused: therotangleOutput.value=therotangle.value;
 thenodesizeOutput.value=thenodesize.value;
 thelinewidthOutput.value=thelinewidth.value;
 thecubegapOutput.value=thecubegap.value;
 thescaleOutput.value=thescale.value;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function wipeCanvas(){
// var edgeColour = document.getElementById("edgepicker").value;
// var axesColour = document.getElementById("axespicker").value;
// var arrowSize = parseFloat($("#thearrowsize").val());
// var filledarrows = $("#filledarrowsbutton").prop("checked");
// var arrowratio = Math.pow(parseFloat($("#thearrowratio").val()),2.0);

 $("#thecubegraph").empty();
 // re-add the required defs:
 if (1) document.getElementById("thecubegraph").insertAdjacentHTML("afterbegin",'\
  <defs>\
    <filter id="f1" x="-150%" y="-150%" width="300%" height="300%">\
      <feOffset result="offOut" in="SourceAlpha" dx="0" dy="0" />\
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" />\
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\
    </filter>\
\
    <filter id="f3" x="-150%" y="-150%" width="300%" height="300%">\
      <feOffset result="offOut" in="SourceGraphic" dx="0" dy="0" />\
      <feColorMatrix result = "matrixOut" in = "offOut" type = "matrix" values = "1.0 0 0 0 0 0 1.0 0 0 0 0 0 0.1 0 0 0 1 1 1 0"/>\
      <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="5" />\
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\
    </filter>\
\
    <filter id="f2" x="-150%" y="-150%" width="300%" height="300%">\
      <feOffset result="offOut" in="SourceGraphic" dx="0" dy="0" />\
      <feColorMatrix result = "matrixOut" in = "offOut" type = "matrix" values = "1.0 0 0 0 0 0 1.0 0 0 0 0 0 0.1 0 0 0 1 0 1 0"/>\
      <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="5" />\
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\
    </filter>\
  </defs>');

 return 1;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function rotMatrixMult(M=[[1,0,0],[0,1,0],[0,0,1]],R=[0,0,0]){
 // M has three rows, R has 3 elements
 if (M[0].length == R.length){ // okay to multiply
  var result = new Array(R.length);
  result.fill(0);
  for (var i=0;i<M.length;i++){ // loop over rows of M
   for (var j=0;j<M[i].length;j++){ // loop over columns of M ie. elements of R
    result[i] += M[i][j]*R[j];
   }
  }
 } else {
  var result = false;
 }
 return result;
}

function rotate(R,thisRotation){
 // thisRotation is a Rotation class variable with three attributes, az, el and gamma
 // corresponding to rotation about the x-, y- and z-axes, respectively
 // (formerly alpha, beta and gamma, in an array)
// for (var i=0;i<3;i++) rotAngles[i] = Math.PI*rotAngles[i]/180.0; // convert degrees to radians

 thisRotation.degrees(); // make sure we are using degrees
 var cAlpha = Math.cos(thisRotation.el);
 var sAlpha = Math.sin(thisRotation.el);
 var cBeta = Math.cos(thisRotation.az);
 var sBeta = Math.sin(thisRotation.az);
 var cGamma = Math.cos(thisRotation.gamma);
 var sGamma = Math.sin(thisRotation.gamma);

 var Mx = [ [1,0,0], [0,cAlpha,sAlpha], [0,-sAlpha,cAlpha]];
 var My = [ [cBeta,0,-sBeta], [0,1,0], [sBeta,0,cBeta]];
 var Mz = [ [cGamma,sGamma,0], [-sGamma,cGamma,0], [0,0,1]];

 var Rdash = R;
 Rdash = rotMatrixMult(Mx,Rdash);
 Rdash = rotMatrixMult(My,Rdash);
 Rdash = rotMatrixMult(Mz,Rdash);
 return Rdash;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function createCubeGraph(){
 // create an adjacency matrix for the cube graph:
 var Nnodes = 8;
 adjMatrix = new Array();
 for (var i=0;i<Nnodes;i++){
  var tmp = new Array(Nnodes);
  tmp.fill(0);
  adjMatrix.push(tmp);
 }

 // create position and label arrays for the cube graph:
 positionOriginal = new Array(Nnodes);
 positionOriginal.fill([0,0,0]); // initialise all nodes at (0,0,0)
 labelsOriginal = new Array(Nnodes);
 labelsCopy = new Array(Nnodes);
 for (var i=0;i<Nnodes;i++){
  labelsOriginal[i] = String(i);
  labelsCopy[i] = '';
//  if (i==6) labelsCopy[i] = '0'; // testing [== map node 0 to node 0]
 }

 // set up the neighbour relationships:
 adjMatrix[0][1]=1;   adjMatrix[0][3]=1;  adjMatrix[0][4]=1;
 adjMatrix[1][0]=1;   adjMatrix[1][2]=1;  adjMatrix[1][5]=1;
 adjMatrix[2][1]=1;   adjMatrix[2][3]=1;  adjMatrix[2][6]=1;
 adjMatrix[3][0]=1;   adjMatrix[3][2]=1;  adjMatrix[3][7]=1;
 adjMatrix[4][0]=1;   adjMatrix[4][5]=1;  adjMatrix[4][7]=1;
 adjMatrix[5][1]=1;   adjMatrix[5][4]=1;  adjMatrix[5][6]=1;
 adjMatrix[6][2]=1;   adjMatrix[6][5]=1;  adjMatrix[6][7]=1;
 adjMatrix[7][3]=1;   adjMatrix[7][4]=1;  adjMatrix[7][6]=1;

 // set the node position: (positive y direction is up, positive z direction is away)
 positionOriginal[0] = [-1,-1,-1];
 positionOriginal[1] = [-1,-1,1];
 positionOriginal[2] = [1,-1,1];
 positionOriginal[3] = [1,-1,-1];
 positionOriginal[4] = [-1,1,-1];
 positionOriginal[5] = [-1,1,1];
 positionOriginal[6] = [1,1,1];
 positionOriginal[7] = [1,1,-1];

}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function drawCubeGraph(){
 // clear the existing SVG element:
 wipeCanvas();

 // get some user control values:
 var cubeGap = $("#thecubegap").val();

 // draw the "copy" cube: (draw this first so that dragged "original" nodes are in front of it)
 copygroup = drawOneCube(positionOriginal,labelsCopy,-cubeGap/2,0);

 // draw the "original" cube:
 originalgroup = drawOneCube(positionOriginal,labelsOriginal,cubeGap/2,0);

//console.log("g = "+originalgroup);
 makeNodesDraggable(originalgroup);
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function drawOneCube(position,labels,offsetX=0,offsetY=0,thisgroup=-1){
 /*
  Drawing order: the edges group is created first, so the nodes group is drawn on top of it
  in the canvas.  This causes some "back" nodes to overlie "forward" edges in the drawing.
  It is not particularly noticeable, though, since the back nodes are quite small.
 */

 // get user control values:
 var nodeRadius = $("#thenodesize").val();
 var lineWidth = $("#thelinewidth").val();
//unused var rotangle = parseFloat($("#therotangle").val());

 if (thisgroup<0){ // group not specified? work out what it should be:
  thisgroup = $("#thecubegraph").children().length - 1; // -1 because the <defs> are the first child...
 }

 // add a new SVG group for this particular cube:
 $(document.createElementNS("http://www.w3.org/2000/svg","g")).attr({"id": "group"+thisgroup,}).appendTo("#thecubegraph");
 // to that group, append groups for the nodes, edges and labels:
 $(document.createElementNS("http://www.w3.org/2000/svg","g")).attr({"id": "edgegroup"+thisgroup,}).appendTo("#group"+thisgroup);
 $(document.createElementNS("http://www.w3.org/2000/svg","g")).attr({"id": "nodegroup"+thisgroup,}).appendTo("#group"+thisgroup);
 $(document.createElementNS("http://www.w3.org/2000/svg","g")).attr({"id": "labelgroup"+thisgroup,}).appendTo("#group"+thisgroup);

 // add a line for each edge:
 for (var i=0;i<position.length;i++){
  // draw any edges to "later" nodes (to avoid duplicate edges)
  for (var j=i;j<position.length;j++){
   if (adjMatrix[i][j]){ // yes, connect nodes i and j
    var positionIRotated = rotate(position[i],getAzEl());
    var positionJRotated = rotate(position[j],getAzEl());
    var pI = perspective(positionIRotated[2]); // perspective scaling value
    var pJ = perspective(positionJRotated[2]); // perspective scaling value

    var screenpositionI = canvasScale3D(positionIRotated,offsetX,offsetY);
    var screenpositionJ = canvasScale3D(positionJRotated,offsetX,offsetY);

    $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
     "stroke": (thisgroup==0?"#ff0000":"#00ff00"),
     "stroke-dasharray": "none",
     "stroke-width": lineWidth*Math.pow(Math.max(pI,pJ),2),
     "stroke-linecap": "round",
     "x1": screenpositionI[0],
     "y1": screenpositionI[1],
     "x2": screenpositionJ[0],
     "y2": screenpositionJ[1],
     // give the edge an id just in case we need it:
     "id": "edge_"+i+"_"+j,
    }).appendTo("#edgegroup"+thisgroup);
   }
  }
 }

 // add a marker for each node:
 for (var i=0;i<position.length;i++){
  var positionRotated = rotate(position[i],getAzEl());
  var p = perspective(positionRotated[2]); // perspective scaling value
  var screenpositionI = canvasScale3D(positionRotated,offsetX,offsetY);
  var thisID = "node_"+thisgroup+"_"+i;
  $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
   "fill": "#000000",
   "stroke": "none",
   "r": nodeRadius*Math.pow(p,2),
   "cx": screenpositionI[0],
   "cy": screenpositionI[1],
   "class": "node draggable",
   // give the node an id just in case we need it:
   "id": thisID,
  }).appendTo("#nodegroup"+thisgroup);
 }

 // add a label for each node:
 var labelOffsetX = 10;
 var labelOffsetY = 10;
 var fontSize = 20;
 var textAngle = 0;
 var textColour = "#ffff00";
 for (var i=0;i<position.length;i++){
  var LpositionRotated = rotate(position[i],getAzEl());
  var p = perspective(LpositionRotated[2]); // perspective scaling value
  var LscreenpositionI = canvasScale3D(LpositionRotated,offsetX,offsetY);
  var newText = document.createElementNS("http://www.w3.org/2000/svg","text");
  $(newText).attr({
   "fill": textColour,
   "font-size": fontSize,
   "x": LscreenpositionI[0]+labelOffsetX,
   "y": LscreenpositionI[1]+labelOffsetY,
   "transform": "rotate("+textAngle+","+(LscreenpositionI[0]+labelOffsetX)+","+(LscreenpositionI[1]+labelOffsetY)+")",
   "style": "dominant-baseline:middle; text-anchor:left;", // left, middle
   "class": "label",
   "id": "label_"+i,
  });

  // the text node has been created, so insert the node's label
  var textNode = document.createTextNode((labels[i].length?labels[i]:''));
  newText.appendChild(textNode);
  document.getElementById("labelgroup"+thisgroup).appendChild(newText);
 }

 return thisgroup;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function nearestNode(x,y,thisgroup=0){
 var searchRadius = 100;
 var allnodes = document.getElementById("nodegroup"+thisgroup).children; // the main cube's nodes
 var thenodeID = null;
 var minDist = Infinity;
 for (var i=0;i<allnodes.length;i++){
  var x1=allnodes[i].getAttribute("cx");
  var y1=allnodes[i].getAttribute("cy");
  var dist = Math.pow(Math.pow(x-x1,2.0)+Math.pow(y-y1,2.0),0.5); // unnecessarily proper, but speed should not be a big issue (we could just do Manhattan distance)
  if (dist<minDist & dist<=searchRadius){ // ties are resolved in favour of the earlier node in the list
   minDist = dist;
   var thenodeID = allnodes[i].id;
  }
 }
 return thenodeID;
}
