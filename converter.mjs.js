const FORMATS = [
	//common image formats used on the web
	{ type: 'bmp', name: 'BMP' },
	{ type: 'gif', name: 'GIF' },
	{ type: 'vnd.microsoft.icon', name: 'ICO', letterbox: true, letterboxRatioXY: 1 },
	{ type: 'jpeg', name: 'JPEG' },
	{ type: 'png', name: 'PNG', transparency: true },
	{ type: 'svg+xml', name: 'SVG', transparency: true },
	{ type: 'tiff', name: 'TIFF', transparency: true },
	{ type: 'webp', name: 'WebP', transparency: true },
	
	//more formats
	//TODO
];

const SUPPORTED_FORMATS = [];
getSupportedOutputFormats();

const DEFAULT_DIMENSION = 250,
	DEFAULT_BACKGROUND = '#FFF';

function getSupportedOutputFormats(){
	//console.log('getSupportedOutputFormats()');
	
	if(SUPPORTED_FORMATS.length) return SUPPORTED_FORMATS;
	
	const canvas = document.createElement('canvas');
	
	canvas.width = canvas.height = 1;
	
	//test each format to see if the browser can convert the canvas to an image (data URI) in that format
	for(let i=0; i<FORMATS.length; i++){
		let type = FORMATS[i].type;
		if(canvas.toDataURL('image/'+type).startsWith(`data:image/${type};`)){
			//data URI is of the type requested; format is supported
			SUPPORTED_FORMATS.push(FORMATS[i]);
		}
	}
	
	//sort the formats by name
	SUPPORTED_FORMATS.sort( (a,b) => a.name.localeCompare(b.name) );
	
	return SUPPORTED_FORMATS;
}

function convertImage(blob, type, width, height, backgroundColor = DEFAULT_BACKGROUND){
	//console.log('convertImage()');
	
	return new Promise((resolve, reject) => {
		let format = SUPPORTED_FORMATS.find( f => f.type === type );
		
		if(!format) return reject('Unsupported MIME type: image/'+type);
		
		let img = new Image();
		
		img.addEventListener('load', function (evt){
			URL.revokeObjectURL(this.src);
			let dataURI = generateImageURI(this, format, width, height, backgroundColor);
			resolve(dataURI);
		}, false);
		
		img.addEventListener('error', function (evt){
			URL.revokeObjectURL(this.src);
			reject('Error loading the image');
		}, false);
		
		img.src = URL.createObjectURL(blob);
	});
}

function calculateDimensions(imgElem, formatObj, width, height){
	//console.log('calculateDimensions()');
	
	let imageWidth, imageHeight, canvasWidth, canvasHeight, offsetX, offsetY;
	
	if(width && height){
		imageWidth = width;
		imageHeight = height;
	}
	else if(width){
		imageWidth = width;
		if(imgElem.naturalWidth && imgElem.naturalHeight){
			imageHeight = imgElem.naturalHeight * (width / imgElem.naturalWidth);
		}
		else{
			imageHeight = imgElem.naturalHeight || DEFAULT_DIMENSION;
		}
	}
	else if(height){
		imageHeight = height;
		if(imgElem.naturalWidth && imgElem.naturalHeight){
			imageWidth = imgElem.naturalWidth * (height / imgElem.naturalHeight);
		}
		else{
			imageWidth = imgElem.naturalWidth || DEFAULT_DIMENSION;
		}
	}
	else{
		imageWidth = imgElem.naturalWidth || DEFAULT_DIMENSION;
		imageHeight = imgElem.naturalHeight || DEFAULT_DIMENSION;
	}
	
	if(formatObj.letterbox){
		canvasWidth = imageWidth;
		canvasHeight = imageWidth / (formatObj.letterboxRatioXY || 1);
		if(canvasHeight < imageHeight){
			canvasHeight = imageHeight;
			canvasWidth = imageHeight * (formatObj.letterboxRatioXY || 1);
		}
	}
	else{
		canvasWidth = imageWidth;
		canvasHeight = imageHeight;
	}
	
	//offsets to center the image on the canvas
	offsetX = (canvasWidth-imageWidth)/2;
	offsetY = (canvasHeight-imageHeight)/2;
	
	return {
		image: { width: imageWidth, height: imageHeight },
		canvas: { width: canvasWidth, height: canvasHeight },
		offset: { x: offsetX, y: offsetY }
	};
}

function generateImageURI(imgElem, formatObj, width, height, backgroundColor){
	//console.log('generateImageURI()');
	
	const dims = calculateDimensions(imgElem, formatObj, width, height);
	
	const canvas = document.createElement('canvas'),
		context = canvas.getContext('2d');
	
	canvas.width = dims.canvas.width;
	canvas.height = dims.canvas.height;
	
	if(!formatObj.transparency){	//this format doesn't support transparency
		//draw the default background first, in case an alpha value is used in the user's chosen background color
		context.fillStyle = DEFAULT_BACKGROUND;
		context.fillRect(0, 0, canvas.width, canvas.height);
	}
	
	//draw the chosen background color
	context.fillStyle = backgroundColor || DEFAULT_BACKGROUND;
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	//draw the image
	context.drawImage(imgElem, dims.offset.x, dims.offset.y, dims.image.width, dims.image.height);
	
	return canvas.toDataURL('image/'+formatObj.type);
}


export { getSupportedOutputFormats as supportedFormats, convertImage };
