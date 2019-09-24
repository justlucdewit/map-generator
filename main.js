function RNG(seed) {
  // LCG using GCC's constants
  this.m = 0x80000000; // 2**31;
  this.a = 1103515245;
  this.c = 12345;

  this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function() {
  this.state = (this.a * this.state + this.c) % this.m;
  return this.state;
}
RNG.prototype.nextFloat = function() {
  // returns in range [0,1]
  return this.nextInt() / (this.m - 1);
}
RNG.prototype.nextRange = function(start, end) {
  // returns in range [start, end): including start, excluding end
  // can't modulu nextInt because of weak randomness in lower bits
  var rangeSize = end - start;
  var randomUnder1 = this.nextInt() / this.m;
  return start + Math.floor(randomUnder1 * rangeSize);
}
RNG.prototype.choice = function(array) {
  return array[this.nextRange(0, array.length)];
}

var PERLIN_YWRAPB = 4;
var PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
var PERLIN_ZWRAPB = 8;
var PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
var PERLIN_SIZE = 4095;
var perlin_octaves = 4;
var perlin_amp_falloff = 0.5;

seed = []
myrng = new RNG(Math.round(Math.random())*999999999999999999999999999999999999999999999999999999999999999999999999999999999999999);

var scaled_cosine = function scaled_cosine(i) {
	return 0.5 * (1.0 - Math.cos(i * Math.PI));
};

var perlin;

function noise(x, y, z) {
	y = y || 0;
	z = z || 0;

	if (perlin == null) {
		perlin = new Array(PERLIN_SIZE + 1);
		for (var i = 0; i < PERLIN_SIZE + 1; i++) {
			
			r = myrng.nextFloat();
			perlin[i] = r;
			seed.push(r)
		}
	}

	if (x < 0) {
		x = -x;
	}
	if (y < 0) {
		y = -y;
	}
	if (z < 0) {
		z = -z;
	}

	var xi = Math.floor(x),
	yi = Math.floor(y),
	zi = Math.floor(z);
	var xf = x - xi;
	var yf = y - yi;
	var zf = z - zi;
	var rxf, ryf;

	var r = 0;
	var ampl = 0.5;

	var n1, n2, n3;

	for (var o = 0; o < perlin_octaves; o++) {
		var of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

		rxf = scaled_cosine(xf);
		ryf = scaled_cosine(yf);

		n1 = perlin[of & PERLIN_SIZE];
		n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
		n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
		n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
		n1 += ryf * (n2 - n1);

		of += PERLIN_ZWRAP;
		n2 = perlin[of & PERLIN_SIZE];
		n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
		n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
		n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
		n2 += ryf * (n3 - n2);

		n1 += scaled_cosine(zf) * (n2 - n1);

		r += n1 * ampl;
		ampl *= perlin_amp_falloff;
		xi <<= 1;
		xf *= 2;
		yi <<= 1;
		yf *= 2;
		zi <<= 1;
		zf *= 2;

		if (xf >= 1.0) {
			xi++;
			xf--;
		}
		if (yf >= 1.0) {
			yi++;
			yf--;
		}
		if (zf >= 1.0) {
			zi++;
			zf--;
		}
	}
	return r;
};

function map(n, imin, imax, omin, omax){
	return omin+(omax-omin)*(n-imin)/(imax-imin)
}

//get dom elements
let triggerSlider = document.getElementById("trigger");
let ampfalloffSlider = document.getElementById("ampfalloff");
let qualitySlider = document.getElementById("quality");
let moveSpeedSlider = document.getElementById("move speed");

//dom events
triggerSlider.oninput = function(){
	sandtrigger = parseFloat(this.value);
	grasstrigger = parseFloat(this.value)+0.05;
	snowtrigger = parseFloat(this.value)+0.15;
}

ampfalloffSlider.oninput = function(){
	perlin_amp_falloff = this.value
}

qualitySlider.oninput = function(){
	quality = parseInt(this.value);
}

moveSpeedSlider.oninput = function(){
	speed = this.value
}

//get canvas and context
canvas = document.getElementById("map");
ctx = canvas.getContext("2d");

canvas.height = 700;
canvas.width = 700;


function getSeed(){
	str = ""
	for (let l = 0; l < seed.length; l++){
		str+=seed[l]+";"
	}
	console.log(str);
}

let quality = 8;
let xoff = 0;
let yoff = 0;
let speed = 4;
let zoom = 0.01;

let sandtrigger = 0.6
let grasstrigger = sandtrigger+0.05;
let snowtrigger = sandtrigger+0.15;

var keys = {};
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; }

