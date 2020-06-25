/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function canvasScale(pos=[0,0]){
 // scaling:
// var offsetX = parseFloat($("#theoffsetX").val()); // pixels, but allow float
// var offsetY = parseFloat($("#theoffsetY").val()); // pixels, but allow float
 var offsetX = 0; // zero for now but this could be a control
 var offsetY = 0;
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
 document.getElementById("graphareaCubeGraph").setAttribute("style","width:"+document.getElementById("cubeGraphControls").clientWidth+"px;");
 document.getElementById("thecubegraph").setAttribute("style","width:"+document.getElementById("cubeGraphControls").clientWidth+"px;");
 setControls();
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* Set the control displays to their current value */
function setControls(){
 theedgelengthOutput.value=theedgelength.value;
 therotangleOutput.value=therotangle.value;
 thenodesizeOutput.value=thenodesize.value;
}

/* ********************************************************************************************* */
/* ********************************************************************************************* */
/* ********************************************************************************************* */
function createCubeGraph(){
 // create an adjacency matrix for the cube graph:
 Nnodes = 8;
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
 position[7] = [1,0,1];
}


function drawCubeGraph(){
 // create the graph
 createCubeGraph();

 // get user control values
 var rotangle = $("#therotangle").val();
 var nodeRadius = $("#thenodesize").val();
 var lineWidth = nodeRadius; // for now!

 // add a marker for each node
 for (var i=0;i<Nnodes;i++){
  screenpositionI = canvasScale(position[i]);
  $(document.createElementNS("http://www.w3.org/2000/svg","circle")).attr({
   "fill": "#000000",
   "stroke": "none",
   "r": nodeRadius,
   "cx": screenpositionI[0],
   "cy": screenpositionI[1],
  }).appendTo("#thecubegraph");
  // and draw any edges to "later" nodes (to avoid duplicate edges)
  for (var j=i;j<Nnodes;j++){
   if (adjMatrix[i][j]){ // yes, connect nodes i and j
    screenpositionJ = canvasScale(position[j]);
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
     "id": i+"_"+j,
    }).appendTo("#thecubegraph");
   }
  }
 }

}
