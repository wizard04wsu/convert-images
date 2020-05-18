import * as Converter from './converter.mjs.js'


//checkerboard pattern to use behind images to help distinguish transparent portions
document.styleSheets[0].insertRule(`.tile img { background: url('${createTransparencyBackground()}') repeat; }`);

function createTransparencyBackground(){
	//console.log('createTransparencyBackground()');
	
	const canvas = document.createElement('canvas'),
		context = canvas.getContext('2d');
	
	canvas.width = canvas.height = 16;
	context.fillStyle = '#FFF';
	context.fillRect(0, 0, 16, 16);
	context.fillStyle = '#DDD';
	context.fillRect(8, 0, 8, 8);
	context.fillRect(0, 8, 8, 8);
	
	return canvas.toDataURL('image/png');
}


let files;

function refreshTiles(){
	//console.log('refreshTiles()');
	
	if(!files) return;
	
	//remove all the existing tiles
	document.getElementById('images').innerHTML = '';
	
	let type = document.getElementById('toType').value,
		width = document.getElementById('width').value,
		height = document.getElementById('height').value,
		backgroundColor = document.getElementById('transparent').checked ? 'transparent' : document.getElementById('color').value;
	
	//process files that have an image MIME type
	for(let i=0; i<files.length; i++){
		if(/^image\//.test(files[i].type)){
			addTile(files[i], type, width, height, backgroundColor);
		}
	}
}

function addTile(blob, type, width, height, backgroundColor){
	//console.log('addTile()');
	
	Converter.convertImage(blob, type, width, height, backgroundColor)
	.then(dataURI => {
		let div = document.createElement('div');
		div.classList.add('tile');
		let img = new Image();
		img.src = dataURI;
		div.appendChild(img);
		document.getElementById('images').appendChild(div);
	})
	.catch(msg => {
		//TODO
		console.log(msg);
	});
}


const _state = {
	transparent: true,
	backgroundColor: '',
};

function onChangeType(evt){
	//console.log('onChangeType()');
	
	let type = document.getElementById('toType').value,
		cb_transparent = document.getElementById('transparent'),
		txt_color = document.getElementById('color');
	
	if(Converter.supportedFormats().find(f=>f.type===type).transparency){	//the format supports transparency
		cb_transparent.disabled = false;
		if(_state.transparent && !cb_transparent.checked){
			cb_transparent.checked = true;
			_state.backgroundColor = txt_color.value;
			txt_color.value = 'transparent';
			txt_color.disabled = true;
		}
	}
	else{	//the format does not support transparency
		if(cb_transparent.checked){
			cb_transparent.checked = false;
			txt_color.disabled = false;
			txt_color.value = _state.backgroundColor;
		}
		cb_transparent.disabled = true;
	}
	
	refreshTiles();
}

function onChangeTransparent(evt){
	//console.log('onChangeTransparent()');
	
	let cb_transparent = document.getElementById('transparent'),
		txt_color = document.getElementById('color');
	
	_state.transparent = cb_transparent.checked;
	if(_state.transparent){
		_state.backgroundColor = txt_color.value;
		txt_color.value = 'transparent';
		txt_color.disabled = true;
	}
	else{
		txt_color.value = _state.backgroundColor;
		txt_color.disabled = false;
	}
	
	refreshTiles();
}

function processFiles(evt){
	//prevent dropped files from being opened by the browser
	evt.preventDefault();
	
	//process the files
	files = evt.dataTransfer.files;
	refreshTiles();
}


document.addEventListener('DOMContentLoaded', evt => {
	
	document.documentElement.addEventListener('dragover', evt=>evt.preventDefault(), false);
	document.documentElement.addEventListener('drop', processFiles, false);
	document.getElementById('toType').addEventListener('change', onChangeType, false);
	document.getElementById('width').addEventListener('change', refreshTiles, false);
	document.getElementById('height').addEventListener('change', refreshTiles, false);
	document.getElementById('color').addEventListener('change', refreshTiles, false);
	document.getElementById('transparent').addEventListener('change', onChangeTransparent, false);
	
	//===== add supported formats to the drop-down list =====
	
	let formats = Converter.supportedFormats();
	const sel = document.getElementById("toType");
	for(let i=0; i<formats.length; i++){
		let opt = document.createElement('option');
		opt.value = formats[i].type;
		if(opt.value === 'png') opt.selected = true;
		opt.textContent = formats[i].name;
		sel.appendChild(opt);
	}
	
}, false);
