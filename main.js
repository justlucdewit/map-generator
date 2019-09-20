var PERLIN_YWRAPB = 4;
var PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
var PERLIN_ZWRAPB = 8;
var PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
var PERLIN_SIZE = 4095;
var perlin_octaves = 4;
var perlin_amp_falloff = 0.5;

seed = []

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
			
			r = Math.random();
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
	trigger = this.value;
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
let trigger = 0.6;

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
			if (noise((x+xoff)*zoom, (y+yoff)*zoom)>trigger){
				ctx.fillStyle = "rgb(0, "+map(noise((x+xoff)*0.01, (y+yoff)*0.01), 0, 1, 255, 0)+",0)"
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
			if (noise((x+xoff)*zoom, (y+yoff)*zoom)>trigger){
				string+=map(noise((x+xoff)*0.01, (y+yoff)*0.01), 0, 1, maxheight, 0)
			}else{
				string+=map(trigger, 0, 1, maxheight, 0);
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
				console.log("OH NO", c4);
				c4 = 0;
			}
			if (c3 >= 7744){
				console.log("OH NO", c3);
				c3 = 0;
			}
			if (c1 >= 7655){
				console.log("OH NO", c1);
				c1 = 0;
			}
			if (c2 >= 7656){
				console.log("OH NO", c2);
				c2 = 0;
			}

			txt+="f "+c1+" "+c2+" "+c3+" "+c4+"\n";
			if (x==20*8 && y==20*8){
				console.table([c1, c2, c3, c4])
			}
		}
	}
	console.log(txt);
}

exportOBJ()