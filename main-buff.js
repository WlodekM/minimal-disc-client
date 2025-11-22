import { Canvas, createCanvas, loadImage, Image } from '@napi-rs/canvas';
import fs from 'node:fs'
import sdl from '@kmamal/sdl';
import * as colors from './colors.js'
import font from './font.js';

const [width, height] = [600, 350];

const screen_buffer = new Uint8Array(width * height * 4)

function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

/** @type {{[K in keyof colors]: number[]}} */
const byteColors = Object.fromEntries(
	Object.entries(colors)
	.map(([name,value]) => {
		if (Array.isArray(value)) return [name, value];
		const bytes = hexToBytes(value.slice(1,value.length))
		return[name,

			[bytes[0], bytes[1], bytes[2],255]
		]
	})
)

// console.log(Object.entries(byteColors).map(([n, c]) => [n, [
// 	c[0].toString(16),
// 	c[1].toString(16),
// 	c[2].toString(16),
// 	c[3].toString(16)
// ]]))

// console.log()

// const processedFonts = [];
// for (let id = 0; id < font.length; id++) {
// 	const char_data = font[id];
// 	const image_data = ctx.createImageData(8, 13)
// 	for (let y = 0; y < char_data.length; y++) {
// 		const row = char_data[char_data.length-y-1];
// 		const bits = [...Array(8)].map((x,i)=>row>>i&1);
// 		for (let x = 0; x < 8; x++) {
// 			// if (!bits[7-x])
// 			// 	continue;
			
// 			// console.log(image_data.data, x, y, bits[7-x] ?
// 			// 		byteColors.foreground :
// 			// 		byteColors.background,
// 			// 	(y * (8*4)) + x * 4)
// 			image_data.data.set(
// 				bits[7-x] ?
// 					byteColors.foreground :
// 					byteColors.background,
// 				(y * (8*4)) + x * 4
// 			)
// 		}
// 	}
	
// 	// if (processedFonts.length > 1){
// 	// 	console.log(id)
// 	// 	fs.writeFileSync('char.bin', image_data.data)
// 	// 	throw 1;
// 	// }
// 	processedFonts.push(image_data)
// }

function makeWindow() {
	const config = {
		title: "simplecord",
		width: width,
		height: height,
		// borderless: true,
		resizable: false,
		// skipTaskbar: true
		// alwaysOnTop: true,
		//flags: sdl.video.POPUP_MENU, // or POPUP_MENU
		// flags: 0x0000000040000000

	}
	if (sdl.video?.createWindow)
		return sdl.video?.createWindow(config)
	return new sdl.Window(config)
}
const sdl_window = makeWindow();

/**
 * @template {any = string} T
 */
class Store {
	static _id = 0;
	/** @type {Map<number, (value: T) => void>} @private */
	listeners = new Map();
	/** @type {T} @readonly */
	value;
	/**
	 * @param {(value: T) => void} listener
	 * @returns {number}
	 */
	listen(listener) {
		const this_id = ++this._id;
		this.listeners.set(this_id, listener);
		return this_id
	}
	/**
	 * @param {number} id
	 */
	unlisten(id) {
		this.listeners.delete(id)
	}
	/**
	 * @param {T} value
	 */
	set(value) {
		this.value = value;
		for (const listener of this.listeners.values()) {
			listener(value);
		}
		return value;
	}
	/**
	 * @param {T} intial_value
	 */
	constructor(intial_value) {
		this.value = intial_value;
	}
}

