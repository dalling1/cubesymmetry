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

// var useScale = 250; // pick something reasonable (useScale = one unit of the chosen coordinate space for the cube nodes)
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
 // set the width of things:
 document.getElementById("graphareaCubeGraph").setAttribute("style","width:"+document.getElementById("cubeGraphControls").clientWidth+"px;");
 document.getElementById("thecubegraph").setAttribute("style","width:"+document.getElementById("cubeGraphControls").clientWidth+"px;");
 // add a control point to "therotator":
 $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
  "fill": "#000000",
  "stroke": "none",
  "r": 4,
  "cx": parseFloat($("#therotator").width()/2), // centred
  "cy": parseFloat($("#therotator").width()/2), // centred
  "id": "joystick",
  "class": "draggable",
 }).appendTo("#therotator");
 // drag on therotator (which moves the "joystick")
 makeDraggable($("#therotator"));
 // make therotator listen for clicks:
// document.getElementById("therotator").addEventListener("click", setRotator);
 // or, make therotator listen for mouse movements:
// document.getElementById("therotator").addEventListener("mousemove", setRotator);
// document.getElementById("joystick").addEventListener("ondrag", setRotator);

 // set the control labels to the control values:
 setControls();

 // start by drawing the cube:
 drawCubeGraph();
}

/* not using this:
function drag(evt){
 dx = document.getElementById("therotator").getBoundingClientRect().x;
 dy = document.getElementById("therotator").getBoundingClientRect().y;
 document.getElementById("joystick").setAttribute("cx",Math.round(evt.clientX-dx));
 document.getElementById("joystick").setAttribute("cy",Math.round(evt.clientY-dy));
}
*/

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
selectedElement = null;
// http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
function makeDraggable(obj){
 var svg = obj[0];
 svg.addEventListener('mousedown', startDrag);
 svg.addEventListener('mousemove', drag);
 svg.addEventListener('mouseup', endDrag);
// svg.addEventListener('mouseleave', endDrag);
 function startDrag(evt){
  if (evt.target.classList.contains('draggable')){
   selectedElement = evt.target;
  }
 }
 function drag(evt){
  if (selectedElement) {
    evt.preventDefault();
//    var dragX = evt.clientX;
//    var dragY = evt.clientY;
//    selectedElement.setAttributeNS(null, "x", dragX);
//    selectedElement.setAttributeNS(null, "y", dragY);
    setRotator(evt);
  }
 }
 function endDrag(evt){
  selectedElement = null;
 }
}


