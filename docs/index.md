<!DOCTYPE html>

<html lang="en">
<head>
	
	<meta charset="UTF-8">
	
	<title>Convert Images</title>
	
	<style>
		canvas {
			display: none;
		}
		img {
			display: block;
			margin: 20px;
			box-shadow: 0 0 10px #000;
		}
		label {
			padding-right: 0.85rem;
		}
		#width,
		#height {
			width: 4rem;
			margin-right: 0.2rem;
		}
	</style>
	
	<script>
		(function (){
			"use strict";
			
			let files;
			
			const canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d'),
				state = {
					transparency: true,
					prevType: 'png'
				};
			
			//===== create the transparency pattern =====
			
			canvas.width = canvas.height = 16;
			ctx.fillStyle = '#FFF';
			ctx.fillRect(0, 0, 16, 16);
			ctx.fillStyle = '#DDD';
			ctx.fillRect(8, 0, 8, 8);
			ctx.fillRect(0, 8, 8, 8);
			
			const transparencyPattern = ctx.createPattern(canvas, 'repeat');
			
			//===== add event listners =====
			
			document.addEventListener('DOMContentLoaded', evt => {
				document.documentElement.addEventListener('drop', dropHandler, false);
				document.documentElement.addEventListener('dragover', dragOverHandler, false);
				document.getElementById('toType').addEventListener('change', convertImages, false);
				document.getElementById('width').addEventListener('change', convertImages, false);
				document.getElementById('height').addEventListener('change', convertImages, false);
				document.getElementById('color').addEventListener('change', convertImages, false);
				document.getElementById('transparent').addEventListener('change', convertImages, false);
			}, false);
			
			//==========
			
			function dragOverHandler(evt){
				//prevent the browser's drag & drop handling
				evt.preventDefault();
			}
			
			function dropHandler(evt){
				//prevent dropped files from being opened by the browser
				evt.preventDefault();
				
				//process the files
				files = evt.dataTransfer.files;
				if(files.length){
					convertImages();
				}
			}
			
			//remove all generated images from the page
			function removeImages(){
				let images = document.getElementsByTagName('img');
				while(images.length){
					images[0].remove();
				}
			}
			
			//use the canvas to generate images in the selected format
			function convertImages(evt){
				removeImages();
				
				let toType = document.getElementById('toType').value,
					cb_transparent = document.getElementById('transparent');
				
				//if the selected format has changed
				if(toType !== state.prevType){
					if(toType === 'png'){	//the format supports transparency
						//restore the checkbox to its previous state
						cb_transparent.checked = state.transparency;
						cb_transparent.disabled = false;
					}
					else{	//the format does not support transparency
						//save the state of the checkbox, then uncheck it
						state.transparency = cb_transparent.checked;
						cb_transparent.checked = false;
						cb_transparent.disabled = true;
					}
					state.prevType = toType;
				}
				
				//process files that have an image MIME type
				if(files){
					for(let i=0; i<files.length; i++){
						let file = files[i];
						if(/^image\//.test(file.type)){
							convertImage(file, toType);
						}
					}
				}
			}
			
			//use the canvas to generate an image in the specified format
			function convertImage(file, format){
				const img = new Image(),
					url = URL.createObjectURL(file),
					txt_color = document.getElementById('color'),
					cb_transparent = document.getElementById('transparent');
				
				img.addEventListener('load', handleImgLoad, false);
				img.src = url;
				
				function handleImgLoad(evt){
					img.removeEventListener('load', handleImgLoad, false);
					
					//===== calculate the size of the canvas and the size of the image drawn on it =====
					
					const icon = format === 'vnd.microsoft.icon',
						defaultSize = icon ? 64 : 300;
					
					let requestedWidth = document.getElementById('width').value,
						requestedHeight = document.getElementById('height').value,
						toWidth, toHeight,
						canvasWidth, canvasHeight,
						canvasOffsetX = 0, canvasOffsetY = 0;
					
					if(requestedWidth && !requestedHeight && img.naturalWidth){
						//scale the image to make the width equal requestedWidth
						toWidth = requestedWidth;
						toHeight = img.naturalHeight * toWidth / img.naturalWidth;
					}
					else if(!requestedWidth && requestedHeight && img.naturalHeight){
						//scale the image to make the height equal requestedHeight
						toHeight = requestedHeight;
						toWidth = img.naturalWidth * toHeight / img.naturalHeight;
					}
					else{
						//use the requested dimensions, the browser's interpretation of the image's dimensions, or our default value
						toWidth = requestedWidth || img.naturalWidth || defaultSize;
						toHeight = requestedHeight || img.naturalHeight || defaultSize;
					}
					
					canvasWidth = toWidth;
					canvasHeight = toHeight;
					if(icon){	//square canvas; image centered on canvas
						//get the canvas dimensions to make it square, and center the image on the canvas
						if(canvasWidth > canvasHeight){
							canvasOffsetY = (canvasWidth-canvasHeight)/2;
							canvasHeight = canvasWidth;
						}
						else if(canvasHeight > canvasWidth){
							canvasOffsetX = (canvasHeight-canvasWidth)/2;
							canvasWidth = canvasHeight;
						}
					}
					
					//===== draw the image on the canvas =====
					
					canvas.width = canvasWidth;
					canvas.height = canvasHeight;
					
					//draw the background color/pattern
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					if(!cb_transparent.disabled && cb_transparent.checked){	//transparency is enabled
						ctx.fillStyle = transparencyPattern;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						ctx.fillStyle = txt_color.value || 'transparent';
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}
					else{	//transparency is disabled or unsupported
						ctx.fillStyle = '#FFF';
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						ctx.fillStyle = txt_color.value || '#FFF';
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}
					
					//draw the image
					ctx.drawImage(img, canvasOffsetX, canvasOffsetY, toWidth, toHeight);
					
					URL.revokeObjectURL(url);
					
					//generate the image element
					const data = canvas.toDataURL('image/'+format);
					img.src = data;
					document.body.appendChild(img);
				}
			}
		})();
	</script>
	
</head>
<body>
	<p>
		Drop image files anywhere on the page to convert them to 
		<select id="toType">
			<!--<option value="bmp">BMP</option>-->
			<!--<option value="gif">GIF</option>-->
			<!--<option value="vnd.microsoft.icon">ICO</option>-->
			<option value="jpeg">JPEG</option>
			<option value="png" selected>PNG</option>
		</select>
	</p>
	
	<div>
		<label>Width <input id="width" type="number" min="1" step="1">px</label>
		<label>Height <input id="height" type="number" min="1" step="1">px</label>
		<label>Background Color <input id="color" type="text" placeholder="#FFF"></label>
		<label>Enable Transparency <input id="transparent" type="checkbox" checked></label>
	</div>
</body>
</html>