class Rendering {
	/**
	 * @param {string} char
	 * @param {number} x
	 * @param {number} y
	 */
	static char(char, x, y) {
		const id = char.charCodeAt(0);
		if (id < 32 || id > 127)
			id = 63; // ?
		const charData = font[id-32];
		// console.log(charData)
		
		//TODO: specified color
		// ctx.putImageData(charData, x, y)
		// fs.writeFileSync('char.bin', charData.data)
		// ctx.fillStyle = colors.foreground;
		for (let y_offset = 0; y_offset < charData.length; y_offset++) {
			const row = charData[charData.length-y_offset-1];
			const bits = [...Array(8)].map((x,i)=>row>>i&1);
			for (let x_offset = 0; x_offset < 8; x_offset++) {
				if (!bits[7-x_offset])
					continue;
				this.dot(x+x_offset,y+y_offset, byteColors.foreground)
				// ctx.fillRect(x+x_offset,y+y_offset,1,1);
			}
		}
	}
	/**
	 * @param {string} text
	 * @param {number} x
	 * @param {number} y
	 * @returns {[number, number]}
	 */
	static text(text, x, y) {
		let char_id = 0;
		let x_offset = 0;
		let y_offset = 0;
		while (char_id < text.length) {
			const char = text[x_offset];
			if (char == '\n') {
				y_offset++;continue;
			}
			this.char(
				char,
				x + (x_offset*9), // 8 width + 1 px of padding
				y + (y_offset*14)
			)
			x_offset++
			char_id++
		}
		return [x_offset+1, y_offset]
	}
	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {[number, number, number, number]} color 
	 */
	static dot(x, y, color) {
		screen_buffer.set(color, ((y*width*4)+(x*4)))
	}
	/**
	 * @param {[number, number, number, number]} color 
	 */
	static fill(x1, y1, x2, y2, color) {
		const _x1 = Math.min(x1, x2)
		const _x2 = Math.max(x1, x2)
		const _y1 = Math.min(y1, y2)
		const _y2 = Math.max(y1, y2)
		for (let x = _x1; x < _x2; x++) {
			for (let y = _y1; y < _y2; y++) {
				this.dot(x, y, color)
			}
		}
	}
	static BG() {
		// ctx.fillStyle = colors.background
		// ctx.fillRect(0, 0, width, height)
		this.fill(0, 0, width, height, byteColors.background)
	}
	static line_bresenham(x0, y0, x1, y1, color) {
		let dx = x1 - x0
		let dy = y1 - y0
	
		let xsign = +(dx > 0) * 2 - 1
		let ysign = +(dy > 0) * 2 - 1
	
		dx = Math.abs(dx)
		dy = Math.abs(dy)
	
		let [xx, xy, yx, yy] = [0,0,0,0];
		if (dx > dy)
			[xx, xy, yx, yy] = [xsign, 0, 0, ysign]
		else {
			[dx, dy] = [dy, dx]
			[xx, xy, yx, yy] = [0, ysign, xsign, 0]
		}
	
		let D = 2*dy - dx
		let y = 0
	
		for (let x = 0; x < dx + 1; x++) {
			this.dot(x0 + x*xx + y*yx, y0 + x*xy + y*yy, color)
			if (D >= 0) {
				y += 1
				D -= 2*dx
			}
			D += 2*dy
		}
	}
	static line(x1, y1, x2, y2, color) {
		const dx = x1 - x2;
		const dy = y1 - y2;
		if (dx != 0 && dy != 0)
			return this.line_bresenham(x1, y1, x2, y2, color);
		if (dx) {
			const _x1 = Math.min(x1, x2)
			const _x2 = Math.max(x1, x2)
			for (let x = _x1; x < _x2; x++) {
				this.dot(x, y1, color)
			}
			return
		}
		const _y1 = Math.min(y1, y2)
		const _y2 = Math.max(y1, y2)
		for (let y = _y1; y < _y2; y++) {
			this.dot(x1, y, color)
		}
		return
	}
	static init() {
		// ctx.imageSmoothingEnabled = false;
	}
}

const stores = {
	page: new Store("colors")
}

const pages = {
	test(delta) {
		Rendering.BG()
		Rendering.text(`meow meow meow abcdefghijklmnop ${delta}`, 1, 1);
		Rendering.line(0, 15, width, 15, byteColors.foreground)
		Rendering.line(0, 0, width-1, height-1, byteColors.foreground)
		// for (let x = 0; x < height; x++) {
		// 	Rendering.dot(x, x, [255, 0, 255, 255])
		// }
	},
	colors() {
		Rendering.BG();
		let x = 0;
		let y = 0;
		for (const color_name in byteColors) {
			if (color_name*9+1+x > width) {
				x = 0;
				y+=15
			}
			const color = byteColors[color_name]
			Rendering.fill(x, y, color_name*9+1+x, y+14, color);
			const [dx, dy] = Rendering.text(color_name, x, y);
			x += dx;
			y += dy;
		}
	}
}

function render(delta) {
	const page = stores.page.value;
	(pages[page] ?? pages.test)(delta);
	const buffer = Buffer.from(screen_buffer)
	// fs.writeFileSync('canvas.bin', buffer)
	sdl_window.render(width, height, width * 4, 'rgba32', buffer)
	setImmediate(render)
}

const targetFPS = 60;
const frameNs = BigInt(Math.round(1e9 / targetFPS));

let last = process.hrtime.bigint();

function loop() {
	const now = process.hrtime.bigint();
	const delta = Number(now - last) / 1e9;
	last = now;

	render(delta)

	const next = now + frameNs;

	const delay_ms = Number(next - process.hrtime.bigint()) / 1e6;

	if (delay_ms > 0) {
		setTimeout(loop, delay_ms);
	} else {
		setImmediate(loop);
	}
}

loop();
// render()