function drawLand(){
	if (xoff < 0){
		xoff = 0;
	}

	if (yoff < 0){
		yoff = 0
	}

	if (keys[83]){
		yoff+=quality*speed;
	}
	if (keys[87]){
		yoff-=quality*speed;
	}
	if (keys[65]){
		xoff-=quality*speed;
	}
	if (keys[68]){
		xoff+=quality*speed;
	}
	if (keys[82]){
		zoom *= 1.05
	}
	if (keys[70]){
		zoom *= 0.95
	}
	ctx.fillStyle = "#170DE0";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	for (let x = 0; x < canvas.width; x+=quality){
		for (let y = 0; y < canvas.height; y+=quality){
			ctx.fillStyle = "#2FC816";
			value = noise((x+xoff)*zoom, (y+yoff)*zoom);
			if(value>snowtrigger ){
				ctx.fillStyle = "rgb(255, 255, 255)";
				ctx.fillRect(x, y, quality, quality);
			}else if (value>grasstrigger){
				ctx.fillStyle = "rgb(0, "+map(value, 0, 1, 255, 0)+",0)";
				ctx.fillRect(x, y, quality, quality);
			}else if (value>sandtrigger) {
				ctx.fillStyle = "#E9E75D";
				ctx.fillRect(x, y, quality, quality);
			}
		}
	}
}

setInterval(drawLand, 100);

function exportOBJ(){
	let maxheight = 255;
	let txt = "o object\n";

	//create vertices
	for (let x = 0; x < canvas.width; x+=quality){
		for (let y = 0; y < canvas.height; y+=quality){
			let string = "v "+x+" "+y+" ";
			if (noise((x+xoff)*zoom, (y+yoff)*zoom)>grasstrigger){
				string+=map(noise((x+xoff)*0.01, (y+yoff)*0.01), 0, 1, maxheight, 0)
			}else{
				string+=map(grasstrigger, 0, 1, maxheight, 0);
			}
			txt+=string+"\n";
		}
	}

	//createFaces
	for (let x = 0; x < canvas.width-16; x+=quality){
		for (let y = 0; y < canvas.height-16; y+=quality){

			let c1 = (x/8+1)+((y/8+1)*Math.round(canvas.width/quality));
			let c2 = ((x/8+1)+((y/8+1)*Math.round(canvas.width/quality)))+1;
			let c4 = ((x/8+1)+(((y/8+1)+1)*Math.round(canvas.width/quality))+1);
			let c3 = (x/8+1)+(((y/8+1)+1)*Math.round(canvas.width/quality));
			

			if (c4 >= 7744){
				c4 = 0;
			}
			if (c3 >= 7744){
				c3 = 0;
			}
			if (c1 >= 7655){
				c1 = 0;
			}
			if (c2 >= 7656){
				c2 = 0;
			}

			txt+="f "+c1+" "+c2+" "+c3+" "+c4+"\n";
			if (x==20*8 && y==20*8){
				console.table([c1, c2, c3, c4])
			}
		}
	}
	return txt;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

//exportOBJ()
function setseed(){
	let str = document.getElementById('seed').value;
	console.log(str.value);
	str = str.replaceAll("a", 1);
	str = str.replaceAll("b", 2);
	str = str.replaceAll("c", 3);
	str = str.replaceAll("d", 4);
	str = str.replaceAll("e", 5);
	str = str.replaceAll("f", 6);
	str = str.replaceAll("g", 7);
	str = str.replaceAll("h", 8);
	str = str.replaceAll("i", 9);
	str = str.replaceAll("j", 10);
	str = str.replaceAll("k", 11);
	str = str.replaceAll("l", 12);
	str = str.replaceAll("m", 13);
	str = str.replaceAll("n", 14);
	str = str.replaceAll("o", 15);
	str = str.replaceAll("p", 16);
	str = str.replaceAll("q", 17);
	str = str.replaceAll("r", 18);
	str = str.replaceAll("s", 19);
	str = str.replaceAll("t", 20);
	str = str.replaceAll("u", 21);
	str = str.replaceAll("v", 22);
	str = str.replaceAll("w", 23);
	str = str.replaceAll("x", 24);
	str = str.replaceAll("y", 25);
	str = str.replaceAll("z", 26);
	str = str.replaceAll("A", 27);
	str = str.replaceAll("B", 28);
	str = str.replaceAll("C", 29);
	str = str.replaceAll("D", 30);
	str = str.replaceAll("E", 31);
	str = str.replaceAll("F", 32);
	str = str.replaceAll("G", 33);
	str = str.replaceAll("H", 34);
	str = str.replaceAll("I", 35);
	str = str.replaceAll("J", 36);
	str = str.replaceAll("K", 37);
	str = str.replaceAll("L", 38);
	str = str.replaceAll("M", 39);
	str = str.replaceAll("N", 40);
	str = str.replaceAll("O", 41);
	str = str.replaceAll("P", 42);
	str = str.replaceAll("Q", 43);
	str = str.replaceAll("R", 44);
	str = str.replaceAll("S", 45);
	str = str.replaceAll("T", 46);
	str = str.replaceAll("U", 47);
	str = str.replaceAll("V", 48);
	str = str.replaceAll("W", 49);
	str = str.replaceAll("X", 50);
	str = str.replaceAll("Y", 51);
	str = str.replaceAll("Z", 52);
	str = str.replaceAll(" ", 53);
	perlin = null;
	myrng = new RNG(parseInt(str));
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function downloadObject(){
	let txt = exportOBJ();
	download("terrainModel", txt);
	alert("to view the model, please rename \nterrainModel.txt to terrainModel.obj")
}