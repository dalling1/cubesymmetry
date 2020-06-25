/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function canvasScale3D(pos=[0,0,0],offsetX=0,offsetY=0){
 var canvaswidth = $('#thecubegraph').width();
 var canvasheight = $('#thecubegraph').height();
 var centreX = Math.round(canvaswidth/2) + offsetX;
 var centreY = Math.round(canvasheight/2) + offsetY;
 var useScale = 100;
 if (pos.length==3){
  // single coordinate given as input:
  var newpos = [centreX + useScale*pos[0], canvasheight - (centreY + useScale*pos[1])];
 } else {
  // array of coordinates given as input:
  var newpos = Array(pos.length);
  for (var i=0;i<pos.length;i++){
   newpos[i] = [centreX + useScale*pos[i][0], canvasheight - (centreY + useScale*pos[i][1])];
  }
 }
 return newpos;
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
  "r": 2,
  "cx": 50,
  "cy": 50,
  "id": "joystick",
 }).appendTo("#therotator");
 // make therotator listen for clicks:
 document.getElementById("therotator").addEventListener("click", setRotator);
 // set the control labels to the control values:
 setControls();
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function setRotator(event){
 // "therotator" is a "touch-pad"-like control which lets the user define two rotation angles
 // -- these will be scaled between some max and min values according to the position on the panel
 // -- the "joystick" is the dot marking the current value of therotator
 var debug = false;
 dx = document.getElementById("therotator").getBoundingClientRect().x;
 dy = document.getElementById("therotator").getBoundingClientRect().y;
 document.getElementById("joystick").setAttribute("cx",Math.round(event.clientX-dx));
 document.getElementById("joystick").setAttribute("cy",Math.round(event.clientY-dy));
 if (debug) console.log($("#joystick").attr("cx")+", "+$("#joystick").attr("cy"));
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* Set the control displays to their current value */
function setControls(){
 theedgelengthOutput.value=theedgelength.value;
 therotangleOutput.value=therotangle.value;
 thenodesizeOutput.value=thenodesize.value;
 thelinewidthOutput.value=thelinewidth.value;
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
 // rotAngles should contain three values, alpha, beta and gamma, for rotation about the x-, y- and z-axes, respectively
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

 // create a position array for the cube graph:
 position = new Array(Nnodes);
 position.fill([0,0,0]); // initialise with all nodes at (0,0,0) (later we might do proper 3D rotation and projection)

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
 position[0] = [0,0,0];
 position[1] = [0,0,1];
 position[2] = [1,0,1];
 position[3] = [1,0,0];
 position[4] = [0,1,0];
 position[5] = [0,1,1];
 position[6] = [1,1,1];
 position[7] = [1,1,0];
}


function drawCubeGraph(){
 // clear the existing SVG element:
 wipeCanvas();
 // create the graph:
 createCubeGraph();

 // get user control values:
 var rotangle = parseFloat($("#therotangle").val());
 var nodeRadius = $("#thenodesize").val();
 var lineWidth = $("#thelinewidth").val();

 /*
  This approach draws the nodes first, and then the edges.
  We should switch to using SVG groups, so that which element is "on top" in the drawing can be managed more easily.
 */

 // add a marker for each node:
 for (var i=0;i<position.length;i++){
  screenpositionI = canvasScale3D(rotate(position[i],[rotangle,30,0]));
  $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
   "fill": "#000000",
   "stroke": "none",
   "r": nodeRadius,
   "cx": screenpositionI[0],
   "cy": screenpositionI[1],
   // give the node an id just in case we need it:
   "id": "node_"+i,
  }).appendTo("#thecubegraph");
 }
 for (var i=0;i<position.length;i++){
  // draw any edges to "later" nodes (to avoid duplicate edges)
  for (var j=i;j<position.length;j++){
   if (adjMatrix[i][j]){ // yes, connect nodes i and j
    screenpositionI = canvasScale3D(rotate(position[i],[rotangle,30,0]));
    screenpositionJ = canvasScale3D(rotate(position[j],[rotangle,30,0]));
    $(document.createElementNS("http://www.w3.org/2000/svg","line")).attr({
     "stroke": "#ff0000",
     "stroke-dasharray": "none",
     "stroke-width": lineWidth,
     "stroke-linecap": "round",
     "x1": screenpositionI[0],
     "y1": screenpositionI[1],
     "x2": screenpositionJ[0],
     "y2": screenpositionJ[1],
     // give the edge an id just in case we need it:
     "id": "edge_"+i+"_"+j,
    }).appendTo("#thecubegraph");
   }
  }
 }

}