/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function setRotator(event){
 // "therotator" is a "touch-pad"-like control which lets the user define two rotation angles
 // -- these will be scaled between some max and min values according to the position on the panel
 // -- the "joystick" is the dot marking the current value of therotator
 var debug = false;
 var dx = document.getElementById("therotator").getBoundingClientRect().x;
 var dy = document.getElementById("therotator").getBoundingClientRect().y;
 var mx = document.getElementById("therotator").getBoundingClientRect().height;
 var my = document.getElementById("therotator").getBoundingClientRect().width;
 // move the joystick marker to the clicked position:
 document.getElementById("joystick").setAttribute("cx",Math.round(event.clientX-dx));
 document.getElementById("joystick").setAttribute("cy",Math.round(event.clientY-dy));
 var cx = $("#joystick").attr("cx");
 var cy = $("#joystick").attr("cy");
 var px = parseFloat(cx/mx);
 var py = parseFloat(cy/my);
 if (debug) console.log(px+", "+py);
 drawCubeGraph();
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

function rotate(R,rotAngles=[0,0,0]){
 // rotAngles must contain three values, alpha, beta and gamma, for rotation about the x-, y- and z-axes, respectively
 for (var i=0;i<3;i++) rotAngles[i] = Math.PI*rotAngles[i]/180.0; // convert degrees to radians

 var cAlpha = Math.cos(rotAngles[0]);
 var sAlpha = Math.sin(rotAngles[0]);
 var cBeta = Math.cos(rotAngles[1]);
 var sBeta = Math.sin(rotAngles[1]);
 var cGamma = Math.cos(rotAngles[2]);
 var sGamma = Math.sin(rotAngles[2]);

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
 for (var i=0;i<Nnodes;i++){
  labelsOriginal[i] = String(i);
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


function drawCubeGraph(){
 // clear the existing SVG element:
 wipeCanvas();
 // create the graph:
 createCubeGraph();

 // get some user control values:
 var cubeGap = $("#thecubegap").val();

 // draw the first cube:
 drawOneCube(positionOriginal,labelsOriginal,cubeGap/2,0);

 // draw the second cube:
 drawOneCube(positionOriginal,labelsOriginal,-cubeGap/2,0);

}


function drawOneCube(position,labels,offsetX=0,offsetY=0){
 /*
  This approach draws the nodes first, and then the edges.
  We should switch to using SVG groups, so that which element is "on top" in the drawing can be managed more easily.
 */

 // parameters of the rotation control pad
 var mx = document.getElementById("therotator").getBoundingClientRect().height;
 var my = document.getElementById("therotator").getBoundingClientRect().width;
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
//console.log(az+", "+el);

 // get user control values:
 var nodeRadius = $("#thenodesize").val();
 var lineWidth = $("#thelinewidth").val();
//unused var rotangle = parseFloat($("#therotangle").val());

 var N = $("#thecubegraph").children().length;
 // add a new SVG group for this cube:
 $(document.createElementNS("http://www.w3.org/2000/svg","g")).attr({
  "id": "group"+N,
 }).appendTo("#thecubegraph");


 // add a line for each edge:
 for (var i=0;i<position.length;i++){
  // draw any edges to "later" nodes (to avoid duplicate edges)
  for (var j=i;j<position.length;j++){
   if (adjMatrix[i][j]){ // yes, connect nodes i and j
    var positionIRotated = rotate(position[i],[el,az,0]);
    var positionJRotated = rotate(position[j],[el,az,0]);
    var pI = perspective(positionIRotated[2]); // perspective scaling value
    var pJ = perspective(positionJRotated[2]); // perspective scaling value

    var screenpositionI = canvasScale3D(positionIRotated,offsetX,offsetY);
    var screenpositionJ = canvasScale3D(positionJRotated,offsetX,offsetY);

    $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
//     "stroke": "#ff0000",
     "stroke": (N==0?"#ff0000":"#00ff00"),
     "stroke-dasharray": "none",
     "stroke-width": lineWidth*Math.pow(Math.max(pI,pJ),2),
     "stroke-linecap": "round",
     "x1": screenpositionI[0],
     "y1": screenpositionI[1],
     "x2": screenpositionJ[0],
     "y2": screenpositionJ[1],
     // give the edge an id just in case we need it:
     "id": "edge_"+i+"_"+j,
    }).appendTo("#group"+N);
   }
  }
 }
//    }).appendTo("#thecubegraph");


 // add a marker for each node:
 for (var i=0;i<position.length;i++){
  var positionRotated = rotate(position[i],[el,az,0]);
  var p = perspective(positionRotated[2]); // perspective scaling value
  var screenpositionI = canvasScale3D(positionRotated,offsetX,offsetY);
  $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
   "fill": "#000000",
   "stroke": "none",
   "r": nodeRadius*Math.pow(p,2),
   "cx": screenpositionI[0],
   "cy": screenpositionI[1],
   // give the node an id just in case we need it:
   "id": "node_"+i,
  }).appendTo("#group"+N);
 }


 // add a label for each node:
 var labelOffsetX = 10;
 var labelOffsetY = 10;
 var fontSize = 20;
 var textAngle = 0;
 var textColour = "#ffff00";
 for (var i=0;i<position.length;i++){
  var LpositionRotated = rotate(position[i],[el,az,0]);
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
   "id": "label_"+i,
  });

  // the text node has been created, so insert the node's label
  var textNode = document.createTextNode(labels[i]);
  newText.appendChild(textNode);
  document.getElementById("group"+N).appendChild(newText);

 }

}